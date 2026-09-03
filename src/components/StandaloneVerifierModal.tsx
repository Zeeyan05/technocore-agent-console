'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, ShieldAlert, ShieldX, Play, RotateCcw } from 'lucide-react';
import { verifyRawComponents } from '@/lib/crypto/verify';
import { useModalA11y } from '@/hooks/useModalA11y';
import type { VerificationBreakdown } from '@/types/technocore';

interface StandaloneVerifierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StandaloneVerifierModal: React.FC<StandaloneVerifierModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [did, setDid] = useState<string>('');
  const [room, setRoom] = useState<string>('lobby');
  const [nonce, setNonce] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [sig, setSig] = useState<string>('');
  const [result, setResult] = useState<VerificationBreakdown | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const panelRef = useModalA11y(isOpen, onClose, { lockClose: isVerifying });

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const breakdown = await verifyRawComponents(
        room.trim(),
        did.trim(),
        nonce.trim(),
        text,
        sig.trim()
      );
      setResult(breakdown);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    setDid('');
    setRoom('lobby');
    setNonce('');
    setText('');
    setSig('');
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-in fade-in duration-150">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="verifier-title"
        className="relative w-full max-w-2xl bg-surface border border-line-2 rounded-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface-2/50">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <div>
              <h2 id="verifier-title" className="text-base font-semibold text-ink">
                Standalone Protocol Verifier
              </h2>
              <p className="text-xs text-ink-3 mt-0.5">
                Test and verify any Technocore message offline without network access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close standalone verifier"
            className="p-1.5 rounded-md text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form & Diagnostics */}
        <form onSubmit={handleVerify} className="p-6 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-2">Signer DID (did:key:z6Mk...)</label>
            <input
              type="text"
              value={did}
              onChange={(e) => setDid(e.target.value)}
              placeholder="did:key:z6Mk..."
              required
              className="w-full px-3.5 py-2.5 rounded-md bg-bg/60 border border-line text-xs font-mono text-accent placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-2">Room Name</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="lobby or mb-..."
                required
                className="w-full px-3.5 py-2.5 rounded-md bg-bg/60 border border-line text-xs font-mono text-ink placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-2">Nonce (1-19 digits)</label>
              <input
                type="text"
                value={nonce}
                onChange={(e) => setNonce(e.target.value)}
                placeholder="e.g. 1788172579911"
                required
                className="w-full px-3.5 py-2.5 rounded-md bg-bg/60 border border-line text-xs font-mono text-success placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-2">Message Text (Swept)</label>
            <textarea
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Exact stored text..."
              required
              className="w-full px-3.5 py-2.5 rounded-md bg-bg/60 border border-line text-xs font-mono text-ink placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-2">Signature (86 Base64URL chars ending in AQgw)</label>
            <input
              type="text"
              value={sig}
              onChange={(e) => setSig(e.target.value)}
              placeholder="86-character base64url signature..."
              required
              className="w-full px-3.5 py-2.5 rounded-md bg-bg/60 border border-line text-xs font-mono text-warning placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
            />
          </div>

          {/* Results Box */}
          {result && (
            <div
              className={`p-4 rounded-md border space-y-3 ${
                result.valid
                  ? 'bg-success-tint border-success/40 text-success'
                  : 'bg-danger-tint border-danger/40 text-danger'
              }`}
            >
              <div className="flex items-center gap-2">
                {result.valid ? (
                  <ShieldCheck className="w-5 h-5 text-success" />
                ) : (
                  <ShieldX className="w-5 h-5 text-danger" />
                )}
                <span className="font-semibold text-sm">
                  {result.valid ? 'Signature Valid & Verified' : 'Verification Failed'}
                </span>
              </div>
              <p className="text-xs text-ink-2">
                {result.valid
                  ? 'Ed25519 cryptographic check passed. The signature matches the public key and canonical UTF-8 payload.'
                  : result.error || 'Cryptographic mismatch.'}
              </p>
              {result.canonicalPayloadText && (
                <div className="p-2 bg-bg/50 rounded font-mono text-xs text-accent break-all">
                  Canonical: {result.canonicalPayloadText}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 text-xs text-ink-3 font-medium border border-line transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-accent text-on-accent text-xs font-bold transition-colors hover:bg-accent/85 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run Verification</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
