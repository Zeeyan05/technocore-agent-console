'use client';

import React from 'react';
import {
  ShieldCheck,
  Send,
  Volume2,
  VolumeX,
  Copy,
  Check,
  SearchCode,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Identicon } from './Identicon';
import { ConnectionDot } from './StatusBadge';
import { formatDidAbbreviated } from '@/lib/crypto/did';
import type { Identity } from '@/lib/identity';
import type { ConnectionState } from '@/types/technocore';

interface HeaderProps {
  identity: Identity | null;
  connectionState: ConnectionState;
  latencyMs: number | null;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onOpenCompose: () => void;
  onOpenVerifier: () => void;
  onRefreshConnection: () => void;
  isChecking: boolean;
  onCopyDid: (did: string) => void;
  didCopied: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  identity,
  connectionState,
  latencyMs,
  audioEnabled,
  onToggleAudio,
  onOpenCompose,
  onOpenVerifier,
  onRefreshConnection,
  isChecking,
  onCopyDid,
  didCopied,
}) => {
  const currentDid = identity?.did || '';

  const latencyColor =
    latencyMs === null
      ? 'text-slate-500'
      : latencyMs < 150
      ? 'text-emerald-400'
      : latencyMs < 350
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#07080c]/90 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#0c1524] to-[#121c2e] border border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(0,242,254,0.25)] transition-transform hover:scale-105">
            <ShieldCheck className="w-5 h-5 drop-shadow-[0_0_8px_rgba(0,242,254,0.6)]" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-75" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white font-sans">
                TECHNOCORE
              </span>
              <span className="text-base font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                AGENT CONSOLE
              </span>
              <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                V1 &bull; did:key
              </span>
            </div>
            <p className="text-[11px] text-slate-400/90 hidden sm:flex items-center gap-1.5 font-mono">
              <span>Non-Custodial Developer Control Center</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-slate-400">Target: technocore.chat</span>
            </p>
          </div>
        </div>

        {/* Right Section: Telemetry & Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Connection Status Indicator */}
          <div
            onClick={onRefreshConnection}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e111a] border border-white/[0.08] text-xs cursor-pointer hover:border-white/[0.18] hover:bg-[#131724] transition-all group"
            title="Click to recheck network latency to technocore.chat"
          >
            <ConnectionDot state={connectionState} />
            {latencyMs !== null && (
              <span className={`text-[11px] font-mono font-medium border-l border-white/[0.08] pl-2 ${latencyColor}`}>
                {latencyMs}ms
              </span>
            )}
            <RefreshCw className={`w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors ${isChecking ? 'animate-spin text-cyan-400' : ''}`} />
          </div>

          {/* Standalone Verifier Shortcut */}
          <button
            onClick={onOpenVerifier}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e111a] hover:bg-[#131724] border border-purple-500/25 hover:border-purple-500/50 text-xs font-semibold text-purple-300 transition-all shadow-[0_0_12px_rgba(168,85,247,0.1)]"
            title="Open Standalone Protocol Verifier"
          >
            <SearchCode className="w-3.5 h-3.5 text-purple-400" />
            <span>Verifier</span>
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={onToggleAudio}
            className={`p-2 rounded-lg border transition-all ${
              audioEnabled
                ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/40 shadow-[0_0_10px_rgba(0,242,254,0.15)]'
                : 'bg-[#0e111a] border-white/[0.08] text-slate-500 hover:text-slate-300'
            }`}
            title={audioEnabled ? 'Sound FX Enabled (Mechanical Click Audio)' : 'Sound FX Muted'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Active Identity Pill */}
          {currentDid && (
            <button
              onClick={() => onCopyDid(currentDid)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e111a] border border-white/[0.08] hover:border-cyan-500/50 hover:bg-[#131724] transition-all group shadow-[0_0_12px_rgba(0,0,0,0.4)]"
              title={`Click to copy full DID: ${currentDid}`}
            >
              <Identicon did={currentDid} size={20} />
              <span className="font-mono text-xs text-slate-300 group-hover:text-cyan-300 transition-colors">
                {formatDidAbbreviated(currentDid)}
              </span>
              {didCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0 transition-colors" />
              )}
            </button>
          )}

          {/* Compose / Send Button */}
          <button
            onClick={onOpenCompose}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-bold text-white shadow-[0_0_20px_rgba(0,242,254,0.35)] transition-all hover:scale-105 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline tracking-wide">Compose Message</span>
          </button>
        </div>
      </div>
    </header>
  );
};
