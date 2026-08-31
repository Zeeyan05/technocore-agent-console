'use client';

import React, { useState, useMemo } from 'react';
import { X, Send, ShieldCheck, AlertCircle, CheckCircle2, Users, Loader2 } from 'lucide-react';
import { sweep } from '@/lib/crypto/sweep';
import { isValidDid } from '@/lib/crypto/did';
import { agentMailboxRoom } from '@/lib/crypto/fingerprint';
import { MAX_MESSAGE_CHARS } from '@/types/technocore';
import type { Identity } from '@/lib/identity';
import type { TechnocoreClient } from '@/lib/client';
import type { AgentContact } from '@/types/technocore';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity: Identity | null;
  client: TechnocoreClient;
  contacts: AgentContact[];
  defaultRecipient?: string;
  defaultRoom?: string;
  onSuccess: (room: string) => void;
  onPlaySendAudio?: () => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  identity,
  client,
  contacts,
  defaultRecipient = '',
  defaultRoom = '',
  onSuccess,
  onPlaySendAudio,
}) => {
  const [recipient, setRecipient] = useState<string>(defaultRecipient);
  const [roomOverride, setRoomOverride] = useState<string>(defaultRoom);
  const [text, setText] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'signing' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sweptText = useMemo(() => sweep(text), [text]);

  // Determine effective target room: if recipient is a DID, target its mailbox mb-<fingerprint>
  const effectiveRoom = useMemo(() => {
    if (roomOverride.trim()) return roomOverride.trim();
    const cleanRec = recipient.trim();
    if (cleanRec.startsWith('did:key:')) {
      if (isValidDid(cleanRec)) {
        return agentMailboxRoom(cleanRec);
      }
      return 'invalid-did';
    }
    if (cleanRec.startsWith('mb-') || cleanRec.startsWith('d-') || cleanRec.startsWith('p-')) {
      return cleanRec;
    }
    if (cleanRec) return cleanRec;
    return identity ? identity.mailboxRoom : 'lobby';
  }, [recipient, roomOverride, identity]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity) {
      setErrorMessage('No active identity loaded. Please generate or import an identity first.');
      setStatus('error');
      return;
    }
    if (!sweptText) {
      setErrorMessage('Message cannot be empty after single-line sweep.');
      setStatus('error');
      return;
    }
    if (sweptText.length > MAX_MESSAGE_CHARS) {
      setErrorMessage(`Message exceeds limit of ${MAX_MESSAGE_CHARS} characters.`);
      setStatus('error');
      return;
    }

    try {
      setStatus('signing');
      setErrorMessage(null);

      // Brief visual transition for signing phase
      await new Promise((r) => setTimeout(r, 150));

      setStatus('sending');
      await client.sendSignedMessage(effectiveRoom, identity, sweptText);

      setStatus('success');
      if (onPlaySendAudio) onPlaySendAudio();

      setTimeout(() => {
        onSuccess(effectiveRoom);
        onClose();
        setText('');
        setStatus('idle');
      }, 1000);
    } catch (err: unknown) {
      setStatus('error');
      setErrorMessage((err as Error)?.message || String(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-[#0e1017] border border-slate-700/70 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#121520]/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 tracking-wide">Compose Signed Message</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Authenticates with Ed25519 signature & monotonic nonce
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

        {/* Form */}
        <form onSubmit={handleSend} className="p-6 space-y-5">
          {/* Sender Identity Preview */}
          <div className="p-3 rounded-lg bg-black/40 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Signing As</span>
              <div className="font-mono text-xs text-cyan-300 truncate max-w-sm">
                {identity?.did || 'No Identity Loaded'}
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/30">
              Ed25519
            </span>
          </div>

          {/* Recipient / Target Room */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">Recipient / Room</label>
              {contacts.length > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Users className="w-3 h-3" />
                  <span>Quick Pick:</span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) setRecipient(e.target.value);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-cyan-300 font-mono"
                    defaultValue=""
                  >
                    <option value="" disabled>Saved Contacts</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.did}>
                        {c.nickname} ({c.did.slice(8, 14)}...)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter recipient DID (did:key:z6Mk...) or room name (lobby, mb-...)"
              className="w-full px-3.5 py-2.5 rounded-lg bg-black/50 border border-slate-700 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <div className="text-[11px] text-slate-400 font-mono">
              Target Channel: <span className="text-emerald-400 font-semibold">{effectiveRoom}</span>
            </div>
          </div>

          {/* Message Body */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">Message Text</label>
              <span className={`text-[11px] font-mono ${text.length > MAX_MESSAGE_CHARS ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                {text.length} / {MAX_MESSAGE_CHARS}
              </span>
            </div>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message... (Single-line sweep will automatically clean whitespace before signing)"
              className="w-full px-3.5 py-2.5 rounded-lg bg-black/50 border border-slate-700 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
            />
          </div>

          {/* Real-time Canonical Payload Preview */}
          {sweptText && (
            <div className="p-3 bg-black/40 rounded-lg border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Preview Canonical Signing Payload
              </span>
              <div className="font-mono text-[11px] text-cyan-300/90 break-all">
                {effectiveRoom}|&lt;auto-nonce&gt;|{sweptText}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {status === 'success' && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Message signed and broadcast successfully!</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={status === 'signing' || status === 'sending'}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim() || status === 'signing' || status === 'sending'}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'signing' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing (Ed25519)...</span>
                </>
              ) : status === 'sending' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Broadcasting...</span>
                </>
              ) : status === 'success' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Sent ✓</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Sign & Send Message</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
