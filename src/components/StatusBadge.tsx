'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, Globe } from 'lucide-react';
import type { VerificationBreakdown, ConnectionState } from '@/types/technocore';

interface VerificationSealProps {
  verification?: VerificationBreakdown;
  isDidSender?: boolean;
}

export const VerificationSeal: React.FC<VerificationSealProps> = ({ verification, isDidSender }) => {
  if (!isDidSender) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/50" title="Self-asserted nickname (unauthenticated lane)">
        <Globe className="w-3 h-3 text-slate-500" />
        <span>Unverified Nick</span>
      </span>
    );
  }

  if (!verification) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700/50">
        <span>Checking...</span>
      </span>
    );
  }

  if (verification.valid) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 glow-emerald" title="Cryptographically valid Ed25519 signature verified offline">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Verified Ed25519 ✓</span>
      </span>
    );
  }

  if (verification.signatureFormatValid && !verification.signatureValid) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/50" title="Signature failed cryptographic verification against payload">
        <ShieldX className="w-3.5 h-3.5 text-rose-400" />
        <span>Signature Invalid ✗</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/70 text-amber-300 border border-amber-500/40" title={verification.error || 'Unverified'}>
      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
      <span>Unsigned Record</span>
    </span>
  );
};

export const SequenceBadge: React.FC<{ seq: number }> = ({ seq }) => {
  return (
    <span className="font-mono text-[11px] text-slate-400 bg-slate-900/80 border border-slate-800 px-1.5 py-0.5 rounded">
      #{String(seq).padStart(5, '0')}
    </span>
  );
};

export const ConnectionDot: React.FC<{ state: ConnectionState }> = ({ state }) => {
  switch (state) {
    case 'connected':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse glow-emerald" />
          <span>Connected</span>
        </span>
      );
    case 'reconnecting':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>Reconnecting</span>
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Disconnected</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-slate-500" />
          <span>Disconnected</span>
        </span>
      );
  }
};
