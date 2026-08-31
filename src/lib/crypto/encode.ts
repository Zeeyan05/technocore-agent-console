/**
 * Technocore Encoding Utilities
 *
 * Base64url without padding and base58btc for Ed25519 DIDs.
 */

import { base58 } from '@scure/base';

const B64URL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * Encode bytes to base64url (no padding).
 */
export function base64urlEncode(bytes: Uint8Array): string {
  let result = '';
  const len = bytes.length;
  let i = 0;

  for (; i + 2 < len; i += 3) {
    const b0 = bytes[i]!;
    const b1 = bytes[i + 1]!;
    const b2 = bytes[i + 2]!;
    result += B64URL_CHARS[(b0 >> 2)!]!;
    result += B64URL_CHARS[((b0 & 0x03) << 4) | (b1 >> 4)]!;
    result += B64URL_CHARS[((b1 & 0x0f) << 2) | (b2 >> 6)]!;
    result += B64URL_CHARS[b2 & 0x3f]!;
  }

  if (i < len) {
    const b0 = bytes[i]!;
    result += B64URL_CHARS[b0 >> 2]!;
    if (i + 1 < len) {
      const b1 = bytes[i + 1]!;
      result += B64URL_CHARS[((b0 & 0x03) << 4) | (b1 >> 4)]!;
      result += B64URL_CHARS[(b1 & 0x0f) << 2]!;
    } else {
      result += B64URL_CHARS[(b0 & 0x03) << 4]!;
    }
  }

  return result;
}

/**
 * Decode base64url string to bytes (no padding).
 */
export function base64urlDecode(str: string): Uint8Array {
  const lookup = new Uint8Array(128);
  for (let i = 0; i < B64URL_CHARS.length; i++) {
    lookup[B64URL_CHARS.charCodeAt(i)] = i;
  }

  const len = str.length;
  const outputLen = Math.floor((len * 3) / 4);
  const bytes = new Uint8Array(outputLen);
  let j = 0;

  for (let i = 0; i < len; i += 4) {
    const c0 = lookup[str.charCodeAt(i)]!;
    const c1 = lookup[str.charCodeAt(i + 1)]!;
    const c2 = i + 2 < len ? lookup[str.charCodeAt(i + 2)]! : 0;
    const c3 = i + 3 < len ? lookup[str.charCodeAt(i + 3)]! : 0;

    bytes[j++] = (c0 << 2) | (c1 >> 4);
    if (i + 2 < len) bytes[j++] = ((c1 & 0x0f) << 4) | (c2 >> 2);
    if (i + 3 < len) bytes[j++] = ((c2 & 0x03) << 6) | c3;
  }

  return bytes.slice(0, j);
}

/**
 * Encode bytes to base58btc string.
 */
export function base58btcEncode(bytes: Uint8Array): string {
  return base58.encode(bytes);
}

/**
 * Decode base58btc string to bytes.
 */
export function base58btcDecode(str: string): Uint8Array {
  return base58.decode(str);
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function utf8Encode(str: string): Uint8Array {
  return textEncoder.encode(str);
}

export function utf8Decode(bytes: Uint8Array): string {
  return textDecoder.decode(bytes);
}

/**
 * Convert bytes to lowercase hexadecimal string.
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hexadecimal string to bytes.
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.trim().toLowerCase().replace(/^0x/, '');
  if (cleanHex.length % 2 !== 0) {
    throw new Error('Hex string must have an even number of characters');
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const byte = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
    if (isNaN(byte)) throw new Error(`Invalid hex byte at index ${i * 2}`);
    bytes[i] = byte;
  }
  return bytes;
}

/**
 * Safely parse Technocore JSON without numeric precision loss on 19-digit nonces.
 */
export function parseTechnocoreJson<T>(rawJson: string): T {
  const safeJson = rawJson.replace(/"nonce"\s*:\s*([0-9]+)/g, '"nonce":"$1"');
  return JSON.parse(safeJson) as T;
}
