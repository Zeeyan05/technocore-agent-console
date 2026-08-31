'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, ShieldAlert, ShieldX, Play, RotateCcw } from 'lucide-react';
import { verifyRawComponents } from '@/lib/crypto/verify';
import type { VerificationBreakdown } from '@/types/technocore';

interface StandaloneVerifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaySuccessAudio?: () => void;
  onPlayFailAudio?: () => void;
}

export const StandaloneVerifierModal: React.FC<StandaloneVerifierModalProps> = ({
  isOpen,
  onClose,
  onPlaySuccessAudio,
  onPlayFailAudio,
}) => {
  const [did, setDid] = useState<string>('');
  const [room, setRoom] = useState<string>('lobby');
  const [nonce, setNonce] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [sig, setSig] = useState<string>('');
  const [result, setResult] = useState<VerificationBreakdown | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

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
      if (breakdown.valid) {
        if (onPlaySuccessAudio) onPlaySuccessAudio();
      } else {
        if (onPlayFailAudio) onPlayFailAudio();
      }
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
      <div className="relative w-full max-w-2xl bg-[#0e1017] border border-slate-700/70 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#121520]/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 tracking-wide">
                Standalone Protocol Verifier
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Test and verify any Technocore message offline without network access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form & Diagnostics */}
        <form onSubmit={handleVerify} className="p-6 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Signer DID (did:key:z6Mk...)</label>
            <input
              type="text"
              value={did}
              onChange={(e) => setDid(e.target.value)}
              placeholder="did:key:z6Mk..."
              required
              className="w-full px-3.5 py-2 rounded-lg bg-black/50 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Room Name</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="lobby or mb-..."
                required
                className="w-full px-3.5 py-2 rounded-lg bg-black/50 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Nonce (1-19 digits)</label>
              <input
                type="text"
                value={nonce}
                onChange={(e) => setNonce(e.target.value)}
                placeholder="e.g. 1788172579911"
                required
                className="w-full px-3.5 py-2 rounded-lg bg-black/50 border border-slate-700 text-xs font-mono text-emerald-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Message Text (Swept)</label>
            <textarea
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Exact stored text..."
              required
              className="w-full px-3.5 py-2 rounded-lg bg-black/50 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Signature (86 Base64URL chars ending in AQgw)</label>
            <input
              type="text"
              value={sig}
              onChange={(e) => setSig(e.target.value)}
              placeholder="86-character base64url signature..."
              required
              className="w-full px-3.5 py-2 rounded-lg bg-black/50 border border-slate-700 text-xs font-mono text-amber-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Results Box */}
          {result && (
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                result.valid
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {result.valid ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ShieldX className="w-5 h-5 text-rose-400" />
                )}
                <span className="font-semibold text-sm">
                  {result.valid ? 'Signature Valid & Verified ✓' : 'Verification Failed ✗'}
                </span>
              </div>
              <p className="text-xs text-slate-200">
                {result.valid
                  ? 'Ed25519 cryptographic check passed. The signature matches the public key and canonical UTF-8 payload.'
                  : result.error || 'Cryptographic mismatch.'}
              </p>
              {result.canonicalPayloadText && (
                <div className="p-2 bg-black/60 rounded font-mono text-xs text-cyan-300 break-all">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-lg shadow-purple-600/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Verification</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
