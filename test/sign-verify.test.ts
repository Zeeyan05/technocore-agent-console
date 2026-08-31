import { describe, it, expect } from 'vitest';
import { Identity } from '../src/lib/identity';
import { verifyMessage, verifyRawComponents } from '../src/lib/crypto/verify';
import { SIG_PATTERN, SIG_LENGTH } from '../src/types/technocore';
import type { TechnocoreMessage } from '../src/types/technocore';

describe('Technocore Signing & Cryptographic Verification', () => {
  it('signs and verifies a valid message offline', async () => {
    const identity = await Identity.generate();
    const room = 'mb-agent-1';
    const text = 'Hello peer agent!';

    const signResult = await identity.signMessage(room, text);

    expect(signResult.sig.length).toBe(SIG_LENGTH);
    expect(SIG_PATTERN.test(signResult.sig)).toBe(true);

    const message: TechnocoreMessage = {
      seq: 42,
      ts: new Date().toISOString(),
      from: identity.did,
      text: signResult.sweptText,
      nonce: signResult.nonce,
      sig: signResult.sig,
    };

    const breakdown = await verifyMessage(room, message);

    expect(breakdown.valid).toBe(true);
    expect(breakdown.didFormatValid).toBe(true);
    expect(breakdown.signatureFormatValid).toBe(true);
    expect(breakdown.signatureValid).toBe(true);
    expect(breakdown.did).toBe(identity.did);
    expect(breakdown.publicKeyHex).toBe(identity.publicKeyHex);
    expect(breakdown.fingerprint).toBe(identity.fingerprint);
    expect(breakdown.error).toBeUndefined();
  });

  it('rejects tampered text with cryptographic mismatch', async () => {
    const identity = await Identity.generate();
    const room = 'lobby';
    const originalText = 'Real message';

    const signResult = await identity.signMessage(room, originalText);

    // Tamper with text
    const message: TechnocoreMessage = {
      seq: 100,
      ts: new Date().toISOString(),
      from: identity.did,
      text: 'Tampered message',
      nonce: signResult.nonce,
      sig: signResult.sig,
    };

    const breakdown = await verifyMessage(room, message);

    expect(breakdown.valid).toBe(false);
    expect(breakdown.didFormatValid).toBe(true);
    expect(breakdown.signatureFormatValid).toBe(true);
    expect(breakdown.signatureValid).toBe(false);
    expect(breakdown.error).toContain('cryptographic mismatch');
  });

  it('rejects message if room is mismatched', async () => {
    const identity = await Identity.generate();
    const signedRoom = 'room-a';
    const targetRoom = 'room-b';
    const text = 'Message in room A';

    const signResult = await identity.signMessage(signedRoom, text);

    const message: TechnocoreMessage = {
      seq: 101,
      ts: new Date().toISOString(),
      from: identity.did,
      text: signResult.sweptText,
      nonce: signResult.nonce,
      sig: signResult.sig,
    };

    // Verify against different room
    const breakdown = await verifyMessage(targetRoom, message);

    expect(breakdown.valid).toBe(false);
    expect(breakdown.signatureValid).toBe(false);
  });

  it('handles manual verifyRawComponents correctly', async () => {
    const identity = await Identity.generate();
    const room = 'events';
    const text = 'Manual verification test';

    const signResult = await identity.signMessage(room, text);

    const breakdown = await verifyRawComponents(
      room,
      identity.did,
      signResult.nonce,
      signResult.sweptText,
      signResult.sig
    );

    expect(breakdown.valid).toBe(true);
  });
});
