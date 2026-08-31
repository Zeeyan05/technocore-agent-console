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
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-white/[0.04] text-slate-400 border border-white/[0.08]" title="Self-asserted nickname (unauthenticated lane)">
        <Globe className="w-3 h-3 text-slate-500" />
        <span>Nick</span>
      </span>
    );
  }

  if (!verification) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-white/[0.04] text-slate-400 border border-white/[0.08]">
        <span>Checking</span>
      </span>
    );
  }

  if (verification.valid) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30" title="Cryptographically valid Ed25519 signature verified offline">
        <ShieldCheck className="w-3 h-3 text-emerald-400" />
        <span>Ed25519</span>
      </span>
    );
  }

  if (verification.signatureFormatValid && !verification.signatureValid) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-950/60 text-rose-300 border border-rose-500/40" title="Signature failed cryptographic verification against payload">
        <ShieldX className="w-3 h-3 text-rose-400" />
        <span>Invalid Sig</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-950/50 text-amber-300 border border-amber-500/30" title={verification.error || 'Unverified'}>
      <ShieldAlert className="w-3 h-3 text-amber-400" />
      <span>Unsigned</span>
    </span>
  );
};

export const SequenceBadge: React.FC<{ seq: number }> = ({ seq }) => {
  return (
    <span className="font-mono text-[10px] text-slate-400 bg-[#121620] border border-white/[0.06] px-1.5 py-0.5 rounded">
      #{String(seq).padStart(5, '0')}
    </span>
  );
};

export const ConnectionDot: React.FC<{ state: ConnectionState }> = ({ state }) => {
  switch (state) {
    case 'connected':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-200 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 live-dot" />
          <span>Live</span>
        </span>
      );
    case 'reconnecting':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-amber-500 live-dot" />
          <span>Reconnecting</span>
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Offline</span>
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
