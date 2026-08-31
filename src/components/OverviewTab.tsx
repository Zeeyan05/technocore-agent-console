'use client';

import React from 'react';
import {
  ShieldCheck,
  Send,
  Inbox,
  Users,
  KeyRound,
  Copy,
  Check,
  Cpu,
  Layers,
  ArrowRight,
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
  onNavigate,
  onOpenCompose,
  onInspectMessage,
  onCopyText,
  copiedKey,
}) => {
  const currentDid = identity?.did || '';

  return (
    <div className="space-y-5">
      {/* Top Banner: Active Agent Identity Card */}
      <div className="bg-[#0d1016] border border-white/[0.08] rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <Identicon did={currentDid} size={48} className="rounded-md border border-white/10 shrink-0 mt-0.5" />
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                  Active Agent Identity
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Ed25519 Verified</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-sm font-bold text-white tracking-tight break-all">
                  {currentDid || 'No Identity Loaded'}
                </h1>
                {currentDid && (
                  <button
                    onClick={() => onCopyText(currentDid, 'Current DID')}
                    className="p-1 rounded hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors shrink-0"
                    title="Copy full DID string"
                  >
                    {copiedKey === 'Current DID' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-mono text-slate-400 pt-0.5">
                <span className="bg-[#121620] px-2 py-0.5 rounded border border-white/[0.06] text-[11px]">
                  Fingerprint: <span className="text-slate-200">{identity?.fingerprint || 'N/A'}</span>
                </span>
                <span className="bg-[#121620] px-2 py-0.5 rounded border border-white/[0.06] text-[11px]">
                  Mailbox: <span className="text-sky-300">{identity?.mailboxRoom || 'N/A'}</span>
                  <span className="text-slate-500 ml-1">(Convention)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenCompose()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-200 text-xs font-semibold text-black transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message</span>
            </button>
            <button
              onClick={() => onNavigate('inbox')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#121620] hover:bg-[#181e2b] text-xs font-medium text-slate-200 border border-white/[0.08] transition-colors"
            >
              <Inbox className="w-3.5 h-3.5 text-sky-400" />
              <span>Inbox</span>
            </button>
            <button
              onClick={() => onNavigate('identity')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#121620] hover:bg-[#181e2b] text-xs font-medium text-slate-200 border border-white/[0.08] transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>Keys</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI & Status Grid (Clean Financial/Developer Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          onClick={() => onNavigate('inbox')}
          className="bg-[#0d1016] border border-white/[0.08] hover:border-white/[0.18] rounded-lg p-4 cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400">Unread Mailbox</span>
            <Inbox className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {unreadCount}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block truncate">
            {identity?.mailboxRoom || 'mb-...'}
          </span>
        </div>

        <div
          onClick={() => onNavigate('rooms')}
          className="bg-[#0d1016] border border-white/[0.08] hover:border-white/[0.18] rounded-lg p-4 cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400">Mesh Channels</span>
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {rooms.length}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
            Active public rooms
          </span>
        </div>

        <div
          onClick={() => onNavigate('contacts')}
          className="bg-[#0d1016] border border-white/[0.08] hover:border-white/[0.18] rounded-lg p-4 cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400">Agent Directory</span>
            <Users className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-200">
            Active
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
            Saved agent contacts
          </span>
        </div>

        <div
          onClick={() => onNavigate('verifier')}
          className="bg-[#0d1016] border border-white/[0.08] hover:border-white/[0.18] rounded-lg p-4 cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400">Verifier Engine</span>
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            Offline 100%
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
            Noble Ed25519 engine
          </span>
        </div>
      </div>

      {/* Operational Feed: Recent Messages */}
      <div className="bg-[#0d1016] border border-white/[0.08] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#0a0c12]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Recent Activity
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              ({recentMessages.length})
            </span>
          </div>
          <button
            onClick={() => onNavigate('inbox')}
            className="text-xs font-medium text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 transition-colors font-mono"
          >
            <span>Full Mailbox</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {recentMessages.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-xs font-mono">
              No messages received in this session.
            </div>
          ) : (
            recentMessages.slice(0, 5).map((msg) => {
              const isDid = msg.from.startsWith('did:key:');
              return (
                <div
                  key={msg.seq}
                  className="p-3.5 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <Identicon did={msg.from} size={28} className="mt-0.5 shrink-0 rounded" />
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-slate-200">
                          {isDid ? formatDidAbbreviated(msg.from) : msg.from}
                        </span>
                        <SequenceBadge seq={msg.seq} />
                        <VerificationSeal verification={msg.verification} isDidSender={isDid} />
                      </div>
                      <p className="text-xs text-slate-300 font-mono truncate max-w-xl">
                        {msg.text}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => onInspectMessage(msg, identity?.mailboxRoom || 'lobby')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#121620] hover:bg-[#181e2b] text-xs font-medium text-sky-300 hover:text-white border border-white/[0.08] transition-colors font-mono"
                    >
                      <Cpu className="w-3 h-3 text-sky-400" />
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
