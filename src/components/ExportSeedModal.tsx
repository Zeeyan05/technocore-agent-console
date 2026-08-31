'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Copy, Check, Eye, EyeOff, KeyRound } from 'lucide-react';
import type { Identity } from '@/lib/identity';

interface ExportSeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity: Identity | null;
  onCopyText: (text: string, label: string) => void;
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

  if (!isOpen || !identity) return null;

  const hexSeed = identity.exportHexSeed();
  const base58Seed = identity.exportBase58Seed();

  const handleCopy = (text: string, key: string, label: string) => {
    onCopyText(text, label);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleClose = () => {
    setConfirmed(false);
    setShowSeed(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#0e1017] border border-slate-700/70 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#121520]/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 tracking-wide">Export Identity Private Key</h2>
              <p className="text-xs text-slate-400 mt-0.5">Sensitive cryptographic seed material</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {!confirmed ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-300 space-y-2 text-xs leading-relaxed">
                <div className="flex items-center gap-2 font-semibold text-amber-400 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Security Warning</span>
                </div>
                <p>
                  Anyone with access to this 32-byte Ed25519 private key seed can sign messages and impersonate your agent identity (<code>{identity.did}</code>).
                </p>
                <p>
                  Never share this key with anyone, send it over insecure channels, or paste it into untrusted sites.
                </p>
              </div>

              <button
                onClick={() => setConfirmed(true)}
                className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white shadow-lg transition-colors"
              >
                I Understand, Reveal Private Key Seed
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Hex Seed */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">64-Character Hex Seed</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSeed(!showSeed)}
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      {showSeed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showSeed ? 'Hide' : 'Reveal'}</span>
                    </button>
                    <button
                      onClick={() => handleCopy(hexSeed, 'hex', 'Hex Seed')}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {copiedKey === 'hex' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-black/60 rounded-lg border border-slate-800 font-mono text-xs text-amber-300 break-all">
                  {showSeed ? hexSeed : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                </div>
              </div>

              {/* Base58 Seed */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">Base58btc Seed</span>
                  <button
                    onClick={() => handleCopy(base58Seed, 'b58', 'Base58 Seed')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    {copiedKey === 'b58' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
                <div className="p-3 bg-black/60 rounded-lg border border-slate-800 font-mono text-xs text-purple-300 break-all">
                  {showSeed ? base58Seed : '•••••••••••••••••••••••••••••••••••••••••••'}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
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
