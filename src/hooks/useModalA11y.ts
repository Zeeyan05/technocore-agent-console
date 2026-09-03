'use client';

import { useEffect, useRef } from 'react';

/**
 * Keyboard and screen-reader plumbing shared by every modal in the console.
 *
 * - Escape closes the dialog (unless the caller locks it during an in-flight
 *   operation, e.g. while a message is being signed and broadcast).
 * - Focus moves into the panel on open and returns to the trigger on close, so
 *   keyboard users are not dropped back at the top of the document.
 * - Tab cycles inside the panel only. Without this, Tab walks into the page
 *   behind the backdrop, which is invisible but still focusable.
 *
 * Attach the returned ref to the dialog panel element.
 */
export function useModalA11y(
  isOpen: boolean,
  onClose: () => void,
  options: { lockClose?: boolean } = {}
) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lockClose = options.lockClose ?? false;

  // Read the lock through a ref so the key listener does not need re-binding
  // every time an in-flight status changes.
  const lockRef = useRef(lockClose);
  lockRef.current = lockClose;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = (): HTMLElement[] => {
      const panel = panelRef.current;
      if (!panel) return [];
      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    };

    // Prefer the first real control over the close button when one exists.
    const initial = focusables();
    (initial.find((el) => el.tagName !== 'BUTTON') ?? initial[0] ?? panelRef.current)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (lockRef.current) return;
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const items = focusables();
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && (active === first || !panelRef.current?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    // The page behind a modal must not scroll under it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  return panelRef;
}
