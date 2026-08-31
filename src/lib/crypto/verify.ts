/**
 * Technocore Ed25519 Verification
 *
 * Standalone offline cryptographic verification.
 * Does NOT fake results — validates DID format, signature format, and genuine Noble Ed25519 math.
 */

import * as ed from '@noble/ed25519';
import { base64urlDecode, bytesToHex } from './encode';
import { publicKeyFromDid, isValidDid } from './did';
import { canonicalMessagePayload, canonicalMessageString } from './canonicalize';
import { didFingerprint } from './fingerprint';
import { SIG_PATTERN, SIG_LENGTH } from '@/types/technocore';
import type { TechnocoreMessage, VerificationBreakdown } from '@/types/technocore';

/**
 * Verify a signed Technocore message with full protocol diagnostic breakdown.
 */
export async function verifyMessage(
  room: string,
  message: TechnocoreMessage
): Promise<VerificationBreakdown> {
  const did = message.from;

  // Step 1: DID syntax verification
  const didFormatValid = isValidDid(did);
  if (!didFormatValid) {
    return {
      valid: false,
      didFormatValid: false,
      signatureFormatValid: false,
      signatureValid: false,
      did,
      error: `Invalid DID format: ${did}`,
    };
  }

  const fingerprint = didFingerprint(did);

  // Step 2: Signature presence and format verification
  const sig = message.sig;
  if (!sig) {
    return {
      valid: false,
      didFormatValid: true,
      signatureFormatValid: false,
      signatureValid: false,
      did,
      fingerprint,
      error: 'Message has no signature field (unverified / historical record)',
    };
  }

  const signatureFormatValid =
    typeof sig === 'string' && sig.length === SIG_LENGTH && SIG_PATTERN.test(sig);

  if (!signatureFormatValid) {
    return {
      valid: false,
      didFormatValid: true,
      signatureFormatValid: false,
      signatureValid: false,
      did,
      fingerprint,
      error: 'Invalid signature format (expected 86-char base64url ending in A/Q/g/w)',
    };
  }

  // Step 3: Nonce validation
  if (message.nonce === undefined || message.nonce === null || String(message.nonce).trim() === '') {
    return {
      valid: false,
      didFormatValid: true,
      signatureFormatValid: true,
      signatureValid: false,
      did,
      fingerprint,
      error: 'Message is missing a valid protocol nonce',
    };
  }

  // Step 4: Cryptographic math verification
  try {
    const publicKey = publicKeyFromDid(did);
    const publicKeyHex = bytesToHex(publicKey);
    const sigBytes = base64urlDecode(sig);

    if (sigBytes.length !== 64) {
      return {
        valid: false,
        didFormatValid: true,
        signatureFormatValid: true,
        signatureValid: false,
        did,
        publicKeyHex,
        fingerprint,
        error: `Signature decoded to ${sigBytes.length} bytes, expected 64`,
      };
    }

    const nonceStr = String(message.nonce);
    const canonicalText = canonicalMessageString(room, nonceStr, message.text);
    const payload = canonicalMessagePayload(room, nonceStr, message.text);
    const canonicalPayloadHex = bytesToHex(payload);

    const signatureValid = await ed.verifyAsync(sigBytes, payload, publicKey);

    return {
      valid: signatureValid,
      didFormatValid: true,
      signatureFormatValid: true,
      signatureValid,
      did,
      publicKeyHex,
      fingerprint,
      canonicalPayloadText: canonicalText,
      canonicalPayloadHex,
      error: signatureValid ? undefined : 'Ed25519 signature verification failed (cryptographic mismatch)',
    };
  } catch (err) {
    return {
      valid: false,
      didFormatValid: true,
      signatureFormatValid: true,
      signatureValid: false,
      did,
      fingerprint,
      error: `Verification error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Verify arbitrary message components directly (useful for manual inspector & verifier tools).
 */
export async function verifyRawComponents(
  room: string,
  did: string,
  nonce: string | bigint,
  text: string,
  sig: string
): Promise<VerificationBreakdown> {
  const fakeMsg: TechnocoreMessage = {
    seq: 0,
    ts: new Date().toISOString(),
    from: did,
    text,
    nonce: String(nonce),
    sig,
  };
  return verifyMessage(room, fakeMsg);
}

/**
 * Low-level Ed25519 verification.
 */
export async function rawVerify(
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array
): Promise<boolean> {
  return ed.verifyAsync(signature, message, publicKey);
}
