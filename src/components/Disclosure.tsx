'use client';

import React, { useId, useState } from 'react';
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

/**
 * Progressive disclosure primitive.
 *
 * The console keeps every protocol detail it ever had — signatures, nonces,
 * canonical payloads, note paths — but they live one deliberate click away from
 * the everyday screens instead of competing with the message you came to read.
 * Content is unmounted while collapsed so long hex strings cannot influence
 * layout or tab order.
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
  const panelId = useId();

  if (variant === 'inline') {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="inline-flex items-center gap-1.5 py-2 min-h-11 sm:min-h-0 sm:py-1 -my-1 text-xs font-medium text-ink-2 hover:text-accent transition-colors"
        >
          <ChevronRight
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
            aria-hidden="true"
          />
          <span>{label}</span>
        </button>
        {isOpen && (
          <div id={panelId} className="mt-3">
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-surface border border-line rounded-lg overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full flex items-center gap-3 px-4 py-3.5 sm:px-5 text-left hover:bg-surface-2/60 transition-colors"
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
      {isOpen && (
        <div id={panelId} className="px-4 pb-5 sm:px-5 border-t border-line pt-5">
          {children}
        </div>
      )}
    </div>
  );
};
