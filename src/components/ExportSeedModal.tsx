'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Copy, Check, Eye, EyeOff, KeyRound } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-in fade-in duration-150">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-seed-title"
        className="relative w-full max-w-lg bg-surface border border-line-2 rounded-lg overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface-2/50">
          <div className="flex items-center gap-3">
            <KeyRound className="w-5 h-5 text-warning" />
            <div>
              <h2 id="export-seed-title" className="text-base font-semibold text-ink">
                Export Identity Private Key
              </h2>
              <p className="text-xs text-ink-3 mt-0.5">Sensitive cryptographic seed material</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close private key export"
            className="p-1.5 rounded-md text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {!confirmed ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-warning-tint border border-warning/30 text-warning space-y-2 text-xs leading-relaxed">
                <div className="flex items-center gap-2 font-semibold text-warning text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Security Warning</span>
                </div>
                <p className="text-ink-2">
                  Anyone with access to this 32-byte Ed25519 private key seed can sign messages and impersonate your agent identity (<code className="font-mono text-warning break-all">{identity.did}</code>).
                </p>
                <p className="text-ink-2">
                  Never share this key with anyone, send it over insecure channels, or paste it into untrusted sites.
                </p>
              </div>

              <button
                onClick={() => setConfirmed(true)}
                className="w-full py-2.5 rounded-md bg-warning text-on-accent text-xs font-bold transition-colors hover:bg-warning/85"
              >
                I Understand, Reveal Private Key Seed
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Hex Seed */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-2">64-Character Hex Seed</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSeed(!showSeed)}
                      className="text-xs text-ink-3 hover:text-ink flex items-center gap-1"
                    >
                      {showSeed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showSeed ? 'Hide' : 'Reveal'}</span>
                    </button>
                    <button
                      onClick={() => handleCopy(hexSeed, 'hex', 'Hex Seed')}
                      className="text-xs text-accent hover:text-accent/80 flex items-center gap-1"
                    >
                      {copiedKey === 'hex' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-bg/60 rounded-md border border-line font-mono text-xs text-warning break-all">
                  {showSeed ? hexSeed : '•'.repeat(hexSeed.length)}
                </div>
              </div>

              {/* Base58 Seed */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-2">Base58btc Seed</span>
                  <button
                    onClick={() => handleCopy(base58Seed, 'b58', 'Base58 Seed')}
                    className="text-xs text-accent hover:text-accent/80 flex items-center gap-1"
                  >
                    {copiedKey === 'b58' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
                <div className="p-3 bg-bg/60 rounded-md border border-line font-mono text-xs text-ink-2 break-all">
                  {showSeed ? base58Seed : '•'.repeat(base58Seed.length)}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-md bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-2 border border-line transition-colors"
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