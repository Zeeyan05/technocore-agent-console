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
  Sparkles,
  Radio,
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
    <div className="space-y-6">
      {/* Top Banner: Active Agent Identity Card */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#0c0f1a] via-[#111627] to-[#0c0f1a] border border-cyan-500/30 p-6 sm:p-7 shadow-[0_0_30px_rgba(0,242,254,0.08)] overflow-hidden">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Identicon did={currentDid} size={56} className="border-2 border-cyan-400/50 shadow-[0_0_20px_rgba(0,242,254,0.3)] rounded-xl" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0c0f1a] live-beacon" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Active Technocore Agent</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Ed25519 Verified Keypair</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-sm sm:text-base font-extrabold text-white tracking-tight break-all">
                  {currentDid || 'No Identity Loaded'}
                </h1>
                {currentDid && (
                  <button
                    onClick={() => onCopyText(currentDid, 'Current DID')}
                    className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] text-slate-300 hover:text-cyan-300 transition-all shrink-0 border border-white/[0.08]"
                    title="Copy full DID string"
                  >
                    {copiedKey === 'Current DID' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-400 pt-1">
                <span className="bg-black/40 px-2.5 py-1 rounded-lg border border-white/[0.06]">
                  Fingerprint: <span className="text-purple-300 font-semibold">{identity?.fingerprint || 'N/A'}</span>
                </span>
                <span className="bg-black/40 px-2.5 py-1 rounded-lg border border-white/[0.06]">
                  Mailbox (Convention): <span className="text-emerald-400 font-semibold">{identity?.mailboxRoom || 'N/A'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onOpenCompose()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-bold text-white shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all hover:scale-105 active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message</span>
            </button>
            <button
              onClick={() => onNavigate('inbox')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-xs font-semibold text-slate-200 border border-white/[0.1] hover:border-cyan-500/40 transition-all shadow-sm"
            >
              <Inbox className="w-3.5 h-3.5 text-cyan-400" />
              <span>Open Inbox</span>
            </button>
            <button
              onClick={() => onNavigate('identity')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-xs font-semibold text-slate-200 border border-white/[0.1] hover:border-amber-500/40 transition-all shadow-sm"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Manage Keys</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI & Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('inbox')}
          className="relative overflow-hidden rounded-xl bg-[#0d101a] border border-white/[0.08] hover:border-cyan-500/40 p-5 cursor-pointer transition-all hover:-translate-y-1 group shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between text-slate-400 mb-2.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">Unread Mailbox</span>
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-white tracking-tight">
            {unreadCount}
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-2 block truncate">
            Channel: <span className="text-emerald-400">{identity?.mailboxRoom || 'mb-...'}</span>
          </span>
        </div>

        <div
          onClick={() => onNavigate('rooms')}
          className="relative overflow-hidden rounded-xl bg-[#0d101a] border border-white/[0.08] hover:border-emerald-500/40 p-5 cursor-pointer transition-all hover:-translate-y-1 group shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between text-slate-400 mb-2.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">Mesh Channels</span>
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-white tracking-tight">
            {rooms.length}
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-2 block">
            Public & active rooms
          </span>
        </div>

        <div
          onClick={() => onNavigate('contacts')}
          className="relative overflow-hidden rounded-xl bg-[#0d101a] border border-white/[0.08] hover:border-purple-500/40 p-5 cursor-pointer transition-all hover:-translate-y-1 group shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between text-slate-400 mb-2.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">Agent Directory</span>
            <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-purple-300 tracking-tight">
            Active
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-2 block">
            Saved agent contacts
          </span>
        </div>

        <div
          onClick={() => onNavigate('verifier')}
          className="relative overflow-hidden rounded-xl bg-[#0d101a] border border-white/[0.08] hover:border-cyan-500/40 p-5 cursor-pointer transition-all hover:-translate-y-1 group shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between text-slate-400 mb-2.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">Verifier Engine</span>
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-400 tracking-tight drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]">
            Offline 100%
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-2 block">
            Noble Ed25519 validation
          </span>
        </div>
      </div>

      {/* Operational Feed: Recent Messages */}
      <div className="rounded-2xl bg-[#0d101a] border border-white/[0.08] shadow-[0_4px_25px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/[0.08] bg-[#0a0d16]/80">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Live Operational Messages
            </span>
            <span className="text-xs text-slate-400 font-mono bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/[0.08]">
              {recentMessages.length} received
            </span>
          </div>
          <button
            onClick={() => onNavigate('inbox')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1.5 transition-colors font-mono"
          >
            <span>View Full Mailbox</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {recentMessages.length === 0 ? (
            <div className="p-14 text-center text-slate-500 text-xs font-mono">
              No recent messages received yet. Send a signed message to test live communication.
            </div>
          ) : (
            recentMessages.slice(0, 5).map((msg) => {
              const isDid = msg.from.startsWith('did:key:');
              return (
                <div
                  key={msg.seq}
                  className="p-4 sm:p-5 hover:bg-white/[0.03] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <Identicon did={msg.from} size={34} className="mt-0.5 shrink-0 rounded-lg" />
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {isDid ? formatDidAbbreviated(msg.from) : msg.from}
                        </span>
                        <SequenceBadge seq={msg.seq} />
                        <VerificationSeal verification={msg.verification} isDidSender={isDid} />
                      </div>
                      <p className="text-xs text-slate-300 font-mono truncate max-w-xl bg-black/30 px-2.5 py-1 rounded-md border border-white/[0.04]">
                        {msg.text}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => onInspectMessage(msg, identity?.mailboxRoom || 'lobby')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 text-xs font-semibold text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,242,254,0.15)] transition-all"
                    >
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Inspect Protocol</span>
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
