'use client';

import React from 'react';

type ActivityTone = 'success' | 'accent' | 'identity' | 'warning' | 'neutral';

const TONE: Record<ActivityTone, string> = {
  success: 'bg-success',
  accent: 'bg-accent',
  identity: 'bg-identity',
  warning: 'bg-warning',
  neutral: 'bg-ink-4',
};

interface ActivityItemProps {
  title: React.ReactNode;
  /** The secondary line. Facts only — this feed never narrates. */
  detail?: React.ReactNode;
  timestamp?: string;
  tone?: ActivityTone;
  /** Draw the rail down to the row below. False on the last row. */
  connected?: boolean;
  /** Breathe the dot, for a state that is still ongoing. */
  live?: boolean;
  /** Position in the feed. Drives the staggered entrance; omit for a static row. */
  index?: number;
  /** Makes the row a button. Used when the event has somewhere to go. */
  onClick?: () => void;
  className?: string;
}

/**
 * One line in the activity rail: a state dot on a vertical thread, a title, a
 * secondary detail and a timestamp. Used for both message events and system
 * events, so the two read as one chronology instead of two widgets.
 */
export const ActivityItem: React.FC<ActivityItemProps> = ({
  title,
  detail,
  timestamp,
  tone = 'neutral',
  connected = true,
  live = false,
  index,
  onClick,
  className = '',
}) => {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] text-ink leading-snug min-w-0">{title}</p>
        {timestamp && (
          <time className="font-mono text-[10px] text-ink-4 shrink-0 pt-0.5">{timestamp}</time>
        )}
      </div>
      {detail && <p className="mt-0.5 text-[11px] text-ink-3 leading-relaxed">{detail}</p>}
    </>
  );

  return (
    <li
      className={`relative flex gap-3 pb-4 last:pb-0 ${
        index === undefined ? '' : 'anim-row anim-stagger'
      } ${className}`}
      style={index === undefined ? undefined : ({ '--i': Math.min(index, 8) } as React.CSSProperties)}
    >
      <span className="relative flex flex-col items-center shrink-0 pt-1.5" aria-hidden="true">
        <span className={`w-2 h-2 rounded-full ${TONE[tone]} ${live ? 'live-dot' : ''}`} />
        {connected && <span className="w-px flex-1 mt-1.5 bg-line" />}
      </span>

      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="press min-w-0 flex-1 text-left rounded-md -mx-2 -my-1 px-2 py-1 hover:bg-surface-2"
        >
          {body}
        </button>
      ) : (
        <div className="min-w-0 flex-1">{body}</div>
      )}
    </li>
  );
};
