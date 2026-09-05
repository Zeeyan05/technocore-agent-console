'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Copy, Check, Eye, EyeOff, Download } from 'lucide-react';
import { useModalA11y } from '@/hooks/useModalA11y';
import type { Identity } from '@/lib/identity';

interface ExportSeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity: Identity | null;
  onCopyText: (text: string, label: string) => Promise<boolean>;
}

export const ExportSeedModal: React.FC<ExportSeedModalProps> = ({
  isOpen,
  onClose,
  identity,
  onCopyText,
}) => {
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [showSeed, setShowSeed] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleClose = () => {
    setConfirmed(false);
    setShowSeed(false);
    onClose();
  };

  const panelRef = useModalA11y(isOpen, handleClose);

  if (!isOpen || !identity) return null;

  const hexSeed = identity.exportHexSeed();
  const base58Seed = identity.exportBase58Seed();

  const handleCopy = async (text: string, key: string, label: string) => {
    // Only flash the check-mark if the clipboard write actually succeeded.
    const ok = await onCopyText(text, label);
    if (!ok) return;
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-seed-title"
        className="modal-panel relative w-full max-w-lg surface-raised border border-line-2 rounded-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface-2/50">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-warning" aria-hidden="true" />
            <div>
              <h2 id="export-seed-title" className="text-base font-semibold text-ink">
                Export Identity
              </h2>
              <p className="text-xs text-ink-3 mt-0.5">
                Back up the signing identity of this agent
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close identity export"
            className="press inline-flex items-center justify-center p-1.5 min-w-11 min-h-11 sm:min-w-0 sm:min-h-0 rounded-md text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content. Scrolls inside the panel so the warning copy plus the actions
            below it stay reachable on a short screen. */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {!confirmed ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-warning-tint border border-warning/30 space-y-2 text-xs leading-relaxed">
                <div className="flex items-center gap-2 font-semibold text-warning text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Read this first</span>
                </div>
                <p className="text-ink-2">
                  This export contains the secret material that controls this agent&apos;s signing
                  identity. Anyone who obtains it can act as this agent.
                </p>
                <p className="text-ink-2">
                  The identity it controls is{' '}
                  <code className="font-mono text-warning break-all">{identity.did}</code>. Keep the
                  backup somewhere private, and never paste it into a site you do not trust.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {/* Both controls get the app's phone tap height. Cancel must never
                    be the smaller target of the two on the dialog that hands over
                    secret material. */}
                <button
                  onClick={handleClose}
                  className="press px-4 py-2.5 min-h-11 sm:min-h-9 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setConfirmed(true)}
                  className="press px-4 py-2.5 min-h-11 sm:min-h-9 rounded-md bg-warning text-on-accent text-xs font-semibold transition-colors hover:bg-warning/85"
                >
                  Export Identity
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Hex secret */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-2">Identity secret (hex)</span>
                  <div className="flex items-center gap-2 -my-1">
                    <button
                      onClick={() => setShowSeed(!showSeed)}
                      aria-pressed={showSeed}
                      className="text-xs text-ink-3 hover:text-ink flex items-center gap-1 py-2 min-h-11 sm:min-h-0 sm:py-1"
                    >
                      {showSeed ? (
                        <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>{showSeed ? 'Hide' : 'Reveal'}</span>
                    </button>
                    <button
                      onClick={() => handleCopy(hexSeed, 'hex', 'Identity secret (hex)')}
                      className="text-xs text-accent hover:text-accent/80 flex items-center gap-1 py-2 min-h-11 sm:min-h-0 sm:py-1"
                    >
                      {copiedKey === 'hex' ? (
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-bg/60 rounded-md border border-line font-mono text-xs text-warning break-all">
                  {showSeed ? hexSeed : '•'.repeat(hexSeed.length)}
                </div>
              </div>

              {/* Base58 secret */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-2">Identity secret (Base58)</span>
                  <button
                    onClick={() => handleCopy(base58Seed, 'b58', 'Identity secret (Base58)')}
                    className="text-xs text-accent hover:text-accent/80 flex items-center gap-1 py-2 min-h-11 sm:min-h-0 sm:py-1 -my-1"
                  >
                    {copiedKey === 'b58' ? (
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>Copy</span>
                  </button>
                </div>
                <div className="p-3 bg-bg/60 rounded-md border border-line font-mono text-xs text-ink-2 break-all">
                  {showSeed ? base58Seed : '•'.repeat(base58Seed.length)}
                </div>
              </div>

              <p className="text-[11px] text-ink-3 leading-relaxed">
                Either form restores the same identity. Import one of them into another browser and
                that browser can sign as <span className="font-mono text-ink-2">{identity.did.slice(0, 16)}…</span>
              </p>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleClose}
                  className="press px-4 py-2 min-h-11 sm:min-h-9 rounded-md bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-2 border border-line transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};