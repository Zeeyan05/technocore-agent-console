/**
 * Technocore Canonical Signing Payloads
 *
 * Message payload: UTF-8 bytes of `<room>|<nonce>|<sweptText>`
 * Note payload:    UTF-8 bytes of `<namespace>|<key>|<nonce>|<sweptValue>`
 */

import { utf8Encode } from './encode';

/**
 * Build the canonical signing payload string for a room message.
 */
export function canonicalMessageString(
  room: string,
  nonce: string | bigint,
  sweptText: string
): string {
  return `${room}|${nonce}|${sweptText}`;
}

/**
 * Build the canonical signing payload bytes for a room message.
 */
export function canonicalMessagePayload(
  room: string,
  nonce: string | bigint,
  sweptText: string
): Uint8Array {
  return utf8Encode(canonicalMessageString(room, nonce, sweptText));
}

/**
 * Build the canonical signing payload string for a note write.
 */
export function canonicalNoteString(
  namespace: string,
  key: string,
  nonce: string | bigint,
  sweptValue: string
): string {
  return `${namespace}|${key}|${nonce}|${sweptValue}`;
}

/**
 * Build the canonical signing payload bytes for a note write.
 */
export function canonicalNotePayload(
  namespace: string,
  key: string,
  nonce: string | bigint,
  sweptValue: string
): Uint8Array {
  return utf8Encode(canonicalNoteString(namespace, key, nonce, sweptValue));
}
