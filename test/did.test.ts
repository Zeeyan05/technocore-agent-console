import { describe, it, expect } from 'vitest';
import { didFromPublicKey, publicKeyFromDid, validateDid, isValidDid, formatDidAbbreviated } from '../src/lib/crypto/did';
import { didFingerprint, didNotePath, agentMailboxRoom } from '../src/lib/crypto/fingerprint';
import * as ed from '@noble/ed25519';

describe('Technocore DID Operations', () => {
  it('generates a valid 56-char did:key from Ed25519 public key', async () => {
    const seed = ed.utils.randomPrivateKey();
    const pubKey = await ed.getPublicKeyAsync(seed);
    const did = didFromPublicKey(pubKey);

    expect(did).toMatch(/^did:key:z6Mk/);
    expect(did.length).toBe(56);
    expect(isValidDid(did)).toBe(true);
    expect(() => validateDid(did)).not.toThrow();
  });

  it('reconstructs the exact public key bytes from a valid DID', async () => {
    const seed = ed.utils.randomPrivateKey();
    const pubKey = await ed.getPublicKeyAsync(seed);
    const did = didFromPublicKey(pubKey);

    const extracted = publicKeyFromDid(did);
    expect(extracted).toEqual(pubKey);
    expect(extracted.length).toBe(32);
  });

  it('rejects malformed DIDs', () => {
    expect(isValidDid('did:key:z6Mkinvalidlength')).toBe(false);
    expect(isValidDid('did:example:12345')).toBe(false);
    expect(isValidDid('did:key:z6Mk00000000000000000000000000000000000000000000')).toBe(false); // '0' is not base58
    expect(() => validateDid('not-a-did')).toThrow();
  });

  it('formats abbreviated DIDs correctly', () => {
    const sampleDid = 'did:key:z6Mkw14GYYf2up8rho9TkgYVXQakxDEPjSaZPbJ65dY6FXKG';
    expect(formatDidAbbreviated(sampleDid)).toBe('z6Mk…FXKG');
  });

  it('computes 16-char hex fingerprint and sharded note paths', () => {
    const sampleDid = 'did:key:z6Mkw14GYYf2up8rho9TkgYVXQakxDEPjSaZPbJ65dY6FXKG';
    const fp = didFingerprint(sampleDid);
    expect(fp).toMatch(/^[0-9a-f]{16}$/);

    const notePath = didNotePath(sampleDid);
    expect(notePath.shard.length).toBe(2);
    expect(notePath.key.length).toBe(14);
    expect(notePath.namespace).toBe(`did-${notePath.shard}`);
    expect(notePath.path).toBe(`/kv/did-${notePath.shard}/${notePath.key}`);

    const mb = agentMailboxRoom(sampleDid);
    expect(mb).toBe(`mb-${fp}`);
  });
});
