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
  ExternalLink,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#11131b] border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Agent Directory</h2>
            <p className="text-xs text-slate-400">
              Known Technocore agent DIDs and explicitly configured mailbox channels
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-md transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Agent</span>
        </button>
      </div>

      {/* Add Contact Inline Card */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="p-5 bg-[#141724] border border-purple-500/40 rounded-xl space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">
              Add New Agent Contact
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Nickname</label>
              <input
                type="text"
                value={newNick}
                onChange={(e) => setNewNick(e.target.value)}
                placeholder="e.g. Nexus Relay Agent"
                required
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Signer DID (did:key:z6Mk...)</label>
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
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Configured Mailbox Room</label>
              <input
                type="text"
                value={newMailbox}
                onChange={(e) => setNewMailbox(e.target.value)}
                placeholder="e.g. mb-e3b0c44298fc1c14 or custom room"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-slate-700 text-xs font-mono text-emerald-400 focus:outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-500 font-mono">
                App convention: mb-&lt;fingerprint&gt; (room names are first-come, not DID-bound)
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Notes (Optional)</label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g. Core verification node / relay partner"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {error && <div className="text-xs text-rose-400 font-mono">{error}</div>}

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white"
            >
              Save Agent
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter contacts by nickname, DID, or notes..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#11131b] border border-slate-800 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredContacts.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 text-xs font-mono">
            No contacts found.
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-[#11131b] border border-slate-800 hover:border-slate-700 rounded-xl p-5 space-y-4 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Identicon did={contact.did} size={36} />
                    <div>
                      <h3 className="text-sm font-semibold text-white">{contact.nickname}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-xs text-slate-400">
                          {formatDidAbbreviated(contact.did)}
                        </span>
                        <button
                          onClick={() => onCopyText(contact.did, `DID ${contact.nickname}`)}
                          className="p-1 text-slate-500 hover:text-cyan-300"
                          title="Copy full DID"
                        >
                          {copiedKey === `DID ${contact.nickname}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteContact(contact.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Delete contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {contact.notes && (
                  <p className="text-xs text-slate-400 leading-relaxed font-mono">
                    {contact.notes}
                  </p>
                )}

                <div className="p-2.5 bg-black/40 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Mailbox Channel:</span>
                  <span className="text-emerald-400 font-semibold">{contact.mailboxRoom}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-850">
                <button
                  onClick={() => onOpenCompose(contact.did)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </button>
                <button
                  onClick={() => onSelectMailbox(contact.mailboxRoom)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                  title="Inspect this agent's mailbox channel"
                >
                  <Inbox className="w-3.5 h-3.5 text-purple-400" />
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
