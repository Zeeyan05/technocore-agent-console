'use client';

import React, { useState, useMemo } from 'react';
import {
  Inbox,
  CheckCheck,
  Send,
  Cpu,
  UserPlus,
  Copy,
  Check,
  MailOpen,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import { SenderMark } from './AgentIdentityMark';
import { VerificationSeal } from './StatusBadge';
import { Disclosure } from './Disclosure';
import { CopyField } from './DataField';
import { GlowSurface, SectionHeader } from './Surface';
import { ProtocolFlow, type FlowStep } from './ProtocolFlow';
import { describeSender } from '@/lib/senderLabel';
import { timeAgo, fullTimestamp } from '@/lib/time';
import { isValidDid } from '@/lib/crypto/did';
import type { VerifiedMessage } from '@/hooks/useMailbox';
import type { Identity } from '@/lib/identity';
import type { AgentContact } from '@/types/technocore';

type InboxFilter = 'all' | 'unread' | 'verified' | 'unverified';

interface InboxTabProps {
  messages: VerifiedMessage[];
  activeRoom: string;
  identity: Identity | null;
  contacts: AgentContact[];
  isLoading: boolean;
  error: string | null;
  onMarkAsRead: (seq: number) => void;
  onMarkAllAsRead: () => void;
  onInspectMessage: (msg: VerifiedMessage, room: string) => void;
  onOpenCompose: (recipient?: string) => void;
  onAddContact: (contact: { nickname: string; did: string; mailboxRoom?: string; notes?: string }) => void;
  onCopyText: (text: string, label: string) => void;
  copiedKey: string | null;
}

const LIST_SECTIONS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'verified', label: 'Verified' },
  { key: 'unverified', label: 'Not verified' },
] as const;


/**
 * §16's verification experience: the verdict in words, then the checks this
 * browser actually ran, then the raw material each check ran on. Nothing here is
 * new data — these are the same fields the old inbox printed inline, one
 * deliberate click away from the text you came to read.
 */
const VerificationDetails: React.FC<{
  msg: VerifiedMessage;
  room: string;
  isDidSender: boolean;
  onCopyText: (text: string, label: string) => void;
  copiedKey: string | null;
  onInspect: () => void;
}> = ({ msg, room, isDidSender, onCopyText, copiedKey, onInspect }) => {
  const v = msg.verification;
  const isSigned = !!msg.sig;
  const failed = !!v?.signatureFormatValid && !v.signatureValid;

  const verdict = v?.valid
    ? {
        Icon: ShieldCheck,
        tone: 'text-success',
        band: 'bg-success-tint border-success/30',
        title: 'Signature verified',
        claim: 'The sender’s identity signed this message.',
      }
    : failed
    ? {
        Icon: ShieldX,
        tone: 'text-danger',
        band: 'bg-danger-tint border-danger/30',
        title: 'Signature does not match',
        claim: v?.error || 'The signature does not cover this payload.',
      }
    : {
        Icon: ShieldAlert,
        tone: 'text-warning',
        band: 'bg-warning-tint border-warning/30',
        title: 'Not signed',
        claim: v?.error || 'This message carries no signature, so the sender is not proven.',
      };
  const VerdictIcon = verdict.Icon;

  /* Four stages, each one a check that really ran. A stage that does not apply
     stays neutral — it never turns green to complete the picture. */
  const flow: FlowStep[] = [
    {
      label: 'Identity',
      state: v?.didFormatValid ? 'ok' : 'pending',
      detail: isDidSender ? 'did:key ed25519-pub' : 'Name only',
    },
    {
      label: 'Canonical',
      state: v?.canonicalPayloadText ? 'ok' : 'pending',
      detail: v?.canonicalPayloadText ? '<room>|<nonce>|<text>' : 'Cannot rebuild',
    },
    {
      label: 'Ed25519',
      state: v?.signatureFormatValid ? 'ok' : isSigned ? 'fail' : 'pending',
      detail: msg.sig ? `${msg.sig.length} base64url chars` : 'Absent',
    },
    {
      label: 'Verified',
      state: v?.valid ? 'ok' : failed ? 'fail' : 'pending',
      detail: v?.valid ? 'Checked in this browser' : failed ? 'Check failed' : 'Not run',
    },
  ];

  return (
    <div className="space-y-4">
      <div className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${verdict.band}`}>
        <VerdictIcon className={`w-4 h-4 shrink-0 mt-0.5 ${verdict.tone}`} aria-hidden="true" />
        <div className="min-w-0">
          <p className={`text-xs font-semibold ${verdict.tone}`}>{verdict.title}</p>
          <p className="mt-0.5 text-[11px] text-ink-2 leading-relaxed">{verdict.claim}</p>
        </div>
      </div>

      <ProtocolFlow steps={flow} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CopyField
          label="Agent DID"
          value={msg.from}
          copyLabel="Sender DID"
          onCopyText={onCopyText}
          copiedKey={copiedKey}
          tone="accent"
          head={16}
          tail={6}
        />
        <CopyField
          label="Nonce"
          value={msg.nonce || '—'}
          copyLabel="Nonce"
          onCopyText={onCopyText}
          copiedKey={copiedKey}
          truncate={false}
          hint="Counter the sender includes so a signature cannot be replayed."
        />
      </div>

      <CopyField
        label="Canonical payload"
        value={v?.canonicalPayloadText || (isSigned ? '—' : 'Not applicable — message is unsigned')}
        copyLabel="Canonical payload"
        onCopyText={onCopyText}
        copiedKey={copiedKey}
        head={28}
        tail={12}
        hint="The exact bytes that were signed: room, nonce and message text joined by pipes."
      />

      <CopyField
        label="Signature"
        value={msg.sig || 'None'}
        copyLabel="Signature"
        onCopyText={onCopyText}
        copiedKey={copiedKey}
        tone="success"
        head={14}
        tail={8}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <span className="text-[11px] text-ink-3">
          Room <span className="font-mono text-ink-2">{room}</span> · message{' '}
          <span className="font-mono text-ink-2 tabular-nums">#{msg.seq}</span>
        </span>
        <button
          type="button"
          onClick={onInspect}
          className="press inline-flex items-center gap-1.5 px-3 py-2 min-h-9 sm:min-h-0 sm:py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2"
        >
          <Cpu className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
          <span>Open protocol inspector</span>
        </button>
      </div>
    </div>
  );
};

export const InboxTab: React.FC<InboxTabProps> = ({
  messages,
  activeRoom,
  identity,
  contacts,
  isLoading,
  error,
  onMarkAsRead,
  onMarkAllAsRead,
  onInspectMessage,
  onOpenCompose,
  onAddContact,
  onCopyText,
  copiedKey,
}) => {
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeq, setSelectedSeq] = useState<number | null>(null);
  const selfDid = identity?.did || '';

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      if (filter === 'unread' && !m.isUnread) return false;
      if (filter === 'verified' && !m.verification?.valid) return false;
      if (filter === 'unverified' && m.verification?.valid) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesFrom = m.from.toLowerCase().includes(q);
        const matchesText = m.text.toLowerCase().includes(q);
        const matchesSeq = String(m.seq).includes(q);
        if (!matchesFrom && !matchesText && !matchesSeq) return false;
      }

      return true;
    });
  }, [messages, filter, searchQuery]);

  const selectedMessage = useMemo(() => {
    if (selectedSeq === null && filteredMessages.length > 0) {
      return filteredMessages[0];
    }
    return filteredMessages.find((m) => m.seq === selectedSeq) || filteredMessages[0] || null;
  }, [filteredMessages, selectedSeq]);

  const isSenderSaved = useMemo(() => {
    if (!selectedMessage) return false;
    return contacts.some((c) => c.did === selectedMessage.from);
  }, [selectedMessage, contacts]);

  const selectedSender = selectedMessage
    ? describeSender(selectedMessage.from, contacts, selfDid)
    : null;

  /* One honest line about how this message arrived. "Signed communication" is
     claimed only when the local Ed25519 check actually passed. */
  const selectedChannel = !selectedMessage
    ? ''
    : selectedMessage.verification?.valid
    ? 'Signed communication'
    : selectedMessage.verification?.signatureFormatValid && !selectedMessage.verification.signatureValid
    ? 'Signature did not match'
    : 'Unsigned message';

  // Honest error state: the poll loop retries automatically every ~5s,
  // so the error shows the real reason plus the fact that it is retrying.
  const hasFatalError = !!error && messages.length === 0 && !isLoading;

  /* "Open mailbox" on a saved agent points this screen at a room that is not
     yours, so the description cannot keep saying "your agent". A mailbox name is
     a room on the server, not a key — claiming a room you opened belongs to your
     agent is exactly the binding this app is careful never to imply. */
  const isOwnMailbox = !!identity && activeRoom === identity.mailboxRoom;

  return (
    <div className="space-y-5">
      {/* ── Header: what this screen is, and how to filter it ──────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeader
          as="h1"
          eyebrow={isOwnMailbox ? 'Agent mailbox' : 'Mailbox you opened'}
          title="Inbox"
          description={
            isOwnMailbox
              ? 'Messages sent to your agent, checked for a valid signature before you read them.'
              : 'You are reading a mailbox room you opened, not your own. Every message here is still checked for a valid signature before you read it.'
          }
        />

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border font-mono text-[11px] ${
              isOwnMailbox
                ? 'bg-surface-2 border-line text-accent'
                : 'bg-warning-tint border-warning/40 text-warning'
            }`}
            title={
              isOwnMailbox
                ? 'The mailbox room this inbox is reading — the one suggested for your identity'
                : 'The mailbox room this inbox is reading. You opened it yourself; it is not your own mailbox.'
            }
          >
            <Inbox
              className={`w-3 h-3 shrink-0 ${isOwnMailbox ? 'text-ink-4' : 'text-warning'}`}
              aria-hidden="true"
            />
            <span className="truncate max-w-[10rem]">{activeRoom}</span>
          </span>

          <div
            role="group"
            aria-label="Filter messages"
            className="flex flex-wrap items-center gap-1 bg-surface-2/60 p-1 rounded-md border border-line"
          >
            {LIST_SECTIONS.map((section) => (
              <button
                key={section.key}
                onClick={() => setFilter(section.key)}
                aria-pressed={filter === section.key}
                className={`press px-3 py-1 min-h-9 sm:min-h-0 rounded text-xs font-medium ${
                  filter === section.key
                    ? 'bg-surface-3 text-ink border border-line-2'
                    : 'text-ink-3 hover:text-ink-2 border border-transparent'
                }`}
              >
                {section.label}
              </button>
            ))}
            <button
              onClick={onMarkAllAsRead}
              className="press inline-flex items-center justify-center p-1 min-w-9 min-h-9 sm:min-w-6 sm:min-h-6 text-ink-3 hover:text-ink hover:bg-surface-3 rounded ml-1"
              title="Mark all as read"
              aria-label="Mark all as read"
            >
              <CheckCheck className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Split view: list on the left, one message on the right ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <GlowSurface
          variant="outlined"
          className="lg:col-span-5 overflow-hidden flex flex-col h-[420px] lg:h-[640px]"
        >
          <div className="p-3 border-b border-line bg-bg/40">
            <div className="relative">
              <Search className="w-4 h-4 text-ink-4 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages and senders"
                aria-label="Search messages and senders"
                className="w-full pl-9 pr-3.5 py-1.5 min-h-11 sm:min-h-9 rounded-md bg-bg/60 border border-line text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-line">
            {isLoading ? (
              <div className="p-4 space-y-3" aria-busy="true">
                <span className="sr-only">Loading your messages…</span>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3 p-2">
                    <div className="skeleton w-7 h-7 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3 w-1/3 rounded" />
                      <div className="skeleton h-3 w-5/6 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : hasFatalError ? (
              <div className="p-10 text-center text-xs space-y-3" role="alert">
                <ShieldAlert className="w-8 h-8 mx-auto text-danger mb-2" aria-hidden="true" />
                <p className="text-ink-2 font-semibold">
                  {isOwnMailbox ? 'Could not read your mailbox' : 'Could not read this mailbox'}
                </p>
                <p className="text-danger break-all px-2 font-mono">{error}</p>
                <p className="text-ink-4">Retrying automatically…</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="px-5 py-12 flex flex-col items-center text-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-surface-2 border border-line flex items-center justify-center">
                  <Inbox className="w-5 h-5 text-ink-3" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-ink-2">
                    {filter !== 'all'
                      ? 'Nothing matches this filter'
                      : isOwnMailbox
                      ? 'Your inbox is clear'
                      : 'This mailbox is empty'}
                  </p>
                  <p className="text-xs text-ink-3 leading-relaxed max-w-xs">
                    {filter !== 'all'
                      ? 'Switch back to All to see every message in this mailbox.'
                      : isOwnMailbox
                      ? 'No new messages from other agents yet. Share your agent identity so they can reach you.'
                      : 'Nothing has been posted to this room yet, or it has since been cleared.'}
                  </p>
                </div>
                {filter === 'all' && (
                  <button
                    onClick={() => onOpenCompose()}
                    className="press inline-flex items-center gap-1.5 px-3.5 py-2 min-h-9 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2"
                  >
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Send a message</span>
                  </button>
                )}
              </div>
            ) : (
              filteredMessages.map((msg, i) => {
                const isSelected = selectedMessage?.seq === msg.seq;
                const sender = describeSender(msg.from, contacts, selfDid);

                return (
                  <button
                    key={msg.seq}
                    type="button"
                    aria-current={isSelected ? 'true' : undefined}
                    onClick={() => {
                      setSelectedSeq(msg.seq);
                      if (msg.isUnread) onMarkAsRead(msg.seq);
                    }}
                    style={{ '--i': Math.min(i, 8) } as React.CSSProperties}
                    /* §14's selected row: an accent rail, a surface step and a
                       faint violet identity wash — not just a heavier border. */
                    className={`press anim-row anim-stagger relative w-full text-left p-3.5 ${
                      isSelected
                        ? 'edge-accent wash-identity bg-surface-2'
                        : msg.isUnread
                        ? 'bg-surface-2/40 hover:bg-surface-2'
                        : 'hover:bg-surface-2/50'
                    }`}
                  >
                    <span className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="flex items-center gap-2.5 min-w-0">
                        <SenderMark did={msg.from} isDid={sender.isDid} size={26} />
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold text-ink truncate">
                            {sender.name}
                          </span>
                          {sender.shortDid && (
                            <span className="block font-mono text-[10px] text-ink-4 truncate">
                              {sender.shortDid}
                            </span>
                          )}
                        </span>
                        {msg.isUnread && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"
                            aria-label="Unread"
                          />
                        )}
                      </span>
                      <span
                        className="text-[10px] text-ink-4 shrink-0 tabular-nums"
                        title={fullTimestamp(msg.ts)}
                      >
                        {timeAgo(msg.ts)}
                      </span>
                    </span>

                    <span className="block text-xs text-ink-2 line-clamp-2 leading-relaxed mb-2">
                      {msg.text}
                    </span>

                    <VerificationSeal verification={msg.verification} isDidSender={sender.isDid} />
                  </button>
                );
              })
            )}
          </div>
        </GlowSurface>

        <GlowSurface
          variant="outlined"
          className="lg:col-span-7 overflow-hidden flex flex-col min-h-[420px] lg:h-[640px]"
        >
          {selectedMessage && selectedSender ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* §15: the sender as an entity — mark, name, verdict, DID, channel */}
              <div className="px-4 sm:px-5 py-4 border-b border-line wash-identity">
                <div className="flex items-start gap-3.5 min-w-0">
                  <SenderMark
                    did={selectedMessage.from}
                    isDid={selectedSender.isDid}
                    size={52}
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold tracking-tight text-ink break-all">
                        {selectedSender.name}
                      </h3>
                      <VerificationSeal
                        verification={selectedMessage.verification}
                        isDidSender={selectedSender.isDid}
                        variant="full"
                      />
                    </div>

                    {selectedSender.isDid ? (
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-mono text-[11px] text-ink-3 truncate">
                          {selectedSender.shortDid || selectedSender.name}
                        </span>
                        <button
                          onClick={() => onCopyText(selectedMessage.from, 'Sender DID')}
                          className="press inline-flex items-center justify-center p-1 min-w-9 min-h-9 sm:min-w-6 sm:min-h-6 rounded text-ink-3 hover:text-accent shrink-0"
                          aria-label="Copy sender identity"
                          title="Copy sender identity"
                        >
                          {copiedKey === 'Sender DID' ? (
                            <Check className="w-3 h-3 text-success anim-seal" aria-hidden="true" />
                          ) : (
                            <Copy className="w-3 h-3" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-ink-4">
                        Sent under a chosen name rather than a signed identity.
                      </p>
                    )}

                    <p className="text-[11px] text-ink-3">
                      <span>{selectedChannel}</span>
                      <span className="text-ink-4"> · </span>
                      <span className="tabular-nums" title={fullTimestamp(selectedMessage.ts)}>
                        Received {timeAgo(selectedMessage.ts)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 px-4 sm:px-6 py-5 overflow-y-auto space-y-5">
                <div className="p-4 bg-bg/50 border border-line rounded-xl text-sm text-ink whitespace-pre-wrap break-words leading-relaxed">
                  {selectedMessage.text}
                </div>

                <Disclosure label="View verification" variant="inline">
                  <VerificationDetails
                    msg={selectedMessage}
                    room={activeRoom}
                    isDidSender={selectedSender.isDid}
                    onCopyText={onCopyText}
                    copiedKey={copiedKey}
                    onInspect={() => onInspectMessage(selectedMessage, activeRoom)}
                  />
                </Disclosure>
              </div>

              <div className="px-4 py-3 border-t border-line bg-surface-2/50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {!isSenderSaved && isValidDid(selectedMessage.from) && (
                    <button
                      onClick={() =>
                        onAddContact({
                          nickname: `Agent-${selectedMessage.from.slice(8, 14)}`,
                          did: selectedMessage.from,
                        })
                      }
                      className="press inline-flex items-center gap-1.5 px-3 py-2 min-h-9 rounded-md bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-2 border border-line"
                    >
                      <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Save as contact</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => onOpenCompose(selectedMessage.from)}
                  className="press inline-flex items-center gap-1.5 px-4 py-2 min-h-9 rounded-md bg-accent text-on-accent text-xs font-semibold hover:bg-accent/85"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Reply</span>
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex-1 p-6 space-y-4" aria-busy="true">
              <span className="sr-only">Loading your messages…</span>
              <div className="flex items-center gap-3">
                <div className="skeleton w-12 h-12 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="skeleton h-3 w-1/3 rounded" />
                  <div className="skeleton h-3 w-1/4 rounded" />
                </div>
              </div>
              <div className="skeleton h-24 w-full rounded-xl" />
              <div className="skeleton h-3 w-40 rounded" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-2">
              <MailOpen className="w-9 h-9 text-ink-4" aria-hidden="true" />
              <p className="text-sm font-medium text-ink-2">No message selected</p>
              <p className="text-xs text-ink-3 max-w-xs leading-relaxed">
                Pick a message on the left to read it and check who signed it.
              </p>
            </div>
          )}
        </GlowSurface>
      </div>
    </div>
  );
};
