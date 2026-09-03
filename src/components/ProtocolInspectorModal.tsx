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
} from 'lucide-react';
import { Identicon } from './Identicon';
import { formatDidAbbreviated, publicKeyFromDid, isValidDid } from '@/lib/crypto/did';
import { bytesToHex } from '@/lib/crypto/encode';
import { didFingerprint, didNotePath } from '@/lib/crypto/fingerprint';
import { sweep } from '@/lib/crypto/sweep';
import { canonicalMessageString, canonicalMessagePayload } from '@/lib/crypto/canonicalize';
import { useModalA11y } from '@/hooks/useModalA11y';
import type { VerifiedMessage } from '@/hooks/useMailbox';

interface ProtocolInspectorModalProps {
  message: VerifiedMessage | null;
  room: string;
  isOpen: boolean;
  onClose: () => void;
  onCopyText: (text: string, label: string) => Promise<boolean>;
  serverVersion: string | null;
}

export const ProtocolInspectorModal: React.FC<ProtocolInspectorModalProps> = ({
  message,
  room,
  isOpen,
  onClose,
  onCopyText,
  serverVersion,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'crypto' | 'identity' | 'raw'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const panelRef = useModalA11y(isOpen, onClose);

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

  const handleCopy = async (text: string, key: string, label: string) => {
    // Only flash the check-mark if the clipboard write actually succeeded.
    const ok = await onCopyText(text, label);
    if (!ok) return;
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

  const verdictBad = isDidSender && message.verification?.signatureFormatValid && !message.verification?.signatureValid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-in fade-in duration-150">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspector-title"
        className="relative w-full max-w-3xl bg-surface border border-line-2 rounded-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface-2/50">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-accent" />
            <div>
              <div className="flex items-center gap-2">
                <h2 id="inspector-title" className="text-base font-semibold text-ink">
                  Protocol Inspector
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-2 text-ink-3 border border-line">
                  Seq #{String(message.seq).padStart(5, '0')}
                </span>
                <span className="text-xs text-ink-4 font-mono">[{room}]</span>
              </div>
              <p className="text-xs text-ink-3 mt-0.5">
                Cryptographic breakdown &amp; forensic verification for Technocore message
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close protocol inspector"
            className="p-1.5 rounded-md text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-line bg-bg/40 overflow-x-auto">
          {([
            { key: 'overview', label: 'Overview & Status', icon: Layers },
            { key: 'crypto', label: 'Cryptography & Canonical Payload', icon: Cpu },
            { key: 'identity', label: 'Identity & Public Key', icon: KeyRound },
            { key: 'raw', label: 'Raw Structured JSON', icon: FileCode2 },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-ink-3 hover:text-ink'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Verification Status Card */}
              <div
                className={`p-4 rounded-lg border flex items-start justify-between gap-4 ${
                  message.verification?.valid
                    ? 'bg-success-tint border-success/30 text-success'
                    : verdictBad
                    ? 'bg-danger-tint border-danger/30 text-danger'
                    : 'bg-surface-2/60 border-line text-ink-2'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-md bg-bg/50 border border-current shrink-0 mt-0.5">
                    {message.verification?.valid ? (
                      <ShieldCheck className="w-6 h-6 text-success" />
                    ) : verdictBad ? (
                      <ShieldX className="w-6 h-6 text-danger" />
                    ) : (
                      <ShieldAlert className="w-6 h-6 text-warning" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">
                      {message.verification?.valid
                        ? 'Cryptographically Verified (Valid Ed25519)'
                        : verdictBad
                        ? 'Verification Failed (Cryptographic Mismatch)'
                        : 'Unverified / Nickname'}
                    </h3>
                    <p className="text-xs mt-1 text-ink-2 leading-relaxed">
                      {message.verification?.valid
                        ? 'This message was signed by the sender DID using Ed25519 and verified offline against the canonical UTF-8 payload.'
                        : message.verification?.error ||
                          'This message is self-asserted or does not carry an attributable Ed25519 signature.'}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3 text-[11px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-bg/50 border border-line">
                        DID Format: {message.verification?.didFormatValid ? 'VALID' : 'INVALID'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-bg/50 border border-line">
                        Sig Format: {message.verification?.signatureFormatValid ? 'VALID 86-CHAR' : 'ABSENT / INVALID'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-bg/50 border border-line">
                        Noble Crypto Math: {message.verification?.signatureValid ? 'PASSED' : 'FAILED / UNCHECKED'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="bg-surface-2/50 border border-line rounded-lg p-4 space-y-3">
                <div className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                  Stored Message Body
                </div>
                <div className="p-3 bg-bg/50 rounded-md border border-line text-sm font-mono text-ink break-words whitespace-pre-wrap">
                  {message.text}
                </div>
                {message.text !== sweptText && (
                  <div className="text-xs text-warning font-mono">
                    Single-line sweep cleaned whitespace/control chars: &quot;{sweptText}&quot;
                  </div>
                )}
              </div>

              {/* Core Field Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-2/50 border border-line rounded-lg p-4 space-y-2">
                  <span className="text-xs text-ink-3 font-medium">Sender Identity</span>
                  <div className="flex items-center gap-2">
                    <Identicon did={did} size={24} />
                    <span className="font-mono text-xs text-accent break-all">{did}</span>
                  </div>
                </div>
                <div className="bg-surface-2/50 border border-line rounded-lg p-4 space-y-2">
                  <span className="text-xs text-ink-3 font-medium">Room &amp; Sequence</span>
                  <div className="font-mono text-xs text-ink-2">
                    Room: <span className="text-accent font-semibold">{room}</span> | Seq: #{message.seq}
                  </div>
                </div>
                <div className="bg-surface-2/50 border border-line rounded-lg p-4 space-y-2">
                  <span className="text-xs text-ink-3 font-medium">Monotonic Nonce</span>
                  <div className="font-mono text-xs text-success break-all">{nonceStr}</div>
                </div>
                <div className="bg-surface-2/50 border border-line rounded-lg p-4 space-y-2">
                  <span className="text-xs text-ink-3 font-medium">UTC Protocol Timestamp</span>
                  <div className="font-mono text-xs text-ink-2">{message.ts || 'N/A'}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CRYPTOGRAPHY */}
          {activeTab === 'crypto' && (
            <div className="space-y-5">
              {/* Algorithm & Signature */}
              <div className="bg-surface-2/50 border border-line rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                    Ed25519 Signature (86 Base64URL Chars)
                  </span>
                  {message.sig && (
                    <button
                      onClick={() => handleCopy(message.sig || '', 'sig', 'Signature')}
                      className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80"
                    >
                      {copiedKey === 'sig' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Sig</span>
                    </button>
                  )}
                </div>
                <div className="p-3 bg-bg/50 rounded-md border border-line font-mono text-xs text-warning break-all leading-relaxed">
                  {message.sig || 'No signature field present in this record.'}
                </div>
                {message.sig && (
                  <div className="flex items-center gap-3 text-xs text-ink-3 font-mono">
                    <span>Length: {message.sig.length} chars</span>
                    <span>Terminal Char: &apos;{message.sig.slice(-1)}&apos; ({['A','Q','g','w'].includes(message.sig.slice(-1)) ? 'Canonical' : 'Non-canonical'})</span>
                  </div>
                )}
              </div>

              {/* Canonical Payload */}
              <div className="bg-surface-2/50 border border-line rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                      Canonical Signing Payload UTF-8 String
                    </span>
                    <p className="text-[11px] text-ink-4 font-mono mt-0.5">Format: &lt;room&gt;|&lt;nonce&gt;|&lt;sweptText&gt;</p>
                  </div>
                  {canonicalString && (
                    <button
                      onClick={() => handleCopy(canonicalString, 'canon', 'Canonical Payload')}
                      className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80"
                    >
                      {copiedKey === 'canon' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Payload</span>
                    </button>
                  )}
                </div>
                <div className="p-3 bg-bg/50 rounded-md border border-line font-mono text-xs text-accent break-all leading-relaxed">
                  {canonicalString || 'Cannot construct canonical payload (missing DID or nonce).'}
                </div>
              </div>

              {/* Hex Dump */}
              {canonicalPayloadHex && (
                <div className="bg-surface-2/50 border border-line rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                      Canonical Payload Byte Stream (Hex Dump)
                    </span>
                    <button
                      onClick={() => handleCopy(canonicalPayloadHex, 'hex', 'Hex Dump')}
                      className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80"
                    >
                      {copiedKey === 'hex' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Hex</span>
                    </button>
                  </div>
                  <div className="p-3 bg-bg/50 rounded-md border border-line font-mono text-[11px] text-ink-3 break-all leading-relaxed">
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
              <div className="bg-surface-2/50 border border-line rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                    Full Decentralized Identifier (DID)
                  </span>
                  <button
                    onClick={() => handleCopy(did, 'did', 'DID')}
                    className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80"
                  >
                    {copiedKey === 'did' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy DID</span>
                  </button>
                </div>
                <div className="flex items-center gap-3 p-3 bg-bg/50 rounded-md border border-line">
                  <Identicon did={did} size={36} />
                  <div className="font-mono text-xs text-ink-2 break-all">{did}</div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-ink-3 font-mono pt-1">
                  <span>Method: did:key</span>
                  <span>Multicodec: 0xed01 (ed25519-pub)</span>
                  <span>Length: {did.length} chars</span>
                </div>
              </div>

              {/* Public Key (32-byte) */}
              <div className="bg-surface-2/50 border border-line rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                    Raw 32-Byte Ed25519 Public Key (Hex)
                  </span>
                  {pubKeyHex !== 'N/A' && (
                    <button
                      onClick={() => handleCopy(pubKeyHex, 'pubkey', 'Public Key Hex')}
                      className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80"
                    >
                      {copiedKey === 'pubkey' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Hex</span>
                    </button>
                  )}
                </div>
                <div className="p-3 bg-bg/50 rounded-md border border-line font-mono text-xs text-success break-all">
                  {pubKeyHex}
                </div>
              </div>

              {/* Fingerprint & Note Paths */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-2/50 border border-line rounded-lg p-4 space-y-2">
                  <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                    SHA-256 Fingerprint
                  </span>
                  <div className="p-2.5 bg-bg/50 rounded-md border border-line font-mono text-xs text-accent break-all">
                    {fingerprint}
                  </div>
                </div>
                <div className="bg-surface-2/50 border border-line rounded-lg p-4 space-y-2">
                  <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                    Sharded Note Path
                  </span>
                  <div className="p-2.5 bg-bg/50 rounded-md border border-line font-mono text-xs text-ink-2 break-all">
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
                <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                  Raw Protocol JSON Representation
                </span>
                <button
                  onClick={() => handleCopy(rawJson, 'rawjson', 'Raw JSON')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-2 border border-line transition-colors"
                >
                  {copiedKey === 'rawjson' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Full JSON</span>
                </button>
              </div>
              <pre className="p-4 bg-bg/70 rounded-lg border border-line font-mono text-xs text-success/90 overflow-x-auto leading-relaxed">
                {rawJson}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-line bg-surface-2/50">
          <span className="text-xs text-ink-4 font-mono">
            {serverVersion
              ? `Technocore Protocol v${serverVersion} (live)`
              : 'Technocore Protocol version unavailable'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-2 border border-line transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};