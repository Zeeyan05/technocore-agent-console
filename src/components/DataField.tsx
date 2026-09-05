'use client';

import React, { useId, useState } from 'react';
import { Check, Copy } from 'lucide-react';

/**
 * Middle-ellipsis a long value: 8f31a0c4…92ac.
 * Protocol values are long enough to wreck a mobile layout, and the head/tail
 * are the parts a human actually uses to eyeball a match.
 */
export function truncateMiddle(value: string, head = 8, tail = 6): string {
  if (!value) return '';
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

type FieldTone = 'ink' | 'accent' | 'success';

const TONE_CLASS: Record<FieldTone, string> = {
  ink: 'text-ink',
  accent: 'text-accent',
  success: 'text-success',
};

interface CopyFieldProps {
  label: string;
  value: string;
  /** Key passed to onCopyText, also compared against copiedKey for the tick. */
  copyLabel: string;
  onCopyText: (text: string, label: string) => void;
  copiedKey: string | null;
  hint?: string;
  tone?: FieldTone;
  /** Truncate by default and offer a "Show full" toggle. */
  truncate?: boolean;
  head?: number;
  tail?: number;
  className?: string;
}

/**
 * One labelled protocol value: truncated by default, copyable, expandable to the
 * full string in a scroll container so a 64-character hex block can never push
 * the layout sideways on a phone.
 */
export const CopyField: React.FC<CopyFieldProps> = ({
  label,
  value,
  copyLabel,
  onCopyText,
  copiedKey,
  hint,
  tone = 'ink',
  truncate = true,
  head = 8,
  tail = 6,
  className = '',
}) => {
  const [showFull, setShowFull] = useState<boolean>(false);
  const valueId = useId();
  const isTruncatable = truncate && value.length > head + tail + 1;
  const shown = isTruncatable && !showFull ? truncateMiddle(value, head, tail) : value;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-ink-3 uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-1 shrink-0">
          {isTruncatable && (
            <button
              type="button"
              onClick={() => setShowFull((v) => !v)}
              aria-expanded={showFull}
              aria-controls={valueId}
              className="px-1.5 py-1.5 min-h-9 sm:min-h-6 sm:py-0.5 rounded text-[11px] font-medium text-ink-3 hover:text-accent transition-colors"
            >
              {showFull ? 'Hide' : 'Show full'}
            </button>
          )}
          <button
            type="button"
            onClick={() => onCopyText(value, copyLabel)}
            className="inline-flex items-center justify-center p-1.5 min-w-9 min-h-9 sm:min-w-0 sm:min-h-0 rounded text-ink-3 hover:text-accent transition-colors"
            aria-label={`Copy ${label}`}
            title={`Copy ${label}`}
          >
            {copiedKey === copyLabel ? (
              <Check className="w-3.5 h-3.5 text-success" aria-hidden="true" />
            ) : (
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      <div
        id={valueId}
        className={`font-mono text-xs ${TONE_CLASS[tone]} ${
          showFull ? 'break-all max-h-32 overflow-y-auto' : 'truncate'
        }`}
      >
        {shown || '—'}
      </div>
      {hint && <p className="text-[11px] text-ink-3 leading-relaxed">{hint}</p>}
    </div>
  );
};
