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
  ExternalLink,
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
      <div className="bg-gradient-to-r from-[#111420] to-[#151928] border border-slate-700/70 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <Identicon did={currentDid} size={54} className="border-2 border-cyan-500/40 shadow-lg glow-cyan" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  Active Technocore Agent
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Ed25519 Ready</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-sm sm:text-base font-bold text-white tracking-tight break-all">
                  {currentDid || 'No Identity Loaded'}
                </h1>
                {currentDid && (
                  <button
                    onClick={() => onCopyText(currentDid, 'Current DID')}
                    className="p-1 rounded hover:bg-slate-700/60 text-slate-400 hover:text-cyan-300 transition-colors shrink-0"
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
                <span>Fingerprint: <span className="text-purple-300">{identity?.fingerprint || 'N/A'}</span></span>
                <span>Mailbox Room (Convention): <span className="text-emerald-400 font-semibold">{identity?.mailboxRoom || 'N/A'}</span></span>
              </div>
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onOpenCompose()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-md shadow-cyan-600/25 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message</span>
            </button>
            <button
              onClick={() => onNavigate('inbox')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              <Inbox className="w-3.5 h-3.5 text-cyan-400" />
              <span>Open Inbox</span>
            </button>
            <button
              onClick={() => onNavigate('identity')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Manage Identity</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI & Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('inbox')}
          className="bg-[#11131b] border border-slate-800 hover:border-slate-700 rounded-xl p-4.5 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Unread Mailbox</span>
            <Inbox className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {unreadCount}
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">
            Channel (Convention): {identity?.mailboxRoom || 'mb-...'}
          </span>
        </div>

        <div
          onClick={() => onNavigate('rooms')}
          className="bg-[#11131b] border border-slate-800 hover:border-slate-700 rounded-xl p-4.5 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Mesh Channels</span>
            <Layers className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {rooms.length}
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">
            Public & custom rooms
          </span>
        </div>

        <div
          onClick={() => onNavigate('contacts')}
          className="bg-[#11131b] border border-slate-800 hover:border-slate-700 rounded-xl p-4.5 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Agent Directory</span>
            <Users className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            Active
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">
            Saved agent contacts
          </span>
        </div>

        <div
          onClick={() => onNavigate('verifier')}
          className="bg-[#11131b] border border-slate-800 hover:border-slate-700 rounded-xl p-4.5 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Verifier Engine</span>
            <Cpu className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            Offline 100%
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">
            Noble Ed25519 validation
          </span>
        </div>
      </div>

      {/* Operational Feed: Recent Messages */}
      <div className="bg-[#11131b] border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0d0f17]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Recent Operational Messages
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ({recentMessages.length} received)
            </span>
          </div>
          <button
            onClick={() => onNavigate('inbox')}
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 transition-colors"
          >
            <span>View Full Mailbox</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-850">
          {recentMessages.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs font-mono">
              No recent messages received yet. Send a signed message to test live communication.
            </div>
          ) : (
            recentMessages.slice(0, 5).map((msg) => {
              const isDid = msg.from.startsWith('did:key:');
              return (
                <div
                  key={msg.seq}
                  className="p-4 hover:bg-slate-900/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <Identicon did={msg.from} size={30} className="mt-0.5" />
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
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-400 hover:text-cyan-300 border border-slate-700 transition-colors"
                    >
                      <Cpu className="w-3 h-3" />
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
