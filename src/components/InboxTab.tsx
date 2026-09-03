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
  MessageSquare,
  Search,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { Identicon } from './Identicon';
import { VerificationSeal, SequenceBadge } from './StatusBadge';
import { formatDidAbbreviated, isValidDid } from '@/lib/crypto/did';
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
  { key: 'all', label: 'All Messages' },
  { key: 'unread', label: 'Unread' },
  { key: 'verified', label: 'Verified' },
  { key: 'unverified', label: 'Unverified' },
] as const;

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

  // Honest error state: the poll loop retries automatically every ~5s,
  // so the error shows the real reason plus the fact that it is retrying.
  const hasFatalError = !!error && messages.length === 0 && !isLoading;

  return (
    <div className="space-y-4">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-line rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Inbox className="w-5 h-5 text-ink-3" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-ink">Agent Mailbox</h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-2 text-accent border border-line">
                {activeRoom}
              </span>
            </div>
            <p className="text-xs text-ink-3">
              Direct messages to this agent identity, verified offline against Ed25519
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 bg-surface-2/60 p-1 rounded-md border border-line">
          {LIST_SECTIONS.map((section) => (
            <button
              key={section.key}
              onClick={() => setFilter(section.key)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
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
            className="p-1 text-ink-3 hover:text-ink hover:bg-surface-3 rounded ml-1 transition-colors"
            title="Mark all as read"
          >
            <CheckCheck className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Mailbox Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Messages List (5 cols) */}
        <div className="lg:col-span-5 bg-surface border border-line rounded-lg overflow-hidden flex flex-col h-[640px]">
          {/* Search bar */}
          <div className="p-3 border-b border-line bg-surface-2/50">
            <div className="relative">
              <Search className="w-4 h-4 text-ink-4 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages, DIDs, seq..."
                className="w-full pl-9 pr-3.5 py-1.5 rounded-md bg-bg/60 border border-line text-xs font-mono text-ink placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
              />
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-line">
            {isLoading ? (
              <div className="p-4 space-y-3" aria-label="Loading messages">
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
              <div className="p-10 text-center text-xs font-mono space-y-3" role="alert">
                <ShieldAlert className="w-8 h-8 mx-auto text-danger mb-2" />
                <p className="text-ink-2 font-semibold">Failed to read mailbox channel</p>
                <p className="text-danger break-all px-2">{error}</p>
                <p className="text-ink-4">Retrying automatically…</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="px-5 py-12 flex flex-col items-center text-center gap-3">
                <div className="w-11 h-11 rounded-full bg-surface-2 border border-line flex items-center justify-center">
                  <Inbox className="w-5 h-5 text-ink-3" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-ink-2">
                    {filter === 'all' ? 'Nothing here yet' : `No ${filter} messages`}
                  </p>
                  <p className="text-xs text-ink-3 leading-relaxed">
                    {filter === 'all' ? (
                      <>
                        <span className="font-mono text-ink-2">{activeRoom}</span> has no messages.
                        Share your DID with another agent, or send yourself one to see the
                        verification pipeline end to end.
                      </>
                    ) : (
                      <>
                        Nothing in <span className="font-mono text-ink-2">{activeRoom}</span> matches
                        this filter. Switch back to All messages to see everything.
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => onOpenCompose()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send a signed message</span>
                </button>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = selectedMessage?.seq === msg.seq;
                const isDid = msg.from.startsWith('did:key:');

                return (
                  <div
                    key={msg.seq}
                    onClick={() => {
                      setSelectedSeq(msg.seq);
                      if (msg.isUnread) onMarkAsRead(msg.seq);
                    }}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-surface-3/70 border-l-2 border-accent'
                        : msg.isUnread
                        ? 'bg-surface-2/40 hover:bg-surface-2'
                        : 'hover:bg-surface-2/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Identicon did={msg.from} size={22} />
                        <span className="font-mono text-xs font-semibold text-ink truncate">
                          {isDid ? formatDidAbbreviated(msg.from) : msg.from}
                        </span>
                        {msg.isUnread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                        )}
                      </div>
                      <SequenceBadge seq={msg.seq} />
                    </div>

                    <p className="text-xs text-ink-2 font-mono line-clamp-2 leading-relaxed mb-2">
                      {msg.text}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-ink-4 font-mono">
                      <span>{msg.ts ? new Date(msg.ts).toLocaleTimeString() : 'N/A'}</span>
                      <VerificationSeal verification={msg.verification} isDidSender={isDid} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Message Detail & Actions (7 cols) */}
        <div className="lg:col-span-7 bg-surface border border-line rounded-lg overflow-hidden flex flex-col h-[640px]">
          {selectedMessage ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Detail Header */}
              <div className="p-5 border-b border-line bg-surface-2/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Identicon did={selectedMessage.from} size={36} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-ink break-all">
                        {selectedMessage.from}
                      </span>
                      <button
                        onClick={() => onCopyText(selectedMessage.from, 'Sender DID')}
                        className="p-1 text-ink-3 hover:text-accent"
                        title="Copy sender DID"
                      >
                        {copiedKey === 'Sender DID' ? (
                          <Check className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ink-3 font-mono mt-0.5">
                      <span>Seq: #{selectedMessage.seq}</span>
                      <span>Time: {selectedMessage.ts || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Primary Inspect Protocol Trigger */}
                <button
                  onClick={() => onInspectMessage(selectedMessage, activeRoom)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-accent text-on-accent text-xs font-bold transition-colors hover:bg-accent/85 shrink-0"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Inspect Protocol</span>
                </button>
              </div>

              {/* Detail Body */}
              <div className="flex-1 p-6 overflow-y-auto space-y-5">
                {/* Verification Status Box */}
                <div className="p-4 rounded-lg border border-line bg-bg/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                      Cryptographic Status
                    </span>
                    <VerificationSeal
                      verification={selectedMessage.verification}
                      isDidSender={selectedMessage.from.startsWith('did:key:')}
                    />
                  </div>
                  {selectedMessage.verification?.valid ? (
                    <p className="text-xs text-success font-mono leading-relaxed">
                      Genuine Ed25519 signature verified offline against canonical payload &lt;{activeRoom}&gt;|&lt;{selectedMessage.nonce}&gt;|&lt;text&gt;
                    </p>
                  ) : (
                    <p className="text-xs text-ink-3 font-mono leading-relaxed">
                      {selectedMessage.verification?.error ||
                        'Self-asserted sender — no attributable Ed25519 signature on this message.'}
                    </p>
                  )}
                </div>

                {/* Message Body */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                    Message Content
                  </span>
                  <div className="p-4 bg-bg/50 border border-line rounded-lg font-mono text-sm text-ink whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.text}
                  </div>
                </div>

                {/* Protocol Fields Summary */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-surface-2/60 border border-line rounded-md">
                    <span className="text-ink-4 block mb-1">Monotonic Nonce</span>
                    <span className="text-success break-all">{selectedMessage.nonce || 'N/A'}</span>
                  </div>
                  <div className="p-3 bg-surface-2/60 border border-line rounded-md">
                    <span className="text-ink-4 block mb-1">Channel / Room</span>
                    <span className="text-accent">{activeRoom}</span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-4 border-t border-line bg-surface-2/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {!isSenderSaved && isValidDid(selectedMessage.from) && (
                    <button
                      onClick={() =>
                        onAddContact({
                          nickname: `Agent-${selectedMessage.from.slice(8, 14)}`,
                          did: selectedMessage.from,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-2 border border-line transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Save as Contact</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => onOpenCompose(selectedMessage.from)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-accent text-on-accent text-xs font-bold transition-colors hover:bg-accent/85"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply to Agent</span>
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-ink-4">
              <Loader2 className="w-6 h-6 animate-spin mb-3" />
              <span className="text-xs font-mono">Waiting for messages…</span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-ink-3 text-xs font-mono">
              <MessageSquare className="w-10 h-10 mb-3 text-ink-4" />
              <span>Select a message to view protocol telemetry and cryptographic signature</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};