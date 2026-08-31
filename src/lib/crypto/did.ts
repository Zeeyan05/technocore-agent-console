/**
 * Technocore DID Operations
 *
 * Ed25519 did:key identifier creation, validation, and key extraction.
 * Multicodec prefix: 0xed 0x01
 * Multibase: base58btc with 'z' prefix
 * Format: did:key:z6Mk... (56 characters)
 */

import { base58btcEncode, base58btcDecode } from './encode';
import { DID_PATTERN, DID_LENGTH } from '@/types/technocore';

const ED25519_MULTICODEC_PREFIX = new Uint8Array([0xed, 0x01]);
const DID_KEY_PREFIX = 'did:key:z';

/**
 * Generate a DID string from a 32-byte Ed25519 public key.
 */
export function didFromPublicKey(publicKey: Uint8Array): string {
  if (publicKey.length !== 32) {
    throw new Error(`Expected 32-byte Ed25519 public key, got ${publicKey.length} bytes`);
  }

  const multicodecKey = new Uint8Array(34);
  multicodecKey.set(ED25519_MULTICODEC_PREFIX);
  multicodecKey.set(publicKey, 2);

  const encoded = base58btcEncode(multicodecKey);
  return `did:key:z${encoded}`;
}

/**
 * Extract the raw 32-byte Ed25519 public key from a DID string.
 */
export function publicKeyFromDid(did: string): Uint8Array {
  validateDid(did);

  const encoded = did.slice(DID_KEY_PREFIX.length);
  const decoded = base58btcDecode(encoded);

  if (
    decoded.length !== 34 ||
    decoded[0] !== 0xed ||
    decoded[1] !== 0x01
  ) {
    throw new Error(
      `DID does not contain a valid Ed25519 multicodec key (expected 0xed01 prefix, 34 bytes)`
    );
  }

  return decoded.slice(2);
}

/**
 * Validate a DID string format (throws on error).
 */
export function validateDid(did: string): void {
  if (typeof did !== 'string') {
    throw new Error('DID must be a string');
  }
  if (did.length !== DID_LENGTH) {
    throw new Error(`DID must be exactly ${DID_LENGTH} characters, got ${did.length}`);
  }
  if (!DID_PATTERN.test(did)) {
    throw new Error('DID must match did:key:z6Mk[base58btc]{44}');
  }
}

/**
 * Check if a string is a valid Technocore DID (non-throwing boolean).
 */
export function isValidDid(did: string): boolean {
  return typeof did === 'string' && did.length === DID_LENGTH && DID_PATTERN.test(did);
}

/**
 * Abbreviate a DID for human display: `z6Mk...4XzK`
 */
export function formatDidAbbreviated(did: string): string {
  if (!did) return '';
  if (!isValidDid(did)) return did;
  const key = did.replace('did:key:', '');
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}
