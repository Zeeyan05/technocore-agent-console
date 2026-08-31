'use client';

import React, { useState, useMemo } from 'react';
import {
  Inbox,
  Filter,
  CheckCheck,
  Send,
  Cpu,
  UserPlus,
  Copy,
  Check,
  MessageSquare,
  Search,
  ExternalLink,
  ShieldCheck,
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
  onMarkAsRead: (seq: number) => void;
  onMarkAllAsRead: () => void;
  onInspectMessage: (msg: VerifiedMessage, room: string) => void;
  onOpenCompose: (recipient?: string) => void;
  onAddContact: (contact: { nickname: string; did: string; mailboxRoom?: string; notes?: string }) => void;
  onCopyText: (text: string, label: string) => void;
  copiedKey: string | null;
}

export const InboxTab: React.FC<InboxTabProps> = ({
  messages,
  activeRoom,
  identity,
  contacts,
  isLoading,
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
      // Filter tab
      if (filter === 'unread' && !m.isUnread) return false;
      if (filter === 'verified' && !m.verification?.valid) return false;
      if (filter === 'unverified' && m.verification?.valid) return false;

      // Search query
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

  return (
    <div className="space-y-4">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#11131b] border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">Agent Mailbox</h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                {activeRoom}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Direct and attributable messages addressed to this agent identity
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#0d0f17] p-1 rounded-lg border border-slate-800">
          {(['all', 'unread', 'verified', 'unverified'] as InboxFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f === 'all' ? 'All Messages' : f}
            </button>
          ))}
          <button
            onClick={onMarkAllAsRead}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded ml-1 transition-colors"
            title="Mark all as read"
          >
            <CheckCheck className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Mailbox Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Messages List (5 cols) */}
        <div className="lg:col-span-5 bg-[#11131b] border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[640px]">
          {/* Search bar */}
          <div className="p-3 border-b border-slate-800 bg-[#0d0f17]">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages, DIDs, seq..."
                className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-black/40 border border-slate-800 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-850">
            {filteredMessages.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs font-mono space-y-2">
                <Inbox className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p>No messages matching this filter in {activeRoom}.</p>
                <button
                  onClick={() => onOpenCompose()}
                  className="inline-flex items-center gap-1 text-cyan-400 hover:underline pt-2"
                >
                  <span>Send a test message</span>
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
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-800/80 border-l-2 border-cyan-400'
                        : msg.isUnread
                        ? 'bg-slate-900/40 hover:bg-slate-850'
                        : 'hover:bg-slate-900/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Identicon did={msg.from} size={22} />
                        <span className="font-mono text-xs font-semibold text-slate-200 truncate">
                          {isDid ? formatDidAbbreviated(msg.from) : msg.from}
                        </span>
                        {msg.isUnread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                        )}
                      </div>
                      <SequenceBadge seq={msg.seq} />
                    </div>

                    <p className="text-xs text-slate-300 font-mono line-clamp-2 leading-relaxed mb-2">
                      {msg.text}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{msg.ts ? new Date(msg.ts).toLocaleTimeString() : 'N/A'}</span>
                      <VerificationSeal verification={msg.verification} isDidSender={isDid} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Message Detail & Action Bar (7 cols) */}
        <div className="lg:col-span-7 bg-[#11131b] border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[640px]">
          {selectedMessage ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Detail Header */}
              <div className="p-5 border-b border-slate-800 bg-[#0d0f17] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Identicon did={selectedMessage.from} size={36} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-200 break-all">
                        {selectedMessage.from}
                      </span>
                      <button
                        onClick={() => onCopyText(selectedMessage.from, 'Sender DID')}
                        className="p-1 text-slate-400 hover:text-cyan-300"
                        title="Copy sender DID"
                      >
                        {copiedKey === 'Sender DID' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-0.5">
                      <span>Seq: #{selectedMessage.seq}</span>
                      <span>Time: {selectedMessage.ts || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Primary Inspect Protocol Trigger */}
                <button
                  onClick={() => onInspectMessage(selectedMessage, activeRoom)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-md shadow-cyan-600/20 transition-all shrink-0"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Inspect Protocol</span>
                </button>
              </div>

              {/* Detail Body */}
              <div className="flex-1 p-6 overflow-y-auto space-y-5">
                {/* Verification Seal Status Box */}
                <div className="p-4 rounded-xl border border-slate-800 bg-black/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Cryptographic Status
                    </span>
                    <VerificationSeal
                      verification={selectedMessage.verification}
                      isDidSender={selectedMessage.from.startsWith('did:key:')}
                    />
                  </div>
                  {selectedMessage.verification?.valid && (
                    <p className="text-xs text-emerald-400/90 font-mono leading-relaxed">
                      ✓ Genuine Ed25519 signature verified offline against canonical payload &lt;{activeRoom}&gt;|&lt;{selectedMessage.nonce}&gt;|&lt;text&gt;
                    </p>
                  )}
                </div>

                {/* Message Body */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Message Content
                  </span>
                  <div className="p-4 bg-black/50 border border-slate-800 rounded-xl font-mono text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.text}
                  </div>
                </div>

                {/* Protocol Fields Summary */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <span className="text-slate-500 block">Monotonic Nonce</span>
                    <span className="text-emerald-400 break-all">{selectedMessage.nonce || 'N/A'}</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <span className="text-slate-500 block">Channel / Room</span>
                    <span className="text-cyan-300">{activeRoom}</span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-4 border-t border-slate-800 bg-[#0d0f17] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {!isSenderSaved && isValidDid(selectedMessage.from) && (
                    <button
                      onClick={() =>
                        onAddContact({
                          nickname: `Agent-${selectedMessage.from.slice(8, 14)}`,
                          did: selectedMessage.from,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-purple-300 border border-slate-700 transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Save as Contact</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => onOpenCompose(selectedMessage.from)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply to Agent</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 text-xs font-mono">
              <MessageSquare className="w-10 h-10 mb-3 text-slate-600" />
              <span>Select a message to view protocol telemetry and cryptographic signature</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
