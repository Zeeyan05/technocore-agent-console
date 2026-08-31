/**
 * Technocore Identity Manager
 *
 * Manages client-side Ed25519 keypair for signing Technocore messages.
 * Private key seed is strictly isolated in ES2022 private field (#seed).
 */

import * as ed from '@noble/ed25519';
import { didFromPublicKey } from './crypto/did';
import { signMessage, signNote } from './crypto/sign';
import { NonceManager } from './crypto/nonce';
import { bytesToHex, hexToBytes, base58btcEncode, base58btcDecode } from './crypto/encode';
import { didFingerprint, agentMailboxRoom } from './crypto/fingerprint';
import type { SignResult } from './crypto/sign';

export class Identity {
  readonly did: string;
  readonly publicKey: Uint8Array;
  readonly publicKeyHex: string;
  readonly fingerprint: string;
  readonly mailboxRoom: string;

  /** Private key seed — ES2022 private field, never serialized */
  readonly #seed: Uint8Array;
  readonly #nonceManager: NonceManager;

  private constructor(
    seed: Uint8Array,
    publicKey: Uint8Array,
    did: string,
    nonceManager?: NonceManager
  ) {
    this.#seed = seed;
    this.publicKey = publicKey;
    this.publicKeyHex = bytesToHex(publicKey);
    this.did = did;
    this.fingerprint = didFingerprint(did);
    this.mailboxRoom = agentMailboxRoom(did);
    this.#nonceManager = nonceManager ?? new NonceManager();
  }

  /**
   * Generate a fresh random Ed25519 identity.
   */
  static async generate(nonceManager?: NonceManager): Promise<Identity> {
    const seed = ed.utils.randomPrivateKey();
    return Identity.fromSeed(seed, nonceManager);
  }

  /**
   * Create an identity from a raw 32-byte seed.
   */
  static async fromSeed(
    seed: Uint8Array,
    nonceManager?: NonceManager
  ): Promise<Identity> {
    if (seed.length !== 32) {
      throw new Error(`Expected 32-byte seed, got ${seed.length} bytes`);
    }
    const publicKey = await ed.getPublicKeyAsync(seed);
    const did = didFromPublicKey(publicKey);
    return new Identity(seed, publicKey, did, nonceManager);
  }

  /**
   * Create an identity from a 64-character hexadecimal seed.
   */
  static async fromHexSeed(
    hex: string,
    nonceManager?: NonceManager
  ): Promise<Identity> {
    const seed = hexToBytes(hex);
    return Identity.fromSeed(seed, nonceManager);
  }

  /**
   * Create an identity from a base58btc seed.
   */
  static async fromBase58Seed(
    b58: string,
    nonceManager?: NonceManager
  ): Promise<Identity> {
    const seed = base58btcDecode(b58.trim());
    return Identity.fromSeed(seed, nonceManager);
  }

  /**
   * Sign a Technocore room message.
   */
  async signMessage(room: string, text: string): Promise<SignResult> {
    const nonce = this.#nonceManager.next(this.did, room);
    return signMessage(this.#seed, room, nonce, text);
  }

  /**
   * Sign a Technocore room message with manual nonce.
   */
  async signMessageWithNonce(
    room: string,
    nonce: string | bigint,
    text: string
  ): Promise<SignResult> {
    return signMessage(this.#seed, room, String(nonce), text);
  }

  /**
   * Sign a Technocore note write.
   */
  async signNote(
    namespace: string,
    key: string,
    value: string
  ): Promise<{ sig: string; nonce: string }> {
    const nonce = this.#nonceManager.next(this.did, `note:${namespace}:${key}`);
    const sig = await signNote(this.#seed, namespace, key, nonce, value);
    return { sig, nonce };
  }

  /**
   * Export copy of the 32-byte seed.
   * SECURITY: Explicit user consent required before calling.
   */
  exportSeed(): Uint8Array {
    return this.#seed.slice();
  }

  /**
   * Export seed as 64-character lowercase hex string.
   */
  exportHexSeed(): string {
    return bytesToHex(this.#seed);
  }

  /**
   * Export seed as base58 string.
   */
  exportBase58Seed(): string {
    return base58btcEncode(this.#seed);
  }

  get nonceManager(): NonceManager {
    return this.#nonceManager;
  }

  /**
   * Safe JSON representation — NEVER exposes private key material.
   */
  toJSON(): { did: string; publicKeyHex: string; fingerprint: string; mailboxRoom: string } {
    return {
      did: this.did,
      publicKeyHex: this.publicKeyHex,
      fingerprint: this.fingerprint,
      mailboxRoom: this.mailboxRoom,
    };
  }

  toString(): string {
    return `TechnocoreIdentity(${this.did})`;
  }
}
