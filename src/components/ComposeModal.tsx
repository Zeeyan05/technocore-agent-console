'use client';

import React, { useState, useMemo } from 'react';
import { X, Send, ShieldCheck, AlertCircle, CheckCircle2, Users, Loader2 } from 'lucide-react';
import { sweep } from '@/lib/crypto/sweep';
import { isValidDid } from '@/lib/crypto/did';
import { agentMailboxRoom } from '@/lib/crypto/fingerprint';
import { useModalA11y } from '@/hooks/useModalA11y';
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
}) => {
  const [recipientDid, setRecipientDid] = useState<string>(defaultRecipient.startsWith('did:key:') ? defaultRecipient : '');
  const [targetRoom, setTargetRoom] = useState<string>(() => {
    if (defaultRoom) return defaultRoom;
    if (defaultRecipient && !defaultRecipient.startsWith('did:key:')) return defaultRecipient;
    if (defaultRecipient && defaultRecipient.startsWith('did:key:') && isValidDid(defaultRecipient)) {
      return agentMailboxRoom(defaultRecipient);
    }
    return identity ? identity.mailboxRoom : 'lobby';
  });
  const [text, setText] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'signing' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (defaultRecipient.startsWith('did:key:')) {
        setRecipientDid(defaultRecipient);
        if (isValidDid(defaultRecipient)) {
          setTargetRoom(agentMailboxRoom(defaultRecipient));
        }
      } else if (defaultRoom) {
        setTargetRoom(defaultRoom);
        setRecipientDid('');
      } else if (defaultRecipient) {
        setTargetRoom(defaultRecipient);
        setRecipientDid('');
      } else {
        setTargetRoom(identity ? identity.mailboxRoom : 'lobby');
        setRecipientDid('');
      }
      setStatus('idle');
      setErrorMessage(null);
    }
  }, [isOpen, defaultRecipient, defaultRoom, identity]);

  const sweptText = useMemo(() => sweep(text), [text]);

  // Escape must not abandon the dialog while a signature is being broadcast.
  const isBusy = status === 'signing' || status === 'sending';
  const panelRef = useModalA11y(isOpen, onClose, { lockClose: isBusy });

  const effectiveRoom = useMemo(() => {
    const cleanRoom = targetRoom.trim();
    if (cleanRoom) return cleanRoom;
    if (recipientDid.trim() && isValidDid(recipientDid.trim())) {
      return agentMailboxRoom(recipientDid.trim());
    }
    return identity ? identity.mailboxRoom : 'lobby';
  }, [targetRoom, recipientDid, identity]);

  const handleContactSelect = (contactDid: string) => {
    setRecipientDid(contactDid);
    const found = contacts.find((c) => c.did === contactDid);
    if (found?.mailboxRoom) {
      setTargetRoom(found.mailboxRoom);
    } else if (isValidDid(contactDid)) {
      setTargetRoom(agentMailboxRoom(contactDid));
    }
    clearError();
  };

  // A failed attempt should not keep showing its error while the user edits the
  // form to fix it — clear as soon as any field changes.
  function clearError() {
    if (errorMessage !== null || status === 'error') {
      setErrorMessage(null);
      setStatus('idle');
    }
  }

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity) {
      setErrorMessage('No active identity loaded. Please generate or import an identity first.');
      setStatus('error');
      return;
    }
    if (!effectiveRoom) {
      setErrorMessage('Please specify a target mailbox / channel room.');
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

      // Real Ed25519 signing happens inside sendSignedMessage — no artificial delay.
      setStatus('sending');
      await client.sendSignedMessage(effectiveRoom, identity, sweptText);

      setStatus('success');

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
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="compose-title"
        className="relative w-full max-w-xl bg-surface border border-line-2 rounded-lg overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface-2/50">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <div>
              <h2 id="compose-title" className="text-base font-semibold text-ink">
                Compose Signed Message
              </h2>
              <p className="text-xs text-ink-3 mt-0.5">
                Authenticates with Ed25519 signature &amp; monotonic nonce
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isBusy}
            className="p-1.5 rounded-md text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors disabled:opacity-40"
            aria-label="Close compose"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSend} className="p-6 space-y-5">
          {/* Sender Identity Preview */}
          <div className="p-3 rounded-md bg-bg/40 border border-line flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-ink-3 uppercase tracking-wider">Signing As</span>
              <div className="font-mono text-xs text-accent truncate max-w-sm">
                {identity?.did || 'No Identity Loaded'}
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-success-tint text-success border border-success/30">
              Ed25519
            </span>
          </div>

          {/* Recipient DID (Optional / Contact lookup) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-ink-2">Recipient DID (Optional Attribution)</label>
              {contacts.length > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-ink-3">
                  <Users className="w-3 h-3" />
                  <span>Quick Pick:</span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleContactSelect(e.target.value);
                    }}
                    className="bg-surface-2 border border-line rounded px-1.5 py-0.5 text-xs text-accent font-mono"
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
              value={recipientDid}
              onChange={(e) => {
                const val = e.target.value;
                setRecipientDid(val);
                if (val.startsWith('did:key:') && isValidDid(val.trim())) {
                  setTargetRoom(agentMailboxRoom(val.trim()));
                }
                clearError();
              }}
              placeholder="did:key:z6Mk... (optional peer agent identity)"
              className="w-full px-3.5 py-2.5 rounded-md bg-bg/60 border border-line text-xs font-mono text-accent placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
            />
          </div>

          {/* Target Channel / Room (Authoritative Network Destination) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-ink-2">Target Mailbox / Channel Room</label>
              <span className="text-[10px] text-ink-4 font-mono">First-come destination</span>
            </div>
            <input
              type="text"
              value={targetRoom}
              onChange={(e) => {
                setTargetRoom(e.target.value);
                clearError();
              }}
              placeholder="e.g. mb-e3b0c44298fc1c14, lobby, sdk-test, d-myroom"
              required
              className="w-full px-3.5 py-2.5 rounded-md bg-bg/60 border border-line text-xs font-mono text-success placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
            />
            {recipientDid.startsWith('did:key:') && (
              <p className="text-[11px] text-ink-3 font-mono">
                Note: Room names are not cryptographically bound to DIDs. <span className="text-ink">mb-&lt;fingerprint&gt;</span> is an application convention you can override above.
              </p>
            )}
          </div>

          {/* Message Body */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-ink-2">Message Text</label>
              <span className={`text-[11px] font-mono ${text.length > MAX_MESSAGE_CHARS ? 'text-danger font-bold' : 'text-ink-3'}`}>
                {text.length} / {MAX_MESSAGE_CHARS}
              </span>
            </div>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                clearError();
              }}
              placeholder="Type your message... (Single-line sweep will automatically clean whitespace before signing)"
              className="w-full px-3.5 py-2.5 rounded-md bg-bg/60 border border-line text-xs font-mono text-ink placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors resize-none"
            />
          </div>

          {/* Real-time Canonical Payload Preview */}
          {sweptText && (
            <div className="p-3 bg-bg/40 rounded-md border border-line space-y-1.5">
              <span className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider">
                Preview Canonical Signing Payload
              </span>
              <div className="font-mono text-[11px] text-accent break-all">
                {effectiveRoom}|&lt;auto-nonce&gt;|{sweptText}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-md bg-danger-tint border border-danger/40 text-danger text-xs flex items-start gap-2" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {status === 'success' && (
            <div className="p-3 rounded-md bg-success-tint border border-success/40 text-success text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Message signed and broadcast successfully!</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="px-4 py-2 rounded-md bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-2 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim() || isBusy}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-accent text-on-accent text-xs font-bold transition-colors hover:bg-accent/85 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sent</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Sign &amp; Send Message</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};