'use client';

import React, { useState } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
} from 'lucide-react';
import { Identicon } from './Identicon';
import { didNotePath } from '@/lib/crypto/fingerprint';
import type { Identity } from '@/lib/identity';

interface IdentityTabProps {
  identity: Identity | null;
  isLoading: boolean;
  onGenerateNew: () => Promise<Identity>;
  onImportIdentity: (seed: string) => Promise<Identity>;
  onOpenExportModal: () => void;
  onCopyText: (text: string, label: string) => void;
  copiedKey: string | null;
}

export const IdentityTab: React.FC<IdentityTabProps> = ({
  identity,
  isLoading,
  onGenerateNew,
  onImportIdentity,
  onOpenExportModal,
  onCopyText,
  copiedKey,
}) => {
  const [importInput, setImportInput] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  // Replacing the keypair throws away the old signing key, so it takes an
  // explicit in-app confirmation rather than a native window.confirm().
  const [confirmRegenerate, setConfirmRegenerate] = useState<boolean>(false);

  const currentDid = identity?.did || '';
  const noteInfo = currentDid ? didNotePath(currentDid) : null;

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importInput.trim()) return;
    try {
      setIsImporting(true);
      setImportError(null);
      await onImportIdentity(importInput);
      setImportInput('');
      setIsImporting(false);
    } catch (err: unknown) {
      setImportError((err as Error)?.message || String(err));
      setIsImporting(false);
    }
  };

  const handleGenerate = async () => {
    setConfirmRegenerate(false);
    try {
      setIsGenerating(true);
      await onGenerateNew();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-line rounded-lg p-4">
        <div className="flex items-center gap-3">
          <KeyRound className="w-5 h-5 text-ink-3" />
          <div>
            <h2 className="text-sm font-semibold text-ink">Identity &amp; Key Management</h2>
            <p className="text-xs text-ink-3">
              Non-custodial Ed25519 keypair handling and Technocore DID specifications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-warning-tint hover:bg-warning/20 text-warning text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Seed</span>
          </button>
          <button
            onClick={() => setConfirmRegenerate(true)}
            disabled={isGenerating || confirmRegenerate}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 text-ink-2 border border-line text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generating…' : 'Generate New'}</span>
          </button>
        </div>
      </div>

      {/* Destructive confirmation — replacing the keypair discards the old key */}
      {confirmRegenerate && (
        <div
          className="bg-danger-tint border border-danger/40 rounded-lg p-4 space-y-3"
          role="alertdialog"
          aria-labelledby="regen-title"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 id="regen-title" className="text-sm font-semibold text-danger">
                Replace this identity with a brand-new keypair?
              </h3>
              <p className="text-xs text-ink-2 leading-relaxed">
                Your current signing key is stored only in this browser. Generating a new one
                overwrites it, and any message already signed under{' '}
                <span className="font-mono text-ink">{currentDid ? currentDid.slice(0, 20) + '…' : 'this DID'}</span>{' '}
                can no longer be re-signed. Export the seed first if you want to keep it.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pl-7">
            <button
              onClick={handleGenerate}
              className="px-3 py-1.5 rounded-md bg-danger text-on-accent text-xs font-bold transition-colors hover:bg-danger/85"
            >
              Yes, replace identity
            </button>
            <button
              onClick={() => {
                setConfirmRegenerate(false);
                onOpenExportModal();
              }}
              className="px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-2 border border-line transition-colors"
            >
              Export seed first
            </button>
            <button
              onClick={() => setConfirmRegenerate(false)}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-ink-3 hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active Identity Details */}
      {identity ? (
        <div className="bg-surface border border-line rounded-lg p-6 space-y-6">
          <div className="flex items-start gap-4">
            <Identicon did={identity.did} size={50} className="border border-line" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                Primary Decentralized Identifier
              </span>
              <div className="flex items-center gap-2">
                <div className="p-3 bg-bg/60 rounded-md border border-line font-mono text-xs text-accent break-all flex-1">
                  {identity.did}
                </div>
                <button
                  onClick={() => onCopyText(identity.did, 'Active DID')}
                  className="p-2 rounded bg-surface-2 hover:bg-surface-3 text-ink-3 hover:text-accent"
                  title="Copy DID"
                >
                  {copiedKey === 'Active DID' ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Technical Protocol Spec Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-bg/40 border border-line rounded-lg space-y-2">
              <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                Raw 32-Byte Public Key (Hex)
              </span>
              <div className="flex items-center justify-between font-mono text-xs text-success break-all">
                <span>{identity.publicKeyHex}</span>
                <button
                  onClick={() => onCopyText(identity.publicKeyHex, 'Public Key Hex')}
                  className="p-1 text-ink-4 hover:text-accent"
                >
                  {copiedKey === 'Public Key Hex' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-4 bg-bg/40 border border-line rounded-lg space-y-2">
              <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                SHA-256 DID Fingerprint
              </span>
              <div className="flex items-center justify-between font-mono text-xs text-accent break-all">
                <span>{identity.fingerprint}</span>
                <button
                  onClick={() => onCopyText(identity.fingerprint, 'Fingerprint')}
                  className="p-1 text-ink-4 hover:text-accent"
                >
                  {copiedKey === 'Fingerprint' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-4 bg-bg/40 border border-line rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                  Suggested Mailbox Room
                </span>
                <span className="text-[10px] text-ink-4 font-mono">App Convention</span>
              </div>
              <div className="flex items-center justify-between font-mono text-xs text-success">
                <span>{identity.mailboxRoom}</span>
                <button
                  onClick={() => onCopyText(identity.mailboxRoom, 'Mailbox Room')}
                  className="p-1 text-ink-4 hover:text-accent"
                >
                  {copiedKey === 'Mailbox Room' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-ink-4 font-mono">
                First-come room name (not cryptographically bound to DID).
              </p>
            </div>

            <div className="p-4 bg-bg/40 border border-line rounded-lg space-y-2">
              <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                Sharded Identity Note Path
              </span>
              <div className="flex items-center justify-between font-mono text-xs text-ink-2">
                <span>{noteInfo?.path || 'N/A'}</span>
                <button
                  onClick={() => onCopyText(noteInfo?.path || '', 'Note Path')}
                  className="p-1 text-ink-4 hover:text-accent"
                >
                  {copiedKey === 'Note Path' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        /* Deriving the keypair is async — show the shape of the card, not a spinner */
        <div className="bg-surface border border-line rounded-lg p-6 space-y-6" aria-busy="true">
          <div className="flex items-start gap-4">
            <div className="skeleton w-[50px] h-[50px] rounded-md shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="skeleton h-3 w-56 rounded" />
              <div className="skeleton h-10 w-full rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-bg/40 border border-line rounded-lg space-y-2">
                <div className="skeleton h-2.5 w-40 rounded" />
                <div className="skeleton h-3.5 w-full rounded" />
              </div>
            ))}
          </div>
          <span className="sr-only">Deriving Ed25519 identity…</span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 p-12 text-center bg-surface border border-dashed border-line rounded-lg">
          <div className="p-3 rounded-full bg-surface-2 border border-line">
            <KeyRound className="w-6 h-6 text-ink-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink-2">No identity loaded</p>
            <p className="text-xs text-ink-3 max-w-sm leading-relaxed">
              This browser has no Ed25519 keypair yet. Generate one to start signing, or import
              an existing seed below.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-accent text-on-accent text-xs font-bold transition-colors hover:bg-accent/85 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generating…' : 'Generate identity'}</span>
          </button>
        </div>
      )}

      {/* Import Identity Form */}
      <div className="bg-surface border border-line rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-ink">Import Existing Compatible Identity</h3>
        </div>
        <p className="text-xs text-ink-3 leading-relaxed">
          Paste an existing 64-character hexadecimal seed, Base58btc private key, or Technocore JSON export to operate that identity in this Console. Importing replaces the current in-browser identity.
        </p>

        <form onSubmit={handleImport} className="space-y-3">
          <input
            type="text"
            value={importInput}
            onChange={(e) => setImportInput(e.target.value)}
            placeholder="Paste 64-character hex seed or base58 string..."
            className="w-full px-3.5 py-2.5 rounded-md bg-bg/60 border border-line text-xs font-mono text-accent placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
          />

          {importError && (
            <div className="text-xs text-danger font-mono" role="alert">{importError}</div>
          )}

          <button
            type="submit"
            disabled={!importInput.trim() || isImporting}
            className="px-4 py-2 rounded-md bg-accent text-on-accent text-xs font-bold transition-colors hover:bg-accent/85 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? 'Importing…' : 'Load & Verify Identity'}
          </button>
        </form>
      </div>
    </div>
  );
};