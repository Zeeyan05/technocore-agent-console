/**
 * Local Storage Utilities
 *
 * The only two things this app persists: the non-custodial Ed25519 seed and the
 * local contact book. Both stay on the device — nothing here is ever uploaded.
 */

import type { AgentContact } from '@/types/technocore';

const STORAGE_KEYS = {
  IDENTITY_SEED: 'technocore_agent_seed',
  CONTACTS: 'technocore_agent_contacts',
};

export function getStoredSeed(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEYS.IDENTITY_SEED);
  } catch {
    return null;
  }
}

export function setStoredSeed(hexSeed: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (hexSeed) {
      localStorage.setItem(STORAGE_KEYS.IDENTITY_SEED, hexSeed);
    } else {
      localStorage.removeItem(STORAGE_KEYS.IDENTITY_SEED);
    }
  } catch {
    // ignore
  }
}

export function getStoredContacts(): AgentContact[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTACTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function setStoredContacts(contacts: AgentContact[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  } catch {
    // ignore
  }
}
