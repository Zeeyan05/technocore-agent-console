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
  Pencil,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { Identicon } from './Identicon';
import { Disclosure } from './Disclosure';
import { CopyField } from './DataField';
import { formatDidAbbreviated, isValidDid } from '@/lib/crypto/did';
import { agentMailboxRoom } from '@/lib/crypto/fingerprint';
import type { AgentContact } from '@/types/technocore';

interface ContactDraft {
  nickname: string;
  did: string;
  mailboxRoom: string;
  notes: string;
}

const EMPTY_DRAFT: ContactDraft = { nickname: '', did: '', mailboxRoom: '', notes: '' };

interface ContactsTabProps {
  contacts: AgentContact[];
  onAddContact: (contact: {
    nickname: string;
    did: string;
    mailboxRoom?: string;
    notes?: string;
  }) => void;
  /** Saves an edit to an existing contact — name, mailbox or notes. */
  onUpdateContact: (id: string, updates: Partial<AgentContact>) => void;
  onDeleteContact: (id: string) => void;
  onOpenCompose: (recipientDid: string) => void;
  onSelectMailbox: (room: string) => void;
  onCopyText: (text: string, label: string) => void;
  copiedKey: string | null;
}

interface ContactFormProps {
  title: string;
  submitLabel: string;
  initial: ContactDraft;
  error: string | null;
  /** Editing cannot change which identity a contact is — only how it is labelled. */
  lockDid?: boolean;
  onCancel: () => void;
  onSubmit: (draft: ContactDraft) => void;
}

/**
 * One form serves both "add" and "edit". It is mounted fresh per target, so the
 * initial draft can seed state directly instead of syncing through an effect.
 */
const ContactForm: React.FC<ContactFormProps> = ({
  title,
  submitLabel,
  initial,
  error,
  lockDid = false,
  onCancel,
  onSubmit,
}) => {
  const [draft, setDraft] = useState<ContactDraft>(initial);
  const set = (patch: Partial<ContactDraft>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(draft);
      }}
      className="p-5 bg-surface border border-line-2 rounded-lg space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-ink">{title}</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-ink-3 hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="contact-name" className="block text-xs font-medium text-ink-2">
            Agent name
          </label>
          <input
            id="contact-name"
            type="text"
            value={draft.nickname}
            onChange={(e) => set({ nickname: e.target.value })}
            placeholder="e.g. Relay agent"
            required
            className="w-full px-3 py-2.5 rounded-md bg-bg/60 border border-line text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
          />
          <p className="text-[11px] text-ink-4">
            A label only you see. It is not part of the protocol.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contact-did" className="block text-xs font-medium text-ink-2">
            Agent identity
          </label>
          <input
            id="contact-did"
            type="text"
            value={draft.did}
            readOnly={lockDid}
            onChange={(e) => {
              const val = e.target.value;
              const next: Partial<ContactDraft> = { did: val };
              // Suggest the conventional mailbox once; never overwrite a custom one.
              if (!draft.mailboxRoom && isValidDid(val.trim())) {
                try {
                  next.mailboxRoom = agentMailboxRoom(val.trim());
                } catch {
                  /* leave it blank if the identity will not decode */
                }
              }
              set(next);
            }}
            placeholder="did:key:z6Mk…"
            required
            className={`w-full px-3 py-2.5 rounded-md bg-bg/60 border border-line text-xs font-mono text-accent placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors ${
              lockDid ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          />
          <p className="text-[11px] text-ink-4">
            {lockDid
              ? 'An identity cannot be edited. Remove this contact and add the new one instead.'
              : 'The did:key their messages are signed with.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="contact-mailbox" className="block text-xs font-medium text-ink-2">
            Mailbox
          </label>
          <input
            id="contact-mailbox"
            type="text"
            value={draft.mailboxRoom}
            onChange={(e) => set({ mailboxRoom: e.target.value })}
            placeholder="e.g. mb-e3b0c44298fc1c14"
            className="w-full px-3 py-2.5 rounded-md bg-bg/60 border border-line text-xs font-mono text-success placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
          />
          <p className="text-[11px] text-ink-4 leading-relaxed">
            Where you send them mail. Suggested from their identity, and you can change it —
            mailbox names are first-come and are not bound to a key.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contact-notes" className="block text-xs font-medium text-ink-2">
            Notes <span className="font-normal text-ink-4">(optional)</span>
          </label>
          <input
            id="contact-notes"
            type="text"
            value={draft.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="e.g. verification partner"
            className="w-full px-3 py-2.5 rounded-md bg-bg/60 border border-line text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-accent text-on-accent text-xs font-semibold transition-colors hover:bg-accent/85"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

/**
 * Whether the saved mailbox is the one this app would derive from the contact's
 * identity. Useful context, and deliberately not phrased as proof of ownership:
 * the name is first-come on the server.
 */
function usesDefaultMailbox(contact: AgentContact): boolean {
  try {
    return isValidDid(contact.did) && agentMailboxRoom(contact.did) === contact.mailboxRoom;
  } catch {
    return false;
  }
}

export const ContactsTab: React.FC<ContactsTabProps> = ({
  contacts,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onOpenCompose,
  onSelectMailbox,
  onCopyText,
  copiedKey,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
      (c.notes ? c.notes.toLowerCase().includes(q) : false)
    );
  });

  const handleAdd = (draft: ContactDraft) => {
    try {
      setError(null);
      onAddContact({
        nickname: draft.nickname,
        did: draft.did.trim(),
        mailboxRoom: draft.mailboxRoom.trim() || undefined,
        notes: draft.notes,
      });
      setIsAdding(false);
    } catch (err: unknown) {
      setError((err as Error)?.message || String(err));
    }
  };

  const handleEditSave = (id: string, draft: ContactDraft) => {
    const mailbox = draft.mailboxRoom.trim();
    if (!mailbox) {
      setError('A mailbox is required — it is where messages to this agent are delivered.');
      return;
    }
    try {
      setError(null);
      onUpdateContact(id, {
        nickname: draft.nickname.trim() || 'Unnamed agent',
        mailboxRoom: mailbox,
        notes: draft.notes.trim() || undefined,
      });
      setEditingId(null);
    } catch (err: unknown) {
      setError((err as Error)?.message || String(err));
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-line rounded-lg p-4 sm:p-5">
        <div className="flex items-start gap-3 min-w-0">
          <Users className="w-4 h-4 text-ink-3 mt-0.5 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="text-sm font-medium text-ink">Contacts</h2>
            <p className="text-xs text-ink-3 mt-0.5 leading-relaxed">
              Agents you have saved, so you can message them without pasting an identity.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingId(null);
            setIsAdding(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-accent text-on-accent text-xs font-semibold transition-colors hover:bg-accent/85 self-start sm:self-auto shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Add agent</span>
        </button>
      </div>

      {isAdding && (
        <ContactForm
          title="Add an agent"
          submitLabel="Save contact"
          initial={EMPTY_DRAFT}
          error={error}
          onCancel={() => {
            setIsAdding(false);
            setError(null);
          }}
          onSubmit={handleAdd}
        />
      )}

      {/* Filtering only earns its space once there is a list worth filtering. */}
      {contacts.length > 3 && (
        <div className="relative">
          <Search
            className="w-4 h-4 text-ink-4 absolute left-3.5 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, identity or mailbox…"
            aria-label="Search contacts"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface border border-line text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
          />
        </div>
      )}

      {/* ── The list ───────────────────────────────────────────────────────── */}
      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center bg-surface border border-line rounded-lg">
          <div className="w-11 h-11 rounded-full bg-surface-2 border border-line flex items-center justify-center">
            <Users className="w-5 h-5 text-ink-3" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-ink-2">No contacts yet</p>
            <p className="text-xs text-ink-3 max-w-xs leading-relaxed">
              Add an agent to quickly communicate with them.
            </p>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add contact</span>
          </button>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center bg-surface border border-line rounded-lg">
          <div className="w-11 h-11 rounded-full bg-surface-2 border border-line flex items-center justify-center">
            <Search className="w-5 h-5 text-ink-3" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-ink-2">No matching contacts</p>
            <p className="text-xs text-ink-3 max-w-xs leading-relaxed break-words">
              Nothing matches &quot;{searchQuery}&quot;.
            </p>
          </div>
          <button
            onClick={() => setSearchQuery('')}
            className="px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-2 border border-line transition-colors"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredContacts.map((contact) =>
            editingId === contact.id ? (
              <div key={contact.id} className="lg:col-span-2">
                <ContactForm
                  title={`Edit ${contact.nickname}`}
                  submitLabel="Save changes"
                  lockDid
                  initial={{
                    nickname: contact.nickname,
                    did: contact.did,
                    mailboxRoom: contact.mailboxRoom,
                    notes: contact.notes ?? '',
                  }}
                  error={error}
                  onCancel={() => {
                    setEditingId(null);
                    setError(null);
                  }}
                  onSubmit={(draft) => handleEditSave(contact.id, draft)}
                />
              </div>
            ) : (
              <article
                key={contact.id}
                className="bg-surface border border-line hover:border-line-2 rounded-lg p-4 sm:p-5 flex flex-col gap-4 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <Identicon
                    did={contact.did}
                    size={40}
                    className="rounded-md border border-line shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-sm font-medium text-ink truncate">{contact.nickname}</h3>
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="font-mono text-xs text-ink-3 truncate" title={contact.did}>
                        {formatDidAbbreviated(contact.did)}
                      </span>
                      <button
                        onClick={() => onCopyText(contact.did, `${contact.nickname} identity`)}
                        className="p-1 rounded text-ink-4 hover:text-accent transition-colors shrink-0"
                        aria-label={`Copy the identity of ${contact.nickname}`}
                        title="Copy full identity"
                      >
                        {copiedKey === `${contact.nickname} identity` ? (
                          <Check className="w-3 h-3 text-success" aria-hidden="true" />
                        ) : (
                          <Copy className="w-3 h-3" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isValidDid(contact.did) ? (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-success-tint text-success border border-success/30"
                      title="This is a well-formed did:key, so messages signed by it can be verified in this browser."
                    >
                      <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                      <span>Ready to message</span>
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-warning-tint text-warning border border-warning/30"
                      title="This identity is not a readable did:key, so signatures from it cannot be checked."
                    >
                      <ShieldAlert className="w-3 h-3" aria-hidden="true" />
                      <span>Identity unreadable</span>
                    </span>
                  )}
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-surface-2 text-ink-3 border border-line"
                    title={
                      usesDefaultMailbox(contact)
                        ? 'The mailbox this app suggests for that identity.'
                        : 'A mailbox you chose yourself for this contact.'
                    }
                  >
                    {usesDefaultMailbox(contact) ? 'Default mailbox' : 'Custom mailbox'}
                  </span>
                </div>

                {contact.notes && (
                  <p className="text-xs text-ink-3 leading-relaxed break-words">{contact.notes}</p>
                )}

                <div className="p-2.5 rounded-md bg-bg/40 border border-line flex items-center justify-between gap-3">
                  <span className="text-[11px] font-medium text-ink-3 shrink-0">Mailbox</span>
                  <span
                    className="font-mono text-[11px] text-success truncate"
                    title={contact.mailboxRoom}
                  >
                    {contact.mailboxRoom}
                  </span>
                </div>

                <Disclosure label="View identity" variant="inline">
                  <div className="space-y-3.5">
                    <CopyField
                      label="Agent identity"
                      value={contact.did}
                      copyLabel={`${contact.nickname} identity`}
                      onCopyText={onCopyText}
                      copiedKey={copiedKey}
                      tone="accent"
                      head={16}
                      tail={8}
                      hint="Their unique Technocore identity. Signatures are checked against this."
                    />
                    <CopyField
                      label="Mailbox"
                      value={contact.mailboxRoom}
                      copyLabel={`${contact.nickname} mailbox`}
                      onCopyText={onCopyText}
                      copiedKey={copiedKey}
                      tone="success"
                      truncate={false}
                      hint="Related to the identity by this app's configuration, not by cryptography — mailbox names are first-come on the server."
                    />
                  </div>
                </Disclosure>

                {/* ── Actions ──────────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-2 pt-3 mt-auto border-t border-line">
                  <button
                    onClick={() => onOpenCompose(contact.did)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-accent text-on-accent text-xs font-semibold transition-colors hover:bg-accent/85"
                  >
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Message</span>
                  </button>
                  <button
                    onClick={() => onSelectMailbox(contact.mailboxRoom)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-surface-2 hover:bg-surface-3 text-ink-2 text-xs font-medium border border-line transition-colors"
                    title="Read the messages sitting in this agent's mailbox"
                  >
                    <Inbox className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
                    <span>Open mailbox</span>
                  </button>

                  <div className="ml-auto flex items-center gap-1">
                    <button
                      onClick={() => {
                        setIsAdding(false);
                        setError(null);
                        setConfirmDeleteId(null);
                        setEditingId(contact.id);
                      }}
                      className="p-2 rounded-md text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
                      title="Edit this contact"
                      aria-label={`Edit ${contact.nickname}`}
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    {confirmDeleteId === contact.id ? (
                      // Only the saved nickname goes away — the agent's identity is theirs,
                      // not ours, so the confirmation says exactly that much and no more.
                      <div className="flex items-center gap-1.5" role="group" aria-label={`Confirm removing ${contact.nickname}`}>
                        <span className="text-[11px] text-ink-3 whitespace-nowrap">
                          Forget this contact?
                        </span>
                        <button
                          onClick={() => {
                            onDeleteContact(contact.id);
                            setConfirmDeleteId(null);
                          }}
                          aria-label={`Confirm removing ${contact.nickname}`}
                          className="px-2 py-1.5 rounded-md bg-danger-tint text-danger text-[11px] font-semibold border border-danger/40 hover:bg-danger/20 transition-colors"
                        >
                          Remove
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          aria-label={`Keep ${contact.nickname}`}
                          className="px-2 py-1.5 rounded-md bg-surface-2 text-ink-3 text-[11px] font-medium border border-line hover:text-ink transition-colors"
                        >
                          Keep
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(contact.id)}
                        className="p-2 rounded-md text-ink-3 hover:text-danger hover:bg-surface-2 transition-colors"
                        title="Remove this contact"
                        aria-label={`Remove ${contact.nickname}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </div>
  );
};

