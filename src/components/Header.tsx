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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0a0c12]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400 glow-cyan">
            <ShieldCheck className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping opacity-75" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white">Technocore</span>
              <span className="text-sm font-medium text-cyan-400">Agent Console</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Ed25519 DID Identity &bull; Mailbox Messaging &bull; Protocol Inspector
            </p>
          </div>
        </div>

        {/* Right Section: Telemetry & Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Connection Status Indicator */}
          <div
            onClick={onRefreshConnection}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs cursor-pointer hover:border-slate-700 transition-colors"
            title="Click to recheck connection to technocore.chat"
          >
            <ConnectionDot state={connectionState} />
            {latencyMs !== null && (
              <span className="text-[10px] font-mono text-slate-400 border-l border-slate-800 pl-2">
                {latencyMs}ms
              </span>
            )}
            <RefreshCw className={`w-3 h-3 text-slate-500 hover:text-slate-300 ${isChecking ? 'animate-spin text-cyan-400' : ''}`} />
          </div>

          {/* Standalone Verifier Shortcut */}
          <button
            onClick={onOpenVerifier}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-purple-300 hover:text-purple-200 transition-colors"
            title="Open Standalone Protocol Verifier"
          >
            <SearchCode className="w-3.5 h-3.5 text-purple-400" />
            <span>Verifier</span>
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={onToggleAudio}
            className={`p-2 rounded-lg border transition-colors ${
              audioEnabled
                ? 'bg-slate-900/80 border-slate-800 text-cyan-400 hover:bg-slate-800'
                : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={audioEnabled ? 'Sound FX Enabled' : 'Sound FX Muted'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Active Identity Pill */}
          {currentDid && (
            <button
              onClick={() => onCopyDid(currentDid)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all group"
              title={`Copy Full DID: ${currentDid}`}
            >
              <Identicon did={currentDid} size={20} />
              <span className="font-mono text-xs text-slate-300 group-hover:text-cyan-300">
                {formatDidAbbreviated(currentDid)}
              </span>
              {didCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
              )}
            </button>
          )}

          {/* Compose / Send Button */}
          <button
            onClick={onOpenCompose}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-md shadow-cyan-600/20 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Compose</span>
          </button>
        </div>
      </div>
    </header>
  );
};
