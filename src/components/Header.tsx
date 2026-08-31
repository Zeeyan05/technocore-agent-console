'use client';

import React from 'react';
import {
  Send,
  Volume2,
  VolumeX,
  Copy,
  Check,
  SearchCode,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
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
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#0d1016] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Brand & Subtitle with Author Credit */}
        <div className="flex items-center gap-3">
          <BrandLogo size={32} />
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-extrabold tracking-tight text-white">
                TECHNOCORE
              </span>
              <span className="text-sm font-semibold text-sky-400">
                CONSOLE
              </span>
              <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400 border border-white/[0.08]">
                v1.0
              </span>
              <a
                href="https://x.com/ShaikhZeeyan05"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-sky-300 transition-colors"
                title="Shaikh Zeeyan on X"
              >
                <span>by @ShaikhZeeyan05</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            </div>
            <p className="text-[10px] text-slate-500 hidden md:block font-mono leading-none mt-0.5">
              Ed25519 DID Identity &bull; Mailbox Operator &bull; Protocol Inspector
            </p>
          </div>
        </div>

        {/* Right Section: Telemetry & Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Connection Status Indicator */}
          <div
            onClick={onRefreshConnection}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#121620] border border-white/[0.08] text-xs cursor-pointer hover:border-white/[0.18] transition-colors group"
            title="Recheck network latency to technocore.chat"
          >
            <ConnectionDot state={connectionState} />
            {latencyMs !== null && (
              <span className={`text-[10px] font-mono font-medium border-l border-white/[0.08] pl-2 ${latencyColor}`}>
                {latencyMs}ms
              </span>
            )}
            <RefreshCw className={`w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors ${isChecking ? 'animate-spin text-sky-400' : ''}`} />
          </div>

          {/* Standalone Verifier Shortcut */}
          <button
            onClick={onOpenVerifier}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#121620] hover:bg-[#181e2b] border border-white/[0.08] text-xs font-medium text-slate-300 transition-colors"
            title="Open Standalone Protocol Verifier"
          >
            <SearchCode className="w-3.5 h-3.5 text-sky-400" />
            <span>Verifier</span>
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={onToggleAudio}
            className={`p-1.5 rounded-md border transition-colors ${
              audioEnabled
                ? 'bg-[#121620] border-sky-500/30 text-sky-400 hover:bg-[#181e2b]'
                : 'bg-[#121620] border-white/[0.08] text-slate-500 hover:text-slate-300'
            }`}
            title={audioEnabled ? 'Sound FX Enabled' : 'Sound FX Muted'}
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Active Identity Pill */}
          {currentDid && (
            <button
              onClick={() => onCopyDid(currentDid)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#121620] border border-white/[0.08] hover:border-white/[0.2] transition-colors group"
              title={`Click to copy full DID: ${currentDid}`}
            >
              <Identicon did={currentDid} size={16} />
              <span className="font-mono text-[11px] text-slate-300 group-hover:text-white transition-colors">
                {formatDidAbbreviated(currentDid)}
              </span>
              {didCopied ? (
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
              ) : (
                <Copy className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0 transition-colors" />
              )}
            </button>
          )}

          {/* Primary Action Button (Clean Web3 White Button) */}
          <button
            onClick={onOpenCompose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-200 text-xs font-semibold text-black transition-all shadow-sm active:scale-95"
          >
            <Send className="w-3 h-3" />
            <span className="tracking-tight">Compose</span>
          </button>
        </div>
      </div>
    </header>
  );
};
