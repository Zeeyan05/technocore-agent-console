'use client';

import React from 'react';
import {
  Send,
  Inbox,
  Users,
  KeyRound,
  Copy,
  Check,
  Cpu,
  Layers,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { Identicon } from './Identicon';
import { VerificationSeal, SequenceBadge } from './StatusBadge';
import { formatDidAbbreviated } from '@/lib/crypto/did';
import type { Identity } from '@/lib/identity';
import type { VerifiedMessage } from '@/hooks/useMailbox';
import type { RoomInfo } from '@/types/technocore';
import type { NavTab } from './Navigation';

interface OverviewTabProps {
  identity: Identity | null;
  unreadCount: number;
  recentMessages: VerifiedMessage[];
  rooms: RoomInfo[];
  contactsCount: number;
  onNavigate: (tab: NavTab) => void;
  onOpenCompose: (recipient?: string) => void;
  onInspectMessage: (msg: VerifiedMessage, room: string) => void;
  onCopyText: (text: string, label: string) => void;
  copiedKey: string | null;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  identity,
  unreadCount,
  recentMessages,
  rooms,
  contactsCount,
  onNavigate,
  onOpenCompose,
  onInspectMessage,
  onCopyText,
  copiedKey,
}) => {
  const currentDid = identity?.did || '';
  const verifiedCount = recentMessages.filter((m) => m.verification?.valid).length;

  return (
    <div className="space-y-5">
      {/* Active Identity Card */}
      <div className="bg-surface border border-line rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <Identicon did={currentDid} size={48} className="rounded-md border border-line shrink-0 mt-0.5" />
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-ink-3">
                  Active Agent Identity
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-surface-2 text-ink-2 border border-line">
                  <ShieldCheck className="w-3 h-3 text-accent" />
                  <span>did:key &bull; Ed25519</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-sm font-semibold text-ink break-all">
                  {currentDid || 'No Identity Loaded'}
                </h1>
                {currentDid && (
                  <button
                    onClick={() => onCopyText(currentDid, 'Current DID')}
                    className="p-1 rounded hover:bg-surface-2 text-ink-3 hover:text-ink transition-colors shrink-0"
                    title="Copy full DID string"
                  >
                    {copiedKey === 'Current DID' ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-mono text-ink-3">
                <span className="bg-surface-2 px-2 py-0.5 rounded border border-line text-[11px]">
                  Fingerprint: <span className="text-ink">{identity?.fingerprint || 'N/A'}</span>
                </span>
                <span className="bg-surface-2 px-2 py-0.5 rounded border border-line text-[11px]">
                  Mailbox: <span className="text-accent">{identity?.mailboxRoom || 'N/A'}</span>
                  <span className="text-ink-4 ml-1">(Convention)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenCompose()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-on-accent text-xs font-bold transition-colors hover:bg-accent/85"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message</span>
            </button>
            <button
              onClick={() => onNavigate('inbox')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-2 border border-line transition-colors"
            >
              <Inbox className="w-3.5 h-3.5 text-ink-3" />
              <span>Inbox</span>
            </button>
            <button
              onClick={() => onNavigate('identity')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-2 border border-line transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-ink-3" />
              <span>Keys</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real KPI Grid — every value is live data, never marketing copy */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          onClick={() => onNavigate('inbox')}
          className="bg-surface border border-line hover:border-line-2 rounded-lg p-4 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-3">Unread</span>
            <Inbox className="w-3.5 h-3.5 text-ink-4" />
          </div>
          <div className="text-2xl font-semibold font-mono text-ink tabular-nums">
            {unreadCount}
          </div>
          <span className="text-[10px] text-ink-4 font-mono mt-1 block truncate">
            {identity?.mailboxRoom || 'mb-...'}
          </span>
        </div>

        <div
          onClick={() => onNavigate('rooms')}
          className="bg-surface border border-line hover:border-line-2 rounded-lg p-4 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-3">Channels</span>
            <Layers className="w-3.5 h-3.5 text-ink-4" />
          </div>
          <div className="text-2xl font-semibold font-mono text-ink tabular-nums">
            {rooms.length}
          </div>
          <span className="text-[10px] text-ink-4 font-mono mt-1 block">
            Rooms reachable from /rooms
          </span>
        </div>

        <div
          onClick={() => onNavigate('contacts')}
          className="bg-surface border border-line hover:border-line-2 rounded-lg p-4 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-3">Contacts</span>
            <Users className="w-3.5 h-3.5 text-ink-4" />
          </div>
          <div className="text-2xl font-semibold font-mono text-ink tabular-nums">
            {contactsCount}
          </div>
          <span className="text-[10px] text-ink-4 font-mono mt-1 block">
            Saved agent contacts
          </span>
        </div>

        <div
          onClick={() => onNavigate('verifier')}
          className="bg-surface border border-line hover:border-line-2 rounded-lg p-4 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-3">Verified</span>
            <ShieldCheck className="w-3.5 h-3.5 text-ink-4" />
          </div>
          <div className="text-2xl font-semibold font-mono text-ink tabular-nums">
            {verifiedCount}
          </div>
          <span className="text-[10px] text-ink-4 font-mono mt-1 block">
            Ed25519-valid in this session
          </span>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-surface border border-line rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-surface-2/50">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-ink-4" />
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-2 font-mono">
              Recent Activity
            </span>
            <span className="text-[11px] text-ink-4 font-mono">
              ({recentMessages.length})
            </span>
          </div>
          <button
            onClick={() => onNavigate('inbox')}
            className="text-xs font-medium text-accent hover:text-accent/80 inline-flex items-center gap-1 transition-colors font-mono"
          >
            <span>Full Mailbox</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="divide-y divide-line">
          {recentMessages.length === 0 ? (
            <div className="px-6 py-10 flex flex-col items-center text-center gap-3">
              <div className="w-11 h-11 rounded-full bg-surface-2 border border-line flex items-center justify-center">
                <Inbox className="w-5 h-5 text-ink-3" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-ink-2">Your mailbox is quiet</p>
                <p className="text-xs text-ink-3 max-w-xs leading-relaxed">
                  Nothing has arrived in{' '}
                  <span className="font-mono text-ink-2">{identity?.mailboxRoom ?? 'your mailbox'}</span> yet.
                  Signed messages appear here the moment they are verified.
                </p>
              </div>
              <button
                onClick={() => onOpenCompose()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send a test message to yourself</span>
              </button>
            </div>
          ) : (
            recentMessages.slice(0, 5).map((msg) => {
              const isDid = msg.from.startsWith('did:key:');
              return (
                <div
                  key={msg.seq}
                  className="p-3.5 hover:bg-surface-2/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <Identicon did={msg.from} size={28} className="mt-0.5 shrink-0 rounded" />
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-ink">
                          {isDid ? formatDidAbbreviated(msg.from) : msg.from}
                        </span>
                        <SequenceBadge seq={msg.seq} />
                        <VerificationSeal verification={msg.verification} isDidSender={isDid} />
                      </div>
                      <p className="text-xs text-ink-2 font-mono truncate max-w-xl">
                        {msg.text}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => onInspectMessage(msg, identity?.mailboxRoom || 'lobby')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-2 hover:text-ink border border-line transition-colors font-mono"
                    >
                      <Cpu className="w-3 h-3 text-ink-4" />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};