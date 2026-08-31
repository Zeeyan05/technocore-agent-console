'use client';

import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  KeyRound,
  FileCode2,
  Cpu,
  Layers,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { Identicon } from './Identicon';
import { formatDidAbbreviated, publicKeyFromDid, isValidDid } from '@/lib/crypto/did';
import { bytesToHex } from '@/lib/crypto/encode';
import { didFingerprint, didNotePath } from '@/lib/crypto/fingerprint';
import { sweep } from '@/lib/crypto/sweep';
import { canonicalMessageString, canonicalMessagePayload } from '@/lib/crypto/canonicalize';
import type { VerifiedMessage } from '@/hooks/useMailbox';

interface ProtocolInspectorModalProps {
  message: VerifiedMessage | null;
  room: string;
  isOpen: boolean;
  onClose: () => void;
  onCopyText: (text: string, label: string) => void;
}

export const ProtocolInspectorModal: React.FC<ProtocolInspectorModalProps> = ({
  message,
  room,
  isOpen,
  onClose,
  onCopyText,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'crypto' | 'identity' | 'raw'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !message) return null;

  const did = message.from;
  const isDidSender = isValidDid(did);
  const sweptText = sweep(message.text);
  const nonceStr = message.nonce ? String(message.nonce) : 'N/A';
  const canonicalString = isDidSender && message.nonce ? canonicalMessageString(room, nonceStr, sweptText) : '';
  const canonicalPayloadBytes = canonicalString ? canonicalMessagePayload(room, nonceStr, sweptText) : null;
  const canonicalPayloadHex = canonicalPayloadBytes ? bytesToHex(canonicalPayloadBytes) : '';

  let pubKeyHex = 'N/A';
  let fingerprint = 'N/A';
  let notePath = { namespace: 'N/A', key: 'N/A', path: 'N/A' };

  if (isDidSender) {
    try {
      const pk = publicKeyFromDid(did);
      pubKeyHex = bytesToHex(pk);
      fingerprint = didFingerprint(did);
      notePath = didNotePath(did);
    } catch {
      // ignore
    }
  }

  const handleCopy = (text: string, key: string, label: string) => {
    onCopyText(text, label);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const rawJson = JSON.stringify(
    {
      seq: message.seq,
      ts: message.ts,
      from: message.from,
      text: message.text,
      nonce: message.nonce,
      sig: message.sig,
    },
    null,
    2
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-[#0e1017] border border-slate-700/70 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#121520]/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-100 tracking-wide">Protocol Inspector</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Seq #{String(message.seq).padStart(5, '0')}
                </span>
                <span className="text-xs text-slate-400 font-mono">[{room}]</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cryptographic breakdown & forensic verification for Technocore message
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-[#0b0d13]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Overview & Status</span>
          </button>
          <button
            onClick={() => setActiveTab('crypto')}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'crypto'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Cryptography & Canonical Payload</span>
          </button>
          <button
            onClick={() => setActiveTab('identity')}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'identity'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Identity & Public Key</span>
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'raw'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Raw Structured JSON</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Verification Status Card */}
              <div
                className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                  message.verification?.valid
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : isDidSender && message.verification?.signatureFormatValid && !message.verification?.signatureValid
                    ? 'bg-rose-950/30 border-rose-500/50 text-rose-300'
                    : 'bg-slate-900/60 border-slate-700/60 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-lg bg-black/40 border border-current shrink-0 mt-0.5">
                    {message.verification?.valid ? (
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    ) : isDidSender && message.verification?.signatureFormatValid && !message.verification?.signatureValid ? (
                      <ShieldX className="w-6 h-6 text-rose-400" />
                    ) : (
                      <ShieldAlert className="w-6 h-6 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {message.verification?.valid
                        ? 'Cryptographically Verified (Valid Ed25519 ✓)'
                        : isDidSender && message.verification?.signatureFormatValid && !message.verification?.signatureValid
                        ? 'Verification Failed (Cryptographic Mismatch ✗)'
                        : 'Unverified / Nick Lane'}
                    </h3>
                    <p className="text-xs mt-1 text-slate-300 leading-relaxed">
                      {message.verification?.valid
                        ? 'This message was signed by the sender DID using Ed25519 and verified offline against the canonical UTF-8 payload.'
                        : message.verification?.error ||
                          'This message is self-asserted or does not carry an attributable Ed25519 signature.'}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3 text-[11px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-black/40 border border-slate-700">
                        DID Format: {message.verification?.didFormatValid ? 'VALID ✓' : 'INVALID ✗'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-black/40 border border-slate-700">
                        Sig Format: {message.verification?.signatureFormatValid ? 'VALID 86-CHAR ✓' : 'ABSENT / INVALID'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-black/40 border border-slate-700">
                        Noble Crypto Math: {message.verification?.signatureValid ? 'PASSED ✓' : 'FAILED / UNCHECKED'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="bg-[#12141e] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Stored Message Body
                </div>
                <div className="p-3 bg-black/40 rounded-lg border border-slate-800 text-sm font-mono text-slate-200 break-words whitespace-pre-wrap">
                  {message.text}
                </div>
                {message.text !== sweptText && (
                  <div className="text-xs text-amber-400/90 font-mono">
                    ⚠️ Single-line sweep cleaned whitespace/control chars: &quot;{sweptText}&quot;
                  </div>
                )}
              </div>

              {/* Core Field Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#12141e] border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-xs text-slate-400 font-medium">Sender Identity</span>
                  <div className="flex items-center gap-2">
                    <Identicon did={did} size={24} />
                    <span className="font-mono text-xs text-cyan-300 break-all">{did}</span>
                  </div>
                </div>
                <div className="bg-[#12141e] border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-xs text-slate-400 font-medium">Room & Sequence</span>
                  <div className="font-mono text-xs text-slate-200">
                    Room: <span className="text-cyan-400 font-semibold">{room}</span> | Seq: #{message.seq}
                  </div>
                </div>
                <div className="bg-[#12141e] border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-xs text-slate-400 font-medium">Monotonic Nonce</span>
                  <div className="font-mono text-xs text-emerald-400 break-all">{nonceStr}</div>
                </div>
                <div className="bg-[#12141e] border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-xs text-slate-400 font-medium">UTC Protocol Timestamp</span>
                  <div className="font-mono text-xs text-slate-300">{message.ts || 'N/A'}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CRYPTOGRAPHY */}
          {activeTab === 'crypto' && (
            <div className="space-y-5">
              {/* Algorithm & Signature */}
              <div className="bg-[#12141e] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Ed25519 Signature (86 Base64URL Chars)
                  </span>
                  {message.sig && (
                    <button
                      onClick={() => handleCopy(message.sig || '', 'sig', 'Signature')}
                      className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      {copiedKey === 'sig' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Sig</span>
                    </button>
                  )}
                </div>
                <div className="p-3 bg-black/50 rounded-lg border border-slate-800 font-mono text-xs text-amber-300/90 break-all leading-relaxed">
                  {message.sig || 'No signature field present in this record.'}
                </div>
                {message.sig && (
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span>Length: {message.sig.length} chars</span>
                    <span>Terminal Char: &apos;{message.sig.slice(-1)}&apos; ({['A','Q','g','w'].includes(message.sig.slice(-1)) ? 'Canonical ✓' : 'Non-canonical ✗'})</span>
                  </div>
                )}
              </div>

              {/* Canonical Payload */}
              <div className="bg-[#12141e] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Canonical Signing Payload UTF-8 String
                    </span>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">Format: &lt;room&gt;|&lt;nonce&gt;|&lt;sweptText&gt;</p>
                  </div>
                  {canonicalString && (
                    <button
                      onClick={() => handleCopy(canonicalString, 'canon', 'Canonical Payload')}
                      className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      {copiedKey === 'canon' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Payload</span>
                    </button>
                  )}
                </div>
                <div className="p-3 bg-black/50 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300 break-all leading-relaxed">
                  {canonicalString || 'Cannot construct canonical payload (missing DID or nonce).'}
                </div>
              </div>

              {/* Hex Dump */}
              {canonicalPayloadHex && (
                <div className="bg-[#12141e] border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Canonical Payload Byte Stream (Hex Dump)
                    </span>
                    <button
                      onClick={() => handleCopy(canonicalPayloadHex, 'hex', 'Hex Dump')}
                      className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      {copiedKey === 'hex' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Hex</span>
                    </button>
                  </div>
                  <div className="p-3 bg-black/50 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-400 break-all leading-relaxed">
                    {canonicalPayloadHex}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: IDENTITY */}
          {activeTab === 'identity' && (
            <div className="space-y-5">
              {/* DID Card */}
              <div className="bg-[#12141e] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Full Decentralized Identifier (DID)
                  </span>
                  <button
                    onClick={() => handleCopy(did, 'did', 'DID')}
                    className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    {copiedKey === 'did' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy DID</span>
                  </button>
                </div>
                <div className="flex items-center gap-3 p-3 bg-black/50 rounded-lg border border-slate-800">
                  <Identicon did={did} size={36} />
                  <div className="font-mono text-xs text-slate-200 break-all">{did}</div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-400 font-mono pt-1">
                  <span>Method: did:key</span>
                  <span>Multicodec: 0xed01 (ed25519-pub)</span>
                  <span>Length: {did.length} chars</span>
                </div>
              </div>

              {/* Public Key (32-byte) */}
              <div className="bg-[#12141e] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Raw 32-Byte Ed25519 Public Key (Hex)
                  </span>
                  {pubKeyHex !== 'N/A' && (
                    <button
                      onClick={() => handleCopy(pubKeyHex, 'pubkey', 'Public Key Hex')}
                      className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      {copiedKey === 'pubkey' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Hex</span>
                    </button>
                  )}
                </div>
                <div className="p-3 bg-black/50 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 break-all">
                  {pubKeyHex}
                </div>
              </div>

              {/* Fingerprint & Note Paths */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#12141e] border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    SHA-256 Fingerprint
                  </span>
                  <div className="p-2.5 bg-black/50 rounded-lg border border-slate-800 font-mono text-xs text-purple-300 break-all">
                    {fingerprint}
                  </div>
                </div>
                <div className="bg-[#12141e] border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Sharded Note Path
                  </span>
                  <div className="p-2.5 bg-black/50 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 break-all">
                    {notePath.path}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RAW JSON */}
          {activeTab === 'raw' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Raw Protocol JSON Representation
                </span>
                <button
                  onClick={() => handleCopy(rawJson, 'rawjson', 'Raw JSON')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                >
                  {copiedKey === 'rawjson' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Full JSON</span>
                </button>
              </div>
              <pre className="p-4 bg-black/70 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400/90 overflow-x-auto leading-relaxed">
                {rawJson}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-[#121520]/80">
          <span className="text-xs text-slate-500 font-mono">Technocore Protocol v0.11.1</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
