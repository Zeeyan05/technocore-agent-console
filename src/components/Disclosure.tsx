'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface DisclosureProps {
  /** Visible trigger text, e.g. "Advanced identity" or "View verification". */
  label: string;
  /** Optional one-line explanation shown next to / under the label. */
  hint?: string;
  /** Cards read as a section; inline reads as a quiet text control inside a card. */
  variant?: 'card' | 'inline';
  icon?: LucideIcon;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Matches `--dur-3` in globals.css, the duration `.collapsible` animates for. */
const COLLAPSE_MS = 240;

/**
 * Progressive disclosure primitive.
 *
 * The console keeps every protocol detail it ever had — signatures, nonces,
 * canonical payloads, note paths — but they live one deliberate click away from
 * the everyday screens instead of competing with the message you came to read.
 *
 * Opening and closing is a real height transition (`.collapsible` interpolates
 * `grid-template-rows` between `0fr` and `1fr`, so no height has to be measured
 * in JS). The children still unmount once the closing transition has finished,
 * which is what keeps long hex strings out of layout and out of the tab order;
 * `inert` covers the few frames where they are collapsing but still present.
 */
export const Disclosure: React.FC<DisclosureProps> = ({
  label,
  hint,
  variant = 'card',
  icon: Icon,
  defaultOpen = false,
  className = '',
  children,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);
  const [isMounted, setIsMounted] = useState<boolean>(defaultOpen);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelId = useId();

  useEffect(
    () => () => {
      if (unmountTimer.current) clearTimeout(unmountTimer.current);
    },
    []
  );

  const toggle = () => {
    if (unmountTimer.current) {
      clearTimeout(unmountTimer.current);
      unmountTimer.current = null;
    }
    if (isOpen) {
      setIsOpen(false);
      unmountTimer.current = setTimeout(() => setIsMounted(false), COLLAPSE_MS);
    } else {
      // Mount first so the row has something to grow into on the same frame.
      setIsMounted(true);
      setIsOpen(true);
    }
  };

  if (variant === 'inline') {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="press inline-flex items-center gap-1.5 py-2 min-h-11 sm:min-h-0 sm:py-1 -my-1 text-xs font-medium text-ink-2 hover:text-accent"
        >
          <ChevronRight
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
            aria-hidden="true"
          />
          <span>{label}</span>
        </button>
        <div className="collapsible" data-open={isOpen} inert={!isOpen}>
          <div id={panelId}>{isMounted && <div className="mt-3">{children}</div>}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`surface-raised border border-line rounded-xl overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="press w-full flex items-center gap-3 px-4 py-3.5 sm:px-5 text-left hover:bg-surface-2/60"
      >
        <ChevronRight
          className={`w-4 h-4 text-ink-3 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
          aria-hidden="true"
        />
        {Icon && <Icon className="w-4 h-4 text-ink-3 shrink-0" aria-hidden="true" />}
        <span className="min-w-0">
          <span className="block text-sm font-medium text-ink">{label}</span>
          {hint && <span className="block text-xs text-ink-3 mt-0.5">{hint}</span>}
        </span>
      </button>
      <div className="collapsible" data-open={isOpen} inert={!isOpen}>
        <div id={panelId}>
          {isMounted && (
            <div className="px-4 pb-5 sm:px-5 border-t border-line pt-5">{children}</div>
          )}
        </div>
      </div>
    </div>
  );
};
