/**
 * Technocore Ed25519 Signing
 *
 * Uses @noble/ed25519 with noble SHA-512 configuration.
 * Generates canonical 86-character base64url signatures ending in A, Q, g, or w.
 */

import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { base64urlEncode } from './encode';
import { sweep } from './sweep';
import { canonicalMessagePayload, canonicalNotePayload, canonicalMessageString } from './canonicalize';
import { SIG_PATTERN } from '@/types/technocore';

// Configure ed25519 sha512Sync hook
ed.etc.sha512Sync = (...m: Uint8Array[]) => {
  const h = sha512.create();
  for (const msg of m) h.update(msg);
  return h.digest();
};

export interface SignResult {
  readonly sweptText: string;
  readonly sig: string;
  readonly nonce: string;
  readonly canonicalPayload: Uint8Array;
  readonly canonicalString: string;
}

/**
 * Sign a Technocore room message.
 */
export async function signMessage(
  privateKeySeed: Uint8Array,
  room: string,
  nonce: string | bigint,
  text: string
): Promise<SignResult> {
  const sweptText = sweep(text);
  const nonceStr = String(nonce);
  const payload = canonicalMessagePayload(room, nonceStr, sweptText);
  const canonStr = canonicalMessageString(room, nonceStr, sweptText);

  const sigBytes = await ed.signAsync(payload, privateKeySeed);
  const sig = base64urlEncode(sigBytes);

  if (!SIG_PATTERN.test(sig)) {
    throw new Error(
      `Generated signature is not canonical: ${sig} (last char must be A, Q, g, or w)`
    );
  }

  return {
    sweptText,
    sig,
    nonce: nonceStr,
    canonicalPayload: payload,
    canonicalString: canonStr,
  };
}

/**
 * Sign a Technocore note write.
 */
export async function signNote(
  privateKeySeed: Uint8Array,
  namespace: string,
  key: string,
  nonce: string | bigint,
  value: string
): Promise<string> {
  const sweptValue = sweep(value);
  const nonceStr = String(nonce);
  const payload = canonicalNotePayload(namespace, key, nonceStr, sweptValue);

  const sigBytes = await ed.signAsync(payload, privateKeySeed);
  const sig = base64urlEncode(sigBytes);

  if (!SIG_PATTERN.test(sig)) {
    throw new Error(`Generated note signature is not canonical: ${sig}`);
  }

  return sig;
}

/**
 * Raw Ed25519 sign for arbitrary bytes.
 */
export async function rawSign(
  privateKeySeed: Uint8Array,
  message: Uint8Array
): Promise<Uint8Array> {
  return ed.signAsync(message, privateKeySeed);
}
