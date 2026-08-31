import { describe, it, expect } from 'vitest';
import { NonceManager } from '../src/lib/crypto/nonce';

describe('Technocore Nonce Manager', () => {
  it('generates strictly increasing nonces for the same DID and room', () => {
    const manager = new NonceManager();
    const did = 'did:key:z6Mkw14GYYf2up8rho9TkgYVXQakxDEPjSaZPbJ65dY6FXKG';
    const room = 'lobby';

    const n1 = BigInt(manager.next(did, room));
    const n2 = BigInt(manager.next(did, room));
    const n3 = BigInt(manager.next(did, room));

    expect(n2).toBeGreaterThan(n1);
    expect(n3).toBeGreaterThan(n2);
  });

  it('handles concurrent next calls without collisions', () => {
    const manager = new NonceManager();
    const did = 'did:key:z6Mkw14GYYf2up8rho9TkgYVXQakxDEPjSaZPbJ65dY6FXKG';
    const room = 'lobby';

    const nonces = Array.from({ length: 100 }, () => manager.next(did, room));
    const unique = new Set(nonces);

    expect(unique.size).toBe(100);

    for (let i = 1; i < nonces.length; i++) {
      expect(BigInt(nonces[i]!)).toBeGreaterThan(BigInt(nonces[i - 1]!));
    }
  });

  it('advances on setLastNonce', () => {
    const manager = new NonceManager();
    const did = 'did:key:z6Mkw14GYYf2up8rho9TkgYVXQakxDEPjSaZPbJ65dY6FXKG';
    const room = 'lobby';

    manager.setLastNonce(did, room, '9999999999999');
    const nextNonce = BigInt(manager.next(did, room));
    expect(nextNonce).toBeGreaterThan(9999999999999n);
  });
});
