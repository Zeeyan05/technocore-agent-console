'use client';

import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { Identicon } from './Identicon';
import { didNotePath } from '@/lib/crypto/fingerprint';
import type { Identity } from '@/lib/identity';

interface IdentityTabProps {
  identity: Identity | null;
  onGenerateNew: () => Promise<Identity>;
  onImportIdentity: (seed: string) => Promise<Identity>;
  onOpenExportModal: () => void;
  onCopyText: (text: string, label: string) => void;
  copiedKey: string | null;
}

export const IdentityTab: React.FC<IdentityTabProps> = ({
  identity,
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
    if (!window.confirm('Generate a new random identity? Make sure to export your current seed if you wish to keep it.')) {
      return;
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#11131b] border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Identity & Key Management</h2>
            <p className="text-xs text-slate-400">
              Non-custodial Ed25519 keypair handling and Technocore DID specifications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Seed</span>
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>Generate New</span>
          </button>
        </div>
      </div>

      {/* Active Identity Details */}
      {identity ? (
        <div className="bg-[#11131b] border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-start gap-4">
            <Identicon did={identity.did} size={50} className="border border-cyan-500/40 glow-cyan" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Primary Decentralized Identifier
              </span>
              <div className="flex items-center gap-2">
                <div className="p-3 bg-black/60 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300 break-all flex-1">
                  {identity.did}
                </div>
                <button
                  onClick={() => onCopyText(identity.did, 'Active DID')}
                  className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300"
                  title="Copy DID"
                >
                  {copiedKey === 'Active DID' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Technical Protocol Spec Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-black/40 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Raw 32-Byte Public Key (Hex)
              </span>
              <div className="flex items-center justify-between font-mono text-xs text-emerald-400 break-all">
                <span>{identity.publicKeyHex}</span>
                <button
                  onClick={() => onCopyText(identity.publicKeyHex, 'Public Key Hex')}
                  className="p-1 text-slate-500 hover:text-cyan-300"
                >
                  {copiedKey === 'Public Key Hex' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-4 bg-black/40 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                SHA-256 DID Fingerprint
              </span>
              <div className="flex items-center justify-between font-mono text-xs text-purple-300 break-all">
                <span>{identity.fingerprint}</span>
                <button
                  onClick={() => onCopyText(identity.fingerprint, 'Fingerprint')}
                  className="p-1 text-slate-500 hover:text-cyan-300"
                >
                  {copiedKey === 'Fingerprint' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-4 bg-black/40 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Default Mailbox Channel
              </span>
              <div className="flex items-center justify-between font-mono text-xs text-cyan-300">
                <span>{identity.mailboxRoom}</span>
                <button
                  onClick={() => onCopyText(identity.mailboxRoom, 'Mailbox Room')}
                  className="p-1 text-slate-500 hover:text-cyan-300"
                >
                  {copiedKey === 'Mailbox Room' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-4 bg-black/40 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Sharded Identity Note Path
              </span>
              <div className="flex items-center justify-between font-mono text-xs text-slate-300">
                <span>{noteInfo?.path || 'N/A'}</span>
                <button
                  onClick={() => onCopyText(noteInfo?.path || '', 'Note Path')}
                  className="p-1 text-slate-500 hover:text-cyan-300"
                >
                  {copiedKey === 'Note Path' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 bg-[#11131b] border border-slate-800 rounded-xl text-center text-slate-500 text-xs font-mono">
          No identity loaded.
        </div>
      )}

      {/* Import Identity Form */}
      <div className="bg-[#11131b] border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Import Existing Compatible Identity</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Paste an existing 64-character hexadecimal seed, Base58btc private key, or Technocore JSON export to operate that identity in this Console.
        </p>

        <form onSubmit={handleImport} className="space-y-3">
          <input
            type="text"
            value={importInput}
            onChange={(e) => setImportInput(e.target.value)}
            placeholder="Paste 64-character hex seed or base58 string..."
            className="w-full px-3.5 py-2.5 rounded-lg bg-black/50 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-purple-500"
          />

          {importError && (
            <div className="text-xs text-rose-400 font-mono">{importError}</div>
          )}

          <button
            type="submit"
            disabled={!importInput.trim() || isImporting}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-md disabled:opacity-50"
          >
            {isImporting ? 'Importing...' : 'Load & Verify Identity'}
          </button>
        </form>
      </div>
    </div>
  );
};
