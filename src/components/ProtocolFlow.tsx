'use client';

import React from 'react';
import { Check, ChevronRight, X } from 'lucide-react';

export interface FlowStep {
  label: string;
  state: 'ok' | 'fail' | 'pending';
  /** One line of what this stage actually checked. */
  detail?: string;
}

const STATE_CLASS: Record<FlowStep['state'], string> = {
  ok: 'border-success/35 bg-success-tint text-success',
  fail: 'border-danger/35 bg-danger-tint text-danger',
  pending: 'border-line bg-surface-2 text-ink-4',
};

/**
 * The path a message takes to become trusted, drawn as stages rather than
 * described in a paragraph: payload → signature → identity → verdict.
 *
 * Every stage reflects a check the console really performs. Nothing here is
 * illustrative; a stage that has not run shows as pending rather than green.
 *
 * Lays out as a row on desktop and a column on phones — a four-stage strip
 * cannot fit across 360px without either overflowing or becoming unreadable.
 */
export const ProtocolFlow: React.FC<{ steps: FlowStep[]; className?: string }> = ({
  steps,
  className = '',
}) => (
  <ol className={`flex flex-col sm:flex-row sm:items-stretch gap-1.5 sm:gap-0 ${className}`}>
    {steps.map((step, i) => (
      <li key={step.label} className="flex sm:flex-1 items-center gap-1.5 sm:gap-0 min-w-0">
        <div
          className={`flex-1 min-w-0 flex items-center gap-2 rounded-lg border px-2.5 py-2 ${
            STATE_CLASS[step.state]
          }`}
        >
          <span className="shrink-0" aria-hidden="true">
            {step.state === 'ok' ? (
              <Check className="w-3.5 h-3.5" />
            ) : step.state === 'fail' ? (
              <X className="w-3.5 h-3.5" />
            ) : (
              <span className="block w-3 h-3 rounded-full border border-current opacity-60" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider truncate">
              {step.label}
            </span>
            {step.detail && (
              <span className="block text-[10px] text-ink-3 leading-tight truncate">
                {step.detail}
              </span>
            )}
          </span>
        </div>

        {i < steps.length - 1 && (
          <ChevronRight
            className="w-3.5 h-3.5 shrink-0 text-ink-4 rotate-90 sm:rotate-0 sm:mx-1"
            aria-hidden="true"
          />
        )}
      </li>
    ))}
  </ol>
);
