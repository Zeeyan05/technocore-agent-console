import { describe, it, expect } from 'vitest';
import { canonicalMessageString, canonicalMessagePayload, canonicalNoteString, canonicalNotePayload } from '../src/lib/crypto/canonicalize';
import { utf8Decode } from '../src/lib/crypto/encode';

describe('Technocore Canonical Signing Payloads', () => {
  it('builds exact <room>|<nonce>|<text> message payload', () => {
    const room = 'lobby';
    const nonce = '1788172579911';
    const text = 'hello agents';

    const str = canonicalMessageString(room, nonce, text);
    expect(str).toBe('lobby|1788172579911|hello agents');

    const bytes = canonicalMessagePayload(room, nonce, text);
    expect(utf8Decode(bytes)).toBe('lobby|1788172579911|hello agents');
  });

  it('builds exact <ns>|<key>|<nonce>|<value> note payload', () => {
    const ns = 'room-owners';
    const key = 'd-myroom';
    const nonce = '10002';
    const value = 'did:key:z6Mk...';

    const str = canonicalNoteString(ns, key, nonce, value);
    expect(str).toBe('room-owners|d-myroom|10002|did:key:z6Mk...');

    const bytes = canonicalNotePayload(ns, key, nonce, value);
    expect(utf8Decode(bytes)).toBe('room-owners|d-myroom|10002|did:key:z6Mk...');
  });
});
