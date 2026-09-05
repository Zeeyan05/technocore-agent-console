'use client';

import React from 'react';
import { GlowSurface } from './Surface';

/**
 * A number that means something. §10's rule is that the four Overview tiles must
 * not read as four identical rectangles, so each one carries its own small
 * visualization and the grid places them at different weights.
 *
 * Every value passed in here comes from real console state. There are no derived
 * "engagement" numbers, no invented rates, and no placeholder trends.
 */
interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  /** One short factual line. Describes the number; never embellishes it. */
  detail?: string;
  icon?: React.ReactNode;
  visual?: React.ReactNode;
  onClick?: () => void;
  /** Spoken name for the whole tile when it is a button. */
  actionLabel?: string;
  tone?: 'neutral' | 'accent' | 'identity';
  /**
   * How loud the figure is. `lg` marks the lead tile; `sm` is for values that are
   * a string rather than a count, where 4xl mono would simply overflow.
   */
  valueSize?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TONE_RING: Record<'neutral' | 'accent' | 'identity', string> = {
  neutral: 'text-ink-4',
  accent: 'text-accent',
  identity: 'text-identity',
};

const VALUE_SIZE: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'text-base sm:text-lg',
  md: 'text-2xl',
  lg: 'text-3xl sm:text-4xl',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  detail,
  icon,
  visual,
  onClick,
  actionLabel,
  tone = 'neutral',
  valueSize = 'md',
  className = '',
}) => {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-4">{label}</p>
          <p
            className={`mt-2 font-mono font-bold tracking-tight text-ink truncate ${VALUE_SIZE[valueSize]}`}
          >
            {value}
          </p>
        </div>
        {icon && <span className={`shrink-0 ${TONE_RING[tone]}`}>{icon}</span>}
      </div>

      {detail && <p className="mt-1 text-[11px] text-ink-3 leading-relaxed">{detail}</p>}
      {visual && <div className="mt-3">{visual}</div>}
    </>
  );

  if (!onClick) {
    return (
      <GlowSurface className={`p-4 sm:p-5 ${className}`} aria-label={actionLabel}>
        {body}
      </GlowSurface>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={actionLabel}
      className={`press surface-raised surface-lift relative rounded-xl p-4 sm:p-5 text-left w-full h-full hover:bg-surface-2 ${className}`}
    >
      {body}
    </button>
  );
};

/**
 * Message arrivals over the recent window, one bar per bucket. The buckets are
 * counted from the messages actually in the mailbox — an empty mailbox draws a
 * flat baseline rather than an invented waveform.
 */
export const ActivityWave: React.FC<{ buckets: number[]; className?: string }> = ({
  buckets,
  className = '',
}) => {
  const max = Math.max(1, ...buckets);

  return (
    <svg
      viewBox={`0 0 ${buckets.length * 4} 20`}
      className={`w-full h-5 ${className}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {buckets.map((count, i) => {
        const height = count > 0 ? Math.max(3, (count / max) * 19) : 1.5;
        return (
          <rect
            key={i}
            x={i * 4}
            y={20 - height}
            width="2.4"
            height={height}
            rx="1.2"
            className={count > 0 ? 'fill-accent' : 'fill-line-2'}
          />
        );
      })}
    </svg>
  );
};

/**
 * Rooms as a small connected cluster. The node count is the real room count,
 * capped at nine so the shape stays readable; the chords are structural, not
 * a claim about the topology.
 */
export const NodeCluster: React.FC<{ count: number; className?: string }> = ({
  count,
  className = '',
}) => {
  const n = Math.max(1, Math.min(count, 9));
  const nodes = Array.from({ length: n }, (_, i) => {
    const a = ((i * 360) / n - 90) * (Math.PI / 180);
    return { x: 20 + Math.cos(a) * 14, y: 10 + Math.sin(a) * 8 };
  });

  return (
    <svg
      viewBox="0 0 40 20"
      className={`w-full h-5 ${className}`}
      preserveAspectRatio="xMinYMid meet"
      aria-hidden="true"
    >
      {nodes.map((node, i) => {
        const next = nodes[(i + 1) % n];
        return (
          <line
            key={`l${i}`}
            x1={node.x.toFixed(2)}
            y1={node.y.toFixed(2)}
            x2={next.x.toFixed(2)}
            y2={next.y.toFixed(2)}
            className="stroke-line-2"
            strokeWidth="0.8"
          />
        );
      })}
      {nodes.map((node, i) => (
        <circle key={i} cx={node.x.toFixed(2)} cy={node.y.toFixed(2)} r="1.8" className="fill-accent" />
      ))}
    </svg>
  );
};

/**
 * The mailbox listening. Three arcs facing the channel; the outermost breathes
 * only while a long-poll is genuinely open, so the animation is a report on the
 * connection rather than decoration.
 */
export const SignalArcs: React.FC<{ active?: boolean; className?: string }> = ({
  active = false,
  className = '',
}) => (
  /* Anchored left and sized to sit fully inside the 20-unit band — an arc that
     runs past the viewBox gets clipped, which reads as a rendering fault. */
  <svg
    viewBox="0 0 40 20"
    className={`w-full h-5 ${className}`}
    preserveAspectRatio="xMinYMid meet"
    aria-hidden="true"
  >
    <circle cx="5" cy="17" r="2" className="fill-accent" />
    <path d="M10 17a6 6 0 0 0-6-6" fill="none" className="stroke-accent" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
    <path d="M16 17a12 12 0 0 0-12-12" fill="none" className="stroke-accent" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
    <path
      d="M21 17a16 16 0 0 0-16-16"
      fill="none"
      className={`stroke-accent ${active ? 'live-dot' : ''}`}
      strokeWidth="1.4"
      strokeLinecap="round"
      opacity="0.28"
    />
  </svg>
);
