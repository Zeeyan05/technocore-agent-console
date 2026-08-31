/**
 * Technocore Nonce Manager
 *
 * Manages strictly increasing monotonic nonces per (DID, room) pair.
 * Supports up to 19-digit integers via BigInt safely.
 */

export class NonceManager {
  readonly #lastNonce = new Map<string, bigint>();

  /**
   * Get next strictly increasing nonce for a given DID and room.
   */
  next(did: string, room: string): string {
    const key = `${did}|${room}`;
    const now = BigInt(Date.now());
    const last = this.#lastNonce.get(key) ?? 0n;

    const nonce = now > last ? now : last + 1n;
    this.#lastNonce.set(key, nonce);

    return nonce.toString();
  }

  /**
   * Set last known nonce for recovery or state update.
   */
  setLastNonce(did: string, room: string, nonce: string | bigint): void {
    const key = `${did}|${room}`;
    const n = typeof nonce === 'bigint' ? nonce : BigInt(nonce);
    const current = this.#lastNonce.get(key) ?? 0n;
    if (n > current) {
      this.#lastNonce.set(key, n);
    }
  }

  /**
   * Get the last issued nonce for a (did, room) pair.
   */
  getLastNonce(did: string, room: string): bigint | undefined {
    return this.#lastNonce.get(`${did}|${room}`);
  }

  /**
   * Clear all tracked nonces.
   */
  clear(): void {
    this.#lastNonce.clear();
  }
}
