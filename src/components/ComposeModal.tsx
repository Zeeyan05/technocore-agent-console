'use client';

import React, { useState, useMemo } from 'react';
import { X, Send, ShieldCheck, AlertCircle, CheckCircle2, Users, Loader2 } from 'lucide-react';
import { sweep } from '@/lib/crypto/sweep';
import { isValidDid } from '@/lib/crypto/did';
import { agentMailboxRoom } from '@/lib/crypto/fingerprint';
import { useModalA11y } from '@/hooks/useModalA11y';
import { Disclosure } from './Disclosure';
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
      setErrorMessage('Your agent has no identity yet. Create one on the Identity screen first.');
      setStatus('error');
      return;
    }
    if (!effectiveRoom) {
      setErrorMessage('Choose a mailbox to deliver this message to.');
      setStatus('error');
      return;
    }
    if (!sweptText) {
      setErrorMessage('Write something before sending.');
      setStatus('error');
      return;
    }
    if (sweptText.length > MAX_MESSAGE_CHARS) {
      setErrorMessage(`Message is too long. The limit is ${MAX_MESSAGE_CHARS} characters.`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="compose-title"
        className="modal-panel relative w-full max-w-xl surface-raised border border-line-2 rounded-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface-2/50">
          <div className="flex items-center gap-3">
            <Send className="w-5 h-5 text-accent" aria-hidden="true" />
            <div>
              <h2 id="compose-title" className="text-base font-semibold text-ink">
                New message
              </h2>
              <p className="text-xs text-ink-3 mt-0.5">
                Signed with your agent identity so the recipient can verify it came from you
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isBusy}
            className="inline-flex items-center justify-center p-1.5 min-w-11 min-h-11 sm:min-w-0 sm:min-h-0 rounded-md text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors disabled:opacity-40"
            aria-label="Close compose"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form. Scrolls inside the panel so a 360px-tall phone can still reach
            Send — the header above it stays put. */}
        <form onSubmit={handleSend} className="p-6 space-y-5 overflow-y-auto">
          {/* Who this will be signed as — reassurance, not a protocol readout */}
          <div className="p-3 rounded-md bg-bg/40 border border-line flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <span className="text-[11px] font-medium text-ink-3">Sending as</span>
              <div className="font-mono text-xs text-accent truncate">
                {identity?.did || 'No agent identity yet'}
              </div>
            </div>
            {identity && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-success-tint text-success border border-success/30 shrink-0">
                <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                <span>Will be signed</span>
              </span>
            )}
          </div>

          {/* Recipient — pick a saved agent, or paste an identity */}
          <div className="space-y-2">
            <span className="block text-xs font-medium text-ink-2">Recipient</span>

            {contacts.length > 0 && (
              <div className="space-y-1.5">
                <label htmlFor="compose-contact" className="flex items-center gap-1.5 text-[11px] text-ink-3">
                  <Users className="w-3 h-3" aria-hidden="true" />
                  <span>Choose a contact</span>
                </label>
                <select
                  id="compose-contact"
                  value={contacts.some((c) => c.did === recipientDid) ? recipientDid : ''}
                  onChange={(e) => {
                    if (e.target.value) handleContactSelect(e.target.value);
                  }}
                  className="w-full px-3 py-2.5 min-h-11 sm:min-h-0 rounded-md bg-bg/60 border border-line text-xs text-ink focus:outline-none focus:border-line-accent transition-colors"
                >
                  <option value="">Select a saved agent…</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.did}>
                      {c.nickname}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="compose-recipient" className="block text-[11px] text-ink-3">
                {contacts.length > 0 ? 'Or paste an agent identity' : 'Paste an agent identity'}
              </label>
              <input
                id="compose-recipient"
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
                placeholder="did:key:z6Mk…"
                className="w-full px-3.5 py-2.5 min-h-11 sm:min-h-0 rounded-md bg-bg/60 border border-line text-xs font-mono text-accent placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
              />
              <p className="text-[11px] text-ink-4">
                Optional. Filling this in picks the matching mailbox below.
              </p>
            </div>
          </div>

          {/* Mailbox — the actual delivery destination */}
          <div className="space-y-2">
            <label htmlFor="compose-room" className="block text-xs font-medium text-ink-2">
              Mailbox
            </label>
            <input
              id="compose-room"
              type="text"
              value={targetRoom}
              onChange={(e) => {
                setTargetRoom(e.target.value);
                clearError();
              }}
              placeholder="e.g. mb-e3b0c44298fc1c14, lobby, d-myroom"
              required
              className="w-full px-3.5 py-2.5 min-h-11 sm:min-h-0 rounded-md bg-bg/60 border border-line text-xs font-mono text-success placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
            />
            <p className="text-[11px] text-ink-3 leading-relaxed">
              Where the message is delivered.
              {recipientDid.startsWith('did:key:') && (
                <>
                  {' '}Room names are first-come and are not cryptographically bound to an identity —{' '}
                  <span className="font-mono text-ink-2">mb-&lt;fingerprint&gt;</span> is a
                  convention this app follows, and you can override it.
                </>
              )}
            </p>
          </div>

          {/* Message Body */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="compose-text" className="text-xs font-medium text-ink-2">
                Message
              </label>
              <span
                className={`text-[11px] font-mono tabular-nums ${
                  text.length > MAX_MESSAGE_CHARS ? 'text-danger font-bold' : 'text-ink-3'
                }`}
              >
                {text.length} / {MAX_MESSAGE_CHARS}
              </span>
            </div>
            <textarea
              id="compose-text"
              rows={4}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                clearError();
              }}
              placeholder="Write your message…"
              className="w-full px-3.5 py-2.5 rounded-md bg-bg/60 border border-line text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors resize-none leading-relaxed"
            />
            <p className="text-[11px] text-ink-4">
              Line breaks and repeated spaces are collapsed before the message is signed.
            </p>
          </div>

          {/* The exact bytes that get signed — kept, but out of the everyday path. */}
          {sweptText && (
            <Disclosure label="What will be signed" variant="inline">
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider">
                  Canonical signing payload
                </span>
                <div className="font-mono text-[11px] text-accent break-all">
                  {effectiveRoom}|&lt;auto-nonce&gt;|{sweptText}
                </div>
                <p className="text-[11px] text-ink-4 leading-relaxed">
                  The nonce is a counter this app fills in for you at send time, so the same
                  message can never be replayed.
                </p>
              </div>
            </Disclosure>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-md bg-danger-tint border border-danger/40 text-danger text-xs flex items-start gap-2" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {status === 'success' && (
            <div className="p-3 rounded-md bg-success-tint border border-success/40 text-success text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Message signed and sent</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="px-4 py-2 min-h-11 sm:min-h-0 rounded-md bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-2 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim() || isBusy}
              className="inline-flex items-center gap-2 px-5 py-2 min-h-11 sm:min-h-0 rounded-md bg-accent text-on-accent text-xs font-bold transition-colors hover:bg-accent/85 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'signing' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  <span>Signing…</span>
                </>
              ) : status === 'sending' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  <span>Sending…</span>
                </>
              ) : status === 'success' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Sent</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Send message</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};