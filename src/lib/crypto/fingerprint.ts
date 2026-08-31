/**
 * Technocore DID Fingerprint & Note Paths
 *
 * Fingerprint = first 16 lowercase hex chars of SHA-256(did).
 * Sharded path: /kv/did-{shard}/{remaining}
 * where shard = first 2 hex chars, remaining = next 14 hex chars.
 */

import { sha256 } from '@noble/hashes/sha256';
import { utf8Encode, bytesToHex } from './encode';

/**
 * Compute the 16-character hex DID fingerprint.
 */
export function didFingerprint(did: string): string {
  const hash = sha256(utf8Encode(did));
  return bytesToHex(hash.slice(0, 8));
}

/**
 * Get the sharded note path for a DID identity note.
 */
export function didNotePath(did: string): {
  shard: string;
  key: string;
  namespace: string;
  path: string;
} {
  const fp = didFingerprint(did);
  const shard = fp.slice(0, 2);
  const key = fp.slice(2);
  return {
    shard,
    key,
    namespace: `did-${shard}`,
    path: `/kv/did-${shard}/${key}`,
  };
}

/**
 * Derive the agent's default mailbox room name: `mb-<fingerprint>`
 */
export function agentMailboxRoom(did: string): string {
  const fp = didFingerprint(did);
  return `mb-${fp}`;
}
