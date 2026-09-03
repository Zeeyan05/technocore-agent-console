'use client';

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Send,
  Trash2,
  Copy,
  Check,
  Inbox,
  Search,
} from 'lucide-react';
import { Identicon } from './Identicon';
import { formatDidAbbreviated } from '@/lib/crypto/did';
import { agentMailboxRoom } from '@/lib/crypto/fingerprint';
import type { AgentContact } from '@/types/technocore';

interface ContactsTabProps {
  contacts: AgentContact[];
  onAddContact: (contact: { nickname: string; did: string; mailboxRoom?: string; notes?: string }) => void;
  onDeleteContact: (id: string) => void;
  onOpenCompose: (recipientDid: string) => void;
  onSelectMailbox: (room: string) => void;
  onCopyText: (text: string, label: string) => void;
  copiedKey: string | null;
}

export const ContactsTab: React.FC<ContactsTabProps> = ({
  contacts,
  onAddContact,
  onDeleteContact,
  onOpenCompose,
  onSelectMailbox,
  onCopyText,
  copiedKey,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newNick, setNewNick] = useState<string>('');
  const [newDid, setNewDid] = useState<string>('');
  const [newMailbox, setNewMailbox] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  // Two-step delete: a contact is only removed after an explicit confirm click.
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredContacts = contacts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.nickname.toLowerCase().includes(q) ||
      c.did.toLowerCase().includes(q) ||
      c.mailboxRoom.toLowerCase().includes(q) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    );
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      onAddContact({
        nickname: newNick,
        did: newDid,
        mailboxRoom: newMailbox.trim() || undefined,
        notes: newNotes,
      });
      setNewNick('');
      setNewDid('');
      setNewMailbox('');
      setNewNotes('');
      setIsAdding(false);
    } catch (err: unknown) {
      setError((err as Error)?.message || String(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-line rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-ink-3" />
          <div>
            <h2 className="text-sm font-semibold text-ink">Agent Directory</h2>
            <p className="text-xs text-ink-3">
              Known agent DIDs with explicitly configured mailbox channels
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-on-accent text-xs font-bold transition-colors hover:bg-accent/85 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Agent</span>
        </button>
      </div>

      {/* Add Contact Inline Card */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="p-5 bg-surface border border-line-2 rounded-lg space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-2">
              Add New Agent Contact
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-ink-3 hover:text-ink"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-ink-2">Nickname</label>
              <input
                type="text"
                value={newNick}
                onChange={(e) => setNewNick(e.target.value)}
                placeholder="e.g. Relay Agent"
                required
                className="w-full px-3 py-2 rounded-md bg-bg/60 border border-line text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-ink-2">Signer DID (did:key:z6Mk...)</label>
              <input
                type="text"
                value={newDid}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewDid(val);
                  if (val.startsWith('did:key:') && val.length === 56 && !newMailbox) {
                    try {
                      setNewMailbox(agentMailboxRoom(val));
                    } catch {}
                  }
                }}
                placeholder="did:key:z6Mk..."
                required
                className="w-full px-3 py-2 rounded-md bg-bg/60 border border-line text-xs font-mono text-accent placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-ink-2">Configured Mailbox Room</label>
              <input
                type="text"
                value={newMailbox}
                onChange={(e) => setNewMailbox(e.target.value)}
                placeholder="e.g. mb-e3b0c44298fc1c14 or custom room"
                className="w-full px-3 py-2 rounded-md bg-bg/60 border border-line text-xs font-mono text-success placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
              />
              <span className="text-[10px] text-ink-4 font-mono">
                App convention: mb-&lt;fingerprint&gt; (room names are first-come, not DID-bound)
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-ink-2">Notes (Optional)</label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g. Verification node / relay partner"
                className="w-full px-3 py-2 rounded-md bg-bg/60 border border-line text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
              />
            </div>
          </div>

          {error && <div className="text-xs text-danger font-mono" role="alert">{error}</div>}

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-md bg-accent text-on-accent text-xs font-bold transition-colors hover:bg-accent/85"
            >
              Save Agent
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-ink-4 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter contacts by nickname, DID, or notes..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface border border-line text-xs font-mono text-ink placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
        />
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredContacts.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-3 p-12 text-center bg-surface/40 border border-dashed border-line rounded-lg">
            {contacts.length === 0 ? (
              <>
                <div className="p-3 rounded-full bg-surface-2 border border-line">
                  <Users className="w-6 h-6 text-ink-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-ink-2">No agent contacts yet</p>
                  <p className="text-xs text-ink-3 max-w-sm leading-relaxed">
                    Save an agent&apos;s DID once and you can route signed mail to its mailbox
                    channel without retyping the identifier.
                  </p>
                </div>
                <button
                  onClick={() => setIsAdding(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-accent text-on-accent text-xs font-bold transition-colors hover:bg-accent/85"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add your first agent</span>
                </button>
              </>
            ) : (
              <>
                <div className="p-3 rounded-full bg-surface-2 border border-line">
                  <Search className="w-6 h-6 text-ink-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-ink-2">No matching contacts</p>
                  <p className="text-xs text-ink-3 font-mono break-all max-w-sm">
                    Nothing matches &quot;{searchQuery}&quot;.
                  </p>
                </div>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-2 border border-line transition-colors"
                >
                  Clear filter
                </button>
              </>
            )}
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-surface border border-line hover:border-line-2 rounded-lg p-5 space-y-4 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Identicon did={contact.did} size={36} />
                    <div>
                      <h3 className="text-sm font-semibold text-ink">{contact.nickname}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-xs text-ink-3">
                          {formatDidAbbreviated(contact.did)}
                        </span>
                        <button
                          onClick={() => onCopyText(contact.did, `DID ${contact.nickname}`)}
                          className="p-1 text-ink-4 hover:text-accent"
                          title="Copy full DID"
                        >
                          {copiedKey === `DID ${contact.nickname}` ? (
                            <Check className="w-3 h-3 text-success" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {confirmDeleteId === contact.id ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          onDeleteContact(contact.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2 py-1 rounded-md bg-danger-tint text-danger text-[11px] font-semibold border border-danger/40 hover:bg-danger/20 transition-colors"
                      >
                        Confirm delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 rounded-md bg-surface-2 text-ink-3 text-[11px] font-medium border border-line hover:text-ink transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(contact.id)}
                      className="p-1.5 rounded-md text-ink-4 hover:text-danger hover:bg-surface-2 transition-colors shrink-0"
                      title="Delete contact"
                      aria-label={`Delete contact ${contact.nickname}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {contact.notes && (
                  <p className="text-xs text-ink-3 leading-relaxed font-mono">
                    {contact.notes}
                  </p>
                )}

                <div className="p-2.5 bg-bg/40 rounded-md border border-line font-mono text-[11px] text-ink-3 flex items-center justify-between">
                  <span>Mailbox Channel:</span>
                  <span className="text-success font-semibold">{contact.mailboxRoom}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-line">
                <button
                  onClick={() => onOpenCompose(contact.did)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-accent-tint hover:bg-accent/20 text-accent text-xs font-medium transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </button>
                <button
                  onClick={() => onSelectMailbox(contact.mailboxRoom)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 text-ink-2 text-xs font-medium border border-line transition-colors"
                  title="Inspect this agent's mailbox channel"
                >
                  <Inbox className="w-3.5 h-3.5 text-ink-3" />
                  <span>Inspect Channel</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};