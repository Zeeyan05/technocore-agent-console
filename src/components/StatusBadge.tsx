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

const STATUS_COPY: Record<ConnectionState, { label: string; tone: string }> = {
  connected: { label: 'Connected', tone: 'text-success' },
  reconnecting: { label: 'Reconnecting', tone: 'text-warning' },
  error: { label: 'Connection issue', tone: 'text-danger' },
  disconnected: { label: 'Initializing', tone: 'text-ink-4' },
};

interface StatusIndicatorProps {
  state: ConnectionState;
  /** Round-trip time from the health probe. Rendered only when we have one. */
  latencyMs?: number | null;
  /** True while a mailbox long-poll is open — quickens the ring. */
  isPolling?: boolean;
  /**
   * Change this to fire the one-off arrival pulse. It is used as a remount key,
   * because a finite CSS animation only replays on a fresh element.
   */
  pulseKey?: number;
  /** Hide the word, keep the beacon — for tight spots like the header. */
  dotOnly?: boolean;
  className?: string;
}

/**
 * The system's pulse. Same four states as ConnectionDot, but the dot carries a
 * heartbeat ring whose tempo reflects what the agent is actually doing: a slow
 * breath when idle, a quicker one while the mailbox poll is open, and a short
 * brighter double-beat when a message lands. Failure states do not animate at
 * all — a pulsing error reads as activity, which would be a lie.
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  state,
  latencyMs,
  isPolling = false,
  pulseKey = 0,
  dotOnly = false,
  className = '',
}) => {
  const { label, tone } = STATUS_COPY[state];
  const live = state === 'connected';

  /* The arrival beat is a finite animation, so it has to be both triggered and
     retired: remounting the dot replays it, and dropping back to the steady
     rhythm afterwards is what stops the console from looking permanently
     startled by a message that landed a minute ago. */
  const [arrived, setArrived] = React.useState(false);
  const seenPulse = React.useRef(pulseKey);

  React.useEffect(() => {
    if (pulseKey === seenPulse.current) return;
    seenPulse.current = pulseKey;
    setArrived(true);
    const timer = setTimeout(() => setArrived(false), 1600);
    return () => clearTimeout(timer);
  }, [pulseKey]);

  let beat = '';
  if (live) {
    beat = arrived ? 'beat beat-arrival' : isPolling ? 'beat beat-poll' : 'beat beat-idle';
  } else if (state === 'reconnecting') {
    beat = 'live-dot';
  }

  return (
    <span className={`inline-flex items-center gap-2 ${tone} ${className}`}>
      <span
        key={arrived ? `pulse-${pulseKey}` : 'steady'}
        className={`w-2 h-2 rounded-full bg-current ${beat}`}
        aria-hidden="true"
      />
      {!dotOnly && <span className="text-xs font-medium text-ink">{label}</span>}
      {!dotOnly && typeof latencyMs === 'number' && state === 'connected' && (
        <span className="font-mono text-[10px] text-ink-4 anim-tick" key={latencyMs}>
          {latencyMs}ms
        </span>
      )}
      {/* The beacon alone is not readable, so the word is still announced. */}
      {dotOnly && <span className="sr-only">{label}</span>}
    </span>
  );
};
