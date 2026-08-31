'use client';

import { useState, useEffect, useCallback } from 'react';
import { getStoredContacts, setStoredContacts } from '@/lib/storage';
import { agentMailboxRoom } from '@/lib/crypto/fingerprint';
import { isValidDid } from '@/lib/crypto/did';
import type { AgentContact } from '@/types/technocore';

const DEFAULT_SEED_CONTACTS: AgentContact[] = [
  {
    id: 'seed-agent-alpha',
    nickname: 'Alpha Mesh Sentinel',
    did: 'did:key:z6Mkw14GYYf2up8rho9TkgYVXQakxDEPjSaZPbJ65dY6FXKG',
    notes: 'Technocore ecosystem verification relay node',
    createdAt: Date.now() - 86400000 * 2,
    lastInteractedAt: Date.now() - 3600000,
    mailboxRoom: agentMailboxRoom('did:key:z6Mkw14GYYf2up8rho9TkgYVXQakxDEPjSaZPbJ65dY6FXKG'),
  },
  {
    id: 'seed-agent-nexus',
    nickname: 'Nexus Courier',
    did: 'did:key:z6MkjTShwS5aM9F7mR4P9r8L1m3N6q5X8v2Z1c4V7b0A9s',
    notes: 'Autonomous task coordinator and room bridge',
    createdAt: Date.now() - 86400000,
    lastInteractedAt: Date.now() - 7200000,
    mailboxRoom: agentMailboxRoom('did:key:z6MkjTShwS5aM9F7mR4P9r8L1m3N6q5X8v2Z1c4V7b0A9s'),
  },
];

export function useContacts() {
  const [contacts, setContacts] = useState<AgentContact[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const stored = getStoredContacts();
    if (stored && stored.length > 0) {
      setContacts(stored);
    } else {
      setContacts(DEFAULT_SEED_CONTACTS);
      setStoredContacts(DEFAULT_SEED_CONTACTS);
    }
    setIsLoaded(true);
  }, []);

  const addContact = useCallback(
    (params: { nickname: string; did: string; notes?: string }) => {
      const cleanDid = params.did.trim();
      if (!isValidDid(cleanDid)) {
        throw new Error('Invalid Technocore DID. Expected 56 characters starting with did:key:z6Mk...');
      }

      const newContact: AgentContact = {
        id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        nickname: params.nickname.trim() || 'Anonymous Agent',
        did: cleanDid,
        notes: params.notes?.trim(),
        createdAt: Date.now(),
        mailboxRoom: agentMailboxRoom(cleanDid),
      };

      setContacts((prev) => {
        const next = [newContact, ...prev.filter((c) => c.did !== cleanDid)];
        setStoredContacts(next);
        return next;
      });

      return newContact;
    },
    []
  );

  const updateContact = useCallback((id: string, updates: Partial<AgentContact>) => {
    setContacts((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      setStoredContacts(next);
      return next;
    });
  }, []);

  const deleteContact = useCallback((id: string) => {
    setContacts((prev) => {
      const next = prev.filter((c) => c.id !== id);
      setStoredContacts(next);
      return next;
    });
  }, []);

  const getContactByDid = useCallback(
    (did: string) => {
      return contacts.find((c) => c.did === did);
    },
    [contacts]
  );

  return {
    contacts,
    isLoaded,
    addContact,
    updateContact,
    deleteContact,
    getContactByDid,
  };
}
