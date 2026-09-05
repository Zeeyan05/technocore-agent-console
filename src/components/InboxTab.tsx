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
import { Identicon } from './Identicon';
import { VerificationSeal } from './StatusBadge';
import { Disclosure } from './Disclosure';
import { CopyField } from './DataField';
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
 * Everything a developer wants about one message, one click away from the text
 * they actually came to read. Nothing here is new data — it is the same fields
 * the old inbox printed inline, moved behind a deliberate control.
 */
const VerificationDetails: React.FC<{
  msg: VerifiedMessage;
  room: string;
  onCopyText: (text: string, label: string) => void;
  copiedKey: string | null;
  onInspect: () => void;
}> = ({ msg, room, onCopyText, copiedKey, onInspect }) => {
  const v = msg.verification;
  const isSigned = !!msg.sig;

  let ResultIcon = ShieldAlert;
  let resultClass = 'text-warning';
  let resultText = v?.error || 'This message carries no signature, so the sender is not proven.';

  if (v?.valid) {
    ResultIcon = ShieldCheck;
    resultClass = 'text-success';
    resultText = 'Valid Ed25519 signature over the canonical payload.';
  } else if (v?.signatureFormatValid && !v.signatureValid) {
    ResultIcon = ShieldX;
    resultClass = 'text-danger';
    resultText = v.error || 'The signature did not match this payload.';
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <ResultIcon className={`w-4 h-4 shrink-0 mt-0.5 ${resultClass}`} aria-hidden="true" />
        <p className={`text-xs leading-relaxed ${resultClass}`}>{resultText}</p>
      </div>

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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2 transition-colors"
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

  // Honest error state: the poll loop retries automatically every ~5s,
  // so the error shows the real reason plus the fact that it is retrying.
  const hasFatalError = !!error && messages.length === 0 && !isLoading;
  return (
    <div className="space-y-4">
      {/* ── Header: what this screen is, and how to filter it ──────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-line rounded-lg p-4">
        <div className="flex items-center gap-3 min-w-0">
          <Inbox className="w-5 h-5 text-ink-3 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold text-ink">Inbox</h2>
              <span
                className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-2 text-accent border border-line"
                title="The mailbox room this inbox is reading"
              >
                {activeRoom}
              </span>
            </div>
            <p className="text-xs text-ink-3 mt-0.5">
              Messages sent to your agent, checked for a valid signature before you read them.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-surface-2/60 p-1 rounded-md border border-line shrink-0">
          {LIST_SECTIONS.map((section) => (
            <button
              key={section.key}
              onClick={() => setFilter(section.key)}
              aria-pressed={filter === section.key}
              className={`px-3 py-1 min-h-9 sm:min-h-0 rounded text-xs font-medium transition-colors ${
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
            className="inline-flex items-center justify-center p-1 min-w-9 min-h-9 sm:min-w-6 sm:min-h-6 text-ink-3 hover:text-ink hover:bg-surface-3 rounded ml-1 transition-colors"
            title="Mark all as read"
            aria-label="Mark all as read"
          >
            <CheckCheck className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      {/* ── Split view: list on the left, one message on the right ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-surface border border-line rounded-lg overflow-hidden flex flex-col h-[420px] lg:h-[640px]">
          <div className="p-3 border-b border-line bg-surface-2/50">
            <div className="relative">
              <Search className="w-4 h-4 text-ink-4 absolute left-3 top-2.5" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages and senders"
                aria-label="Search messages and senders"
                className="w-full pl-9 pr-3.5 py-1.5 min-h-11 sm:min-h-0 rounded-md bg-bg/60 border border-line text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-line">
            {isLoading ? (
              <div className="p-4 space-y-3" aria-busy="true">
                <span className="sr-only">Loading your messages…</span>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3 p-2">
                    <div className="skeleton w-7 h-7 rounded-full shrink-0" />
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
                <p className="text-ink-2 font-semibold">Could not read your mailbox</p>
                <p className="text-danger break-all px-2 font-mono">{error}</p>
                <p className="text-ink-4">Retrying automatically…</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="px-5 py-12 flex flex-col items-center text-center gap-3">
                <div className="w-11 h-11 rounded-full bg-surface-2 border border-line flex items-center justify-center">
                  <Inbox className="w-5 h-5 text-ink-3" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-ink-2">
                    {filter === 'all' ? 'Your inbox is clear' : 'Nothing matches this filter'}
                  </p>
                  <p className="text-xs text-ink-3 leading-relaxed max-w-xs">
                    {filter === 'all'
                      ? 'No new messages from other agents yet. Share your agent identity so they can reach you.'
                      : 'Switch back to All to see every message in this mailbox.'}
                  </p>
                </div>
                {filter === 'all' && (
                  <button
                    onClick={() => onOpenCompose()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Send a message</span>
                  </button>
                )}
              </div>
            ) : (
              filteredMessages.map((msg) => {
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
                    className={`w-full text-left p-3.5 transition-colors ${
                      isSelected
                        ? 'bg-surface-3/70 border-l-2 border-accent'
                        : msg.isUnread
                        ? 'bg-surface-2/40 hover:bg-surface-2'
                        : 'hover:bg-surface-2/50'
                    }`}
                  >
                    <span className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="flex items-center gap-2 min-w-0">
                        <Identicon did={msg.from} size={22} />
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
        </div>
        <div className="lg:col-span-7 bg-surface border border-line rounded-lg overflow-hidden flex flex-col min-h-[420px] lg:h-[640px]">
          {selectedMessage && selectedSender ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-5 border-b border-line bg-surface-2/50">
                <div className="flex items-start gap-3 min-w-0">
                  <Identicon did={selectedMessage.from} size={36} />
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-ink break-all">
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
                          className="inline-flex items-center justify-center p-1 min-w-9 min-h-9 sm:min-w-6 sm:min-h-6 rounded text-ink-3 hover:text-accent transition-colors shrink-0"
                          aria-label="Copy sender identity"
                          title="Copy sender identity"
                        >
                          {copiedKey === 'Sender DID' ? (
                            <Check className="w-3 h-3 text-success" aria-hidden="true" />
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

                    <p className="text-[11px] text-ink-4 tabular-nums" title={fullTimestamp(selectedMessage.ts)}>
                      {timeAgo(selectedMessage.ts)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5">
                <div className="p-4 bg-bg/50 border border-line rounded-lg text-sm text-ink whitespace-pre-wrap break-words leading-relaxed">
                  {selectedMessage.text}
                </div>

                <Disclosure label="View verification" variant="inline">
                  <VerificationDetails
                    msg={selectedMessage}
                    room={activeRoom}
                    onCopyText={onCopyText}
                    copiedKey={copiedKey}
                    onInspect={() => onInspectMessage(selectedMessage, activeRoom)}
                  />
                </Disclosure>
              </div>

              <div className="p-4 border-t border-line bg-surface-2/50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {!isSenderSaved && isValidDid(selectedMessage.from) && (
                    <button
                      onClick={() =>
                        onAddContact({
                          nickname: `Agent-${selectedMessage.from.slice(8, 14)}`,
                          did: selectedMessage.from,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-2 border border-line transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Save as contact</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => onOpenCompose(selectedMessage.from)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-on-accent text-xs font-semibold transition-colors hover:bg-accent/85"
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
                <div className="skeleton w-9 h-9 rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="skeleton h-3 w-1/3 rounded" />
                  <div className="skeleton h-3 w-1/4 rounded" />
                </div>
              </div>
              <div className="skeleton h-24 w-full rounded-lg" />
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
        </div>
      </div>
    </div>
  );
};
