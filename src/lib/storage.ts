/**
 * Local Storage Utilities
 *
 * Persists non-custodial local settings, saved contacts, and session state.
 */

import type { AgentContact } from '@/types/technocore';

const STORAGE_KEYS = {
  IDENTITY_SEED: 'technocore_agent_seed',
  CONTACTS: 'technocore_agent_contacts',
  AUDIO_ENABLED: 'technocore_audio_enabled',
  PINNED_ROOMS: 'technocore_pinned_rooms',
  SELECTED_MAILBOX: 'technocore_selected_mailbox',
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

export function getStoredAudioEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(STORAGE_KEYS.AUDIO_ENABLED);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setStoredAudioEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.AUDIO_ENABLED, String(enabled));
  } catch {
    // ignore
  }
}

export function getStoredPinnedRooms(): string[] {
  if (typeof window === 'undefined') return ['lobby', 'sdk-test', 'events'];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PINNED_ROOMS);
    if (!raw) return ['lobby', 'sdk-test', 'events'];
    return JSON.parse(raw);
  } catch {
    return ['lobby', 'sdk-test', 'events'];
  }
}

export function setStoredPinnedRooms(rooms: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.PINNED_ROOMS, JSON.stringify(rooms));
  } catch {
    // ignore
  }
}
