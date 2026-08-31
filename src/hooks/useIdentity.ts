'use client';

import { useState, useEffect, useCallback } from 'react';
import { Identity } from '@/lib/identity';
import { getStoredSeed, setStoredSeed } from '@/lib/storage';

export function useIdentity() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize identity from storage or generate fresh
  useEffect(() => {
    let mounted = true;

    async function initIdentity() {
      try {
        const storedHex = getStoredSeed();
        if (storedHex) {
          try {
            const id = await Identity.fromHexSeed(storedHex);
            if (mounted) {
              setIdentity(id);
              setIsLoading(false);
            }
            return;
          } catch {
            // Invalid stored seed, fallback to fresh
          }
        }

        // Generate fresh identity
        const fresh = await Identity.generate();
        if (mounted) {
          setStoredSeed(fresh.exportHexSeed());
          setIdentity(fresh);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : String(err));
          setIsLoading(false);
        }
      }
    }

    initIdentity();
    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Generate a completely new random identity.
   */
  const generateNew = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fresh = await Identity.generate();
      setStoredSeed(fresh.exportHexSeed());
      setIdentity(fresh);
      return fresh;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Import an identity from a 64-char hex string, base58 string, or JSON.
   */
  const importIdentity = useCallback(async (input: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const trimmed = input.trim();
      let id: Identity;

      // Hex seed (64 chars)
      if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
        id = await Identity.fromHexSeed(trimmed);
      }
      // Base58btc string (around 43-45 chars)
      else if (/^[1-9A-HJ-NP-Za-km-z]{40,50}$/.test(trimmed)) {
        id = await Identity.fromBase58Seed(trimmed);
      }
      // Raw JSON format with seed or hexSeed
      else if (trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        const seedStr = parsed.seed || parsed.hexSeed || parsed.privateKey;
        if (typeof seedStr === 'string') {
          id = await Identity.fromHexSeed(seedStr);
        } else {
          throw new Error('JSON does not contain a valid hex seed property');
        }
      } else {
        throw new Error('Unsupported seed format. Provide a 64-character hex or base58 string.');
      }

      setStoredSeed(id.exportHexSeed());
      setIdentity(id);
      return id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear local identity.
   */
  const clearIdentity = useCallback(() => {
    setStoredSeed(null);
    setIdentity(null);
  }, []);

  return {
    identity,
    isLoading,
    error,
    generateNew,
    importIdentity,
    clearIdentity,
  };
}
