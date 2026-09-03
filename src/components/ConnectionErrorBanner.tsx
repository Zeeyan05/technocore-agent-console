'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface ConnectionErrorBannerProps {
  reason: string;
  onRetry: () => void;
  onDismiss: () => void;
}

/**
 * Spec-required error pattern:
 * "Unable to connect to Technocore. Reason: <actual error> [Retry]"
 * The reason is the real error message from the network layer — never a
 * generic placeholder.
 */
export const ConnectionErrorBanner: React.FC<ConnectionErrorBannerProps> = ({
  reason,
  onRetry,
  onDismiss,
}) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="w-full border-b border-danger/30 bg-danger-tint px-4 py-2.5"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <p className="text-xs text-ink leading-relaxed min-w-0">
            <span className="font-semibold text-danger">Unable to connect to Technocore.</span>{' '}
            <span className="text-ink-2">Reason: </span>
            <span className="font-mono text-ink-2 break-all">{reason}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-3 hover:bg-surface-2 border border-line-2 text-xs font-medium text-ink transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-md text-ink-3 hover:text-ink transition-colors"
            aria-label="Dismiss connection error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};