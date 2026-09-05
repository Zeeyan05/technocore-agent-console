'use client';

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Send,
  Trash2,
  Inbox,
  Search,
  Pencil,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { AgentIdentityMark } from './AgentIdentityMark';
import { Disclosure } from './Disclosure';
import { GlowSurface, SectionHeader } from './Surface';
import { CopyField, TechnicalValue } from './DataField';
import { isValidDid } from '@/lib/crypto/did';
import { agentMailboxRoom } from '@/lib/crypto/fingerprint';
import type { AgentContact } from '@/types/technocore';

interface ContactDraft {
  nickname: string;
  did: string;
  mailboxRoom: string;
  notes: string;
}

const EMPTY_DRAFT: ContactDraft = { nickname: '', did: '', mailboxRoom: '', notes: '' };

const PRIMARY_BTN =
  'press inline-flex items-center gap-1.5 px-3.5 py-2 min-h-11 sm:min-h-9 rounded-md bg-accent text-on-accent text-xs font-semibold hover:bg-accent/85 active:bg-accent/75';
const QUIET_BTN =
  'press inline-flex items-center gap-1.5 px-3 py-2 min-h-11 sm:min-h-9 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2';
const ICON_BTN =
  'press inline-flex items-center justify-center p-2 min-w-9 min-h-9 sm:min-w-0 sm:min-h-0 rounded-md text-ink-3';

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
      className="anim-rise edge-accent p-5 surface-raised border border-line-2 rounded-xl space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center -mr-2 rounded px-2 py-2 min-h-11 sm:min-h-6 sm:py-1 text-xs text-ink-3 hover:text-ink transition-colors"
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
            className="w-full px-3 py-2.5 min-h-11 sm:min-h-0 rounded-md bg-bg/60 border border-line text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
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
            className={`w-full px-3 py-2.5 min-h-11 sm:min-h-0 rounded-md bg-bg/60 border border-line text-xs font-mono text-accent placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors ${
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
            className="w-full px-3 py-2.5 min-h-11 sm:min-h-0 rounded-md bg-bg/60 border border-line text-xs font-mono text-success placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
          />
          {/* §35: suggested from the identity, never bound to it. Do not soften. */}
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
            className="w-full px-3 py-2.5 min-h-11 sm:min-h-0 rounded-md bg-bg/60 border border-line text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
          />
          <p className="text-[11px] text-ink-4">Shown on the card. Stored in this browser only.</p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" className={PRIMARY_BTN}>
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

interface ContactCardProps {
  contact: AgentContact;
  /** True while this card is showing its two-step remove confirmation. */
  isConfirmingDelete: boolean;
  onCopyText: (text: string, label: string) => void;
  copiedKey: string | null;
  onOpenCompose: (recipientDid: string) => void;
  onSelectMailbox: (room: string) => void;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}

/**
 * One agent in the directory.
 *
 * Everything on the card is either stored data or something derived from it: the
 * mark comes from the DID, the readiness pill from whether that DID parses, the
 * mailbox chip from whether the saved room matches the convention. There is no
 * profile to invent here, and none is invented — an agent is an identity, a
 * mailbox, and whatever label you chose for it.
 */
const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  isConfirmingDelete,
  onCopyText,
  copiedKey,
  onOpenCompose,
  onSelectMailbox,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}) => {
  const readable = isValidDid(contact.did);
  const isDefaultMailbox = usesDefaultMailbox(contact);

  return (
    <GlowSurface
      as="article"
      variant="identity"
      className="h-full flex flex-col overflow-hidden transition-colors hover:border-line-2"
    >
      <div className="flex-1 p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <AgentIdentityMark
            did={contact.did}
            size={52}
            className="rounded-xl"
            label={`Visual fingerprint of the identity saved as ${contact.nickname}`}
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-ink truncate" title={contact.nickname}>
              {contact.nickname}
            </h3>
            <TechnicalValue
              className="mt-0.5"
              value={contact.did}
              name={`the identity of ${contact.nickname}`}
              copyLabel={`${contact.nickname} identity`}
              onCopyText={onCopyText}
              copiedKey={copiedKey}
              head={14}
              tail={6}
              tone="accent"
              size="xs"
            />
            <div className="mt-1.5">
              {readable ? (
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
            </div>
          </div>
        </div>

        {contact.notes && (
          <p className="text-xs text-ink-3 leading-relaxed break-words">{contact.notes}</p>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-4">
              Mailbox
            </p>
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-2 border border-line text-ink-3"
              title={
                isDefaultMailbox
                  ? 'The mailbox this app suggests for that identity.'
                  : 'A mailbox you chose yourself for this contact.'
              }
            >
              {isDefaultMailbox ? 'Default' : 'Custom'}
            </span>
          </div>
          <p
            className="mt-1 font-mono text-[11px] text-success truncate"
            title={contact.mailboxRoom}
          >
            {contact.mailboxRoom}
          </p>
        </div>

        <Disclosure label="View identity" variant="inline" className="mt-auto">
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
      </div>

      {/* Actions sit on their own band so "Message" is the obvious next move and
          the two management controls stay out of its way. */}
      <div className="px-4 sm:px-5 py-3 border-t border-line flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => onOpenCompose(contact.did)} className={PRIMARY_BTN}>
          <Send className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Message</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectMailbox(contact.mailboxRoom)}
          className={QUIET_BTN}
          title="Read the messages sitting in this agent's mailbox"
        >
          <Inbox className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
          <span>Open mailbox</span>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className={`${ICON_BTN} hover:text-ink hover:bg-surface-2`}
            title="Edit this contact"
            aria-label={`Edit ${contact.nickname}`}
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          {isConfirmingDelete ? (
            // Only the saved nickname goes away — the agent's identity is theirs,
            // not ours, so the confirmation says exactly that much and no more.
            <div
              className="flex items-center gap-1.5 anim-fade"
              role="group"
              aria-label={`Confirm removing ${contact.nickname}`}
            >
              <span className="text-[11px] text-ink-3 whitespace-nowrap">Forget this contact?</span>
              <button
                type="button"
                onClick={onConfirmDelete}
                aria-label={`Confirm removing ${contact.nickname}`}
                className="press px-2 py-1.5 min-h-9 sm:min-h-0 rounded-md bg-danger-tint text-danger text-[11px] font-semibold border border-danger/40 hover:bg-danger/20"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={onCancelDelete}
                aria-label={`Keep ${contact.nickname}`}
                className="press px-2 py-1.5 min-h-9 sm:min-h-0 rounded-md bg-surface-2 text-ink-3 text-[11px] font-medium border border-line hover:text-ink"
              >
                Keep
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAskDelete}
              className={`${ICON_BTN} hover:text-danger hover:bg-surface-2`}
              title="Remove this contact"
              aria-label={`Remove ${contact.nickname}`}
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </GlowSurface>
  );
};

/**
 * The agent directory: the saved agents this console can address, presented as
 * identities rather than as rows in an address book.
 *
 * Nothing here is fetched or inferred about an agent. A contact is a `did:key`,
 * a mailbox room, and two labels you typed — so the card shows exactly those,
 * plus the mark derived locally from the DID.
 */
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

  /* Both counts are read straight off the saved list — no directory metric here
     describes anything the console cannot point at. */
  const readableCount = contacts.filter((c) => isValidDid(c.did)).length;
  const isSearching = searchQuery.trim().length > 0;

  const startAdding = () => {
    setEditingId(null);
    setConfirmDeleteId(null);
    setError(null);
    setIsAdding(true);
  };

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

  /* The tile that closes the grid. One saved agent then reads as a directory with
     room in it, rather than as a card marooned beside an empty column. */
  const addTile = (
    <button
      type="button"
      onClick={startAdding}
      className="press group h-full min-h-40 w-full flex flex-col items-center justify-center gap-2 px-5 py-8 rounded-xl border border-dashed border-line-2 hover:border-line-accent hover:bg-surface/70 transition-colors"
    >
      <span className="w-9 h-9 rounded-lg bg-surface-2 border border-line flex items-center justify-center">
        <UserPlus
          className="w-4 h-4 text-ink-3 group-hover:text-accent transition-colors"
          aria-hidden="true"
        />
      </span>
      <span className="text-xs font-medium text-ink-2 group-hover:text-ink transition-colors">
        Add another agent
      </span>
      <span className="text-[11px] text-ink-4">Paste a did:key you want to reach</span>
    </button>
  );

  return (
    <div className="space-y-4 sm:space-y-5 max-w-6xl">
      <div className="space-y-2">
        <SectionHeader
          as="h1"
          eyebrow="Directory"
          title="Agent Directory"
          description="Saved agents you can communicate with. The name and notes are labels you keep in this browser — what proves a message came from an agent is the signature checked against their identity."
          actions={
            <button type="button" onClick={startAdding} className={PRIMARY_BTN}>
              <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add agent</span>
            </button>
          }
        />

        {contacts.length > 0 && (
          <p className="text-[11px] text-ink-4">
            <span className="font-mono tabular-nums text-ink-3">{contacts.length}</span>{' '}
            {contacts.length === 1 ? 'agent saved' : 'agents saved'} ·{' '}
            <span className="font-mono tabular-nums text-ink-3">{readableCount}</span> with a
            readable identity
          </p>
        )}
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search
              className="w-4 h-4 text-ink-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, identity or mailbox…"
              aria-label="Search saved agents"
              className="w-full pl-10 pr-4 py-2.5 min-h-11 sm:min-h-0 rounded-lg bg-surface border border-line text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
            />
          </div>
          {isSearching && (
            <p className="shrink-0 text-[11px] text-ink-4 sm:pl-1" role="status">
              <span className="font-mono tabular-nums text-ink-3">{filteredContacts.length}</span> of{' '}
              <span className="font-mono tabular-nums text-ink-3">{contacts.length}</span> shown
            </p>
          )}
        </div>
      )}

      {contacts.length === 0 ? (
        <GlowSurface variant="plain" className="anim-rise border border-dashed border-line-2">
          <div className="px-6 py-12 sm:py-14 flex flex-col items-center text-center gap-4">
            <span className="w-12 h-12 rounded-xl bg-surface-2 border border-line flex items-center justify-center">
              <Users className="w-5 h-5 text-ink-3" aria-hidden="true" />
            </span>
            <div className="space-y-1.5 max-w-sm">
              <h2 className="text-sm font-semibold text-ink">No agents saved yet</h2>
              <p className="text-xs text-ink-3 leading-relaxed">
                Save an agent&apos;s <span className="font-mono text-ink-2">did:key</span> here and
                you can message them, or open their mailbox, without pasting an identity again.
              </p>
            </div>
            <button type="button" onClick={startAdding} className={PRIMARY_BTN}>
              <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add your first agent</span>
            </button>
          </div>
        </GlowSurface>
      ) : filteredContacts.length === 0 ? (
        <GlowSurface variant="plain" className="anim-rise border border-dashed border-line-2">
          <div className="px-6 py-12 flex flex-col items-center text-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-surface-2 border border-line flex items-center justify-center">
              <Search className="w-5 h-5 text-ink-3" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-ink">No matching agents</h2>
              <p className="text-xs text-ink-3 max-w-xs leading-relaxed break-words">
                Nothing matches &quot;{searchQuery}&quot;.
              </p>
            </div>
            <button type="button" onClick={() => setSearchQuery('')} className={QUIET_BTN}>
              Clear search
            </button>
          </div>
        </GlowSurface>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
          {filteredContacts.map((contact, i) =>
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
              <div
                key={contact.id}
                className="anim-rise anim-stagger"
                style={{ '--i': Math.min(i, 8) } as React.CSSProperties}
              >
                <ContactCard
                  contact={contact}
                  isConfirmingDelete={confirmDeleteId === contact.id}
                  onCopyText={onCopyText}
                  copiedKey={copiedKey}
                  onOpenCompose={onOpenCompose}
                  onSelectMailbox={onSelectMailbox}
                  onEdit={() => {
                    setIsAdding(false);
                    setError(null);
                    setConfirmDeleteId(null);
                    setEditingId(contact.id);
                  }}
                  onAskDelete={() => setConfirmDeleteId(contact.id)}
                  onCancelDelete={() => setConfirmDeleteId(null)}
                  onConfirmDelete={() => {
                    onDeleteContact(contact.id);
                    setConfirmDeleteId(null);
                  }}
                />
              </div>
            )
          )}

          {!isAdding && !isSearching && (
            <div
              className="anim-rise anim-stagger"
              style={{ '--i': Math.min(filteredContacts.length, 8) } as React.CSSProperties}
            >
              {addTile}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

