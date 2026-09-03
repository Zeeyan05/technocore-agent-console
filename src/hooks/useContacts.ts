'use client';

import { useState, useEffect, useCallback } from 'react';
import { getStoredContacts, setStoredContacts } from '@/lib/storage';
import { agentMailboxRoom } from '@/lib/crypto/fingerprint';
import { isValidDid } from '@/lib/crypto/did';
import type { AgentContact } from '@/types/technocore';

export function useContacts() {
  const [contacts, setContacts] = useState<AgentContact[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const stored = getStoredContacts();
    // Validate every stored contact: contacts are user-created only. Any entry
    // with an invalid DID (e.g. older fabricated demo data) is dropped rather
    // than shown as a live agent.
    const valid = (stored || []).filter((c) => c && isValidDid(c.did));
    if (valid.length !== (stored || []).length) {
      setStoredContacts(valid);
    }
    setContacts(valid);
    setIsLoaded(true);
  }, []);

  const addContact = useCallback(
    (params: { nickname: string; did: string; mailboxRoom?: string; notes?: string }) => {
      const cleanDid = params.did.trim();
      if (!isValidDid(cleanDid)) {
        throw new Error('Invalid Technocore DID. Expected 56 characters starting with did:key:z6Mk...');
      }

      const explicitMailbox = params.mailboxRoom?.trim() || agentMailboxRoom(cleanDid);

      const newContact: AgentContact = {
        id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        nickname: params.nickname.trim() || 'Anonymous Agent',
        did: cleanDid,
        notes: params.notes?.trim(),
        createdAt: Date.now(),
        mailboxRoom: explicitMailbox,
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
