'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, Globe } from 'lucide-react';
import type { VerificationBreakdown, ConnectionState } from '@/types/technocore';

interface VerificationSealProps {
  verification?: VerificationBreakdown;
  isDidSender?: boolean;
  /** compact fits inside a dense list row; full is for detail headers. */
  variant?: 'compact' | 'full';
}

const SEAL_BASE =
  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap';

/**
 * What a human needs from a signature check is "can I trust who sent this",
 * so the badge says that in words. The exact cryptographic reason stays in the
 * tooltip, and the full breakdown lives behind "View verification".
 */
export const VerificationSeal: React.FC<VerificationSealProps> = ({
  verification,
  isDidSender,
  variant = 'compact',
}) => {
  const full = variant === 'full';

  if (!isDidSender) {
    return (
      <span
        className={`${SEAL_BASE} bg-surface-2 text-ink-3 border border-line`}
        title="Sender used a self-asserted nickname instead of a signed agent identity, so there is nothing to verify."
      >
        <Globe className="w-3 h-3 text-ink-4" aria-hidden="true" />
        <span>{full ? 'Unverified name' : 'Name only'}</span>
      </span>
    );
  }

  if (!verification) {
    return (
      <span className={`${SEAL_BASE} bg-surface-2 text-ink-3 border border-line`}>
        <span>Checking…</span>
      </span>
    );
  }

  if (verification.valid) {
    return (
      <span
        className={`${SEAL_BASE} bg-success-tint text-success border border-success/30 font-semibold`}
        title="Ed25519 signature verified locally in this browser against the canonical payload."
      >
        <ShieldCheck className="w-3 h-3 text-success" aria-hidden="true" />
        <span>{full ? 'Verified agent' : 'Verified'}</span>
      </span>
    );
  }

  if (verification.signatureFormatValid && !verification.signatureValid) {
    return (
      <span
        className={`${SEAL_BASE} bg-danger-tint text-danger border border-danger/30 font-semibold`}
        title={verification.error || 'Signature failed cryptographic verification against the payload.'}
      >
        <ShieldX className="w-3 h-3 text-danger" aria-hidden="true" />
        <span>{full ? 'Signature failed' : 'Failed'}</span>
      </span>
    );
  }

  return (
    <span
      className={`${SEAL_BASE} bg-warning-tint text-warning border border-warning/30`}
      title={verification.error || 'This message carries no usable signature, so the sender is not proven.'}
    >
      <ShieldAlert className="w-3 h-3 text-warning" aria-hidden="true" />
      <span>Not signed</span>
    </span>
  );
};

export const SequenceBadge: React.FC<{ seq: number }> = ({ seq }) => {
  return (
    <span
      className="font-mono text-[10px] text-ink-4 bg-surface-2 border border-line px-1.5 py-0.5 rounded"
      title="Server-assigned sequence number"
    >
      #{String(seq).padStart(5, '0')}
    </span>
  );
};

/**
 * Connection wording maps the four protocol states onto language that does not
 * read as "the app is broken" before the first health probe has even returned.
 */
export const ConnectionDot: React.FC<{ state: ConnectionState }> = ({ state }) => {
  switch (state) {
    case 'connected':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-ink">
          <span className="w-2 h-2 rounded-full bg-success live-dot" aria-hidden="true" />
          <span>Connected</span>
        </span>
      );
    case 'reconnecting':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-warning">
          <span className="w-2 h-2 rounded-full bg-warning live-dot" aria-hidden="true" />
          <span>Reconnecting</span>
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-danger">
          <span className="w-2 h-2 rounded-full bg-danger" aria-hidden="true" />
          <span>Connection issue</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
          <span className="w-2 h-2 rounded-full bg-ink-4 live-dot" aria-hidden="true" />
          <span>Initializing</span>
        </span>
      );
  }
};
