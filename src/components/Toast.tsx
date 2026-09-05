'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  // The live region stays mounted even when empty: screen readers announce
  // changes *inside* an existing region, and a region inserted together with
  // its first message is frequently missed.
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          /* Rises into place from below, which is the direction it came from.
             `anim-rise` is the app's own keyframe — the old `animate-in` classes
             were from a plugin this project does not install, so they animated
             nothing at all. */
          className={`anim-rise pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-lg border surface-raised ${
            toast.type === 'success'
              ? 'border-success/40 text-success'
              : toast.type === 'error'
              ? 'border-danger/40 text-danger'
              : 'border-accent/40 text-accent'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-danger shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-accent shrink-0" />}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            aria-label={`Dismiss notification: ${toast.message}`}
            className="press inline-flex items-center justify-center p-1.5 min-w-9 min-h-9 sm:min-w-0 sm:min-h-0 rounded text-ink-3 hover:text-ink shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
