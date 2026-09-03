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
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-surface-2 text-ink-3 border border-line" title="Self-asserted nickname (unauthenticated lane)">
        <Globe className="w-3 h-3 text-ink-4" />
        <span>Nick</span>
      </span>
    );
  }

  if (!verification) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-surface-2 text-ink-3 border border-line">
        <span>Checking</span>
      </span>
    );
  }

  if (verification.valid) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-success-tint text-success border border-success/30" title="Cryptographically valid Ed25519 signature verified offline">
        <ShieldCheck className="w-3 h-3 text-success" />
        <span>Ed25519</span>
      </span>
    );
  }

  if (verification.signatureFormatValid && !verification.signatureValid) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-danger-tint text-danger border border-danger/30" title="Signature failed cryptographic verification against payload">
        <ShieldX className="w-3 h-3 text-danger" />
        <span>Invalid Sig</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-warning-tint text-warning border border-warning/30" title={verification.error || 'Unverified'}>
      <ShieldAlert className="w-3 h-3 text-warning" />
      <span>Unsigned</span>
    </span>
  );
};

export const SequenceBadge: React.FC<{ seq: number }> = ({ seq }) => {
  return (
    <span className="font-mono text-[10px] text-ink-4 bg-surface-2 border border-line px-1.5 py-0.5 rounded">
      #{String(seq).padStart(5, '0')}
    </span>
  );
};

export const ConnectionDot: React.FC<{ state: ConnectionState }> = ({ state }) => {
  switch (state) {
    case 'connected':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-ink font-mono">
          <span className="w-2 h-2 rounded-full bg-success live-dot" />
          <span>Live</span>
        </span>
      );
    case 'reconnecting':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-warning font-mono">
          <span className="w-2 h-2 rounded-full bg-warning live-dot" />
          <span>Reconnecting</span>
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-danger font-mono">
          <span className="w-2 h-2 rounded-full bg-danger" />
          <span>Offline</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-4 font-mono">
          <span className="w-2 h-2 rounded-full bg-ink-4" />
          <span>Disconnected</span>
        </span>
      );
  }
};
