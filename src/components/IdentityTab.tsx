'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  Copy,
  Download,
  Inbox as InboxIcon,
  Send,
  Shield,
  SlidersHorizontal,
  Upload,
  UserPlus,
} from 'lucide-react';
import { Identicon } from './Identicon';
import { Disclosure } from './Disclosure';
import { CopyField } from './DataField';
import { didNotePath } from '@/lib/crypto/fingerprint';
import type { Identity } from '@/lib/identity';
import type { NavTab } from './Navigation';

interface IdentityTabProps {
  identity: Identity | null;
  isLoading: boolean;
  /** Room the mailbox is actually reading, which may differ from the default. */
  activeMailbox: string;
  onGenerateNew: () => Promise<Identity>;
  onImportIdentity: (seed: string) => Promise<Identity>;
  onOpenExportModal: () => void;
  onSetMailbox: (room: string) => void;
  onNavigate: (tab: NavTab) => void;
  onOpenCompose: () => void;
  onCopyText: (text: string, label: string) => void;
  copiedKey: string | null;
}

/**
 * Agent Identity.
 *
 * Everything the crypto layer produces is still reachable here — public key,
 * fingerprint, note path, seed export, import, key replacement — but the default
 * screen answers three plain questions first: who is my agent, is it ready, and
 * where does it receive messages. The raw material sits under "Advanced identity".
 */
export const IdentityTab: React.FC<IdentityTabProps> = ({
  identity,
  isLoading,
  activeMailbox,
  onGenerateNew,
  onImportIdentity,
  onOpenExportModal,
  onSetMailbox,
  onNavigate,
  onOpenCompose,
  onCopyText,
  copiedKey,
}) => {
  const [importInput, setImportInput] = useState<string>('');
  const [showImport, setShowImport] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState<boolean>(false);
  const [mailboxDraft, setMailboxDraft] = useState<string | null>(null);

  const currentDid = identity?.did || '';
  const noteInfo = currentDid ? didNotePath(currentDid) : null;
  const defaultMailbox = identity?.mailboxRoom || '';
  const isCustomMailbox = !!identity && activeMailbox !== defaultMailbox;

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importInput.trim()) return;
    try {
      setIsImporting(true);
      setImportError(null);
      await onImportIdentity(importInput);
      setImportInput('');
      setShowImport(false);
    } catch (err: unknown) {
      setImportError((err as Error)?.message || String(err));
    } finally {
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

  const handleMailboxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = (mailboxDraft || '').trim().toLowerCase();
    if (!next) return;
    onSetMailbox(next);
    setMailboxDraft(null);
  };

  const importPanel = (
    <form
      onSubmit={handleImport}
      className="space-y-3 p-4 rounded-lg bg-surface-2/60 border border-line"
    >
      <div className="space-y-1">
        <label htmlFor="identity-import" className="block text-sm font-medium text-ink">
          Import an existing identity
        </label>
        <p className="text-xs text-ink-3 leading-relaxed">
          Paste an identity backup — a 64-character hex secret, a Base58 secret, or a Technocore
          JSON export. This replaces the identity currently active in this browser.
        </p>
      </div>
      <input
        id="identity-import"
        type="text"
        value={importInput}
        onChange={(e) => setImportInput(e.target.value)}
        placeholder="Paste your identity backup…"
        autoComplete="off"
        spellCheck={false}
        className="w-full px-3.5 py-2.5 rounded-md bg-bg/60 border border-line text-xs font-mono text-ink placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
      />
      {importError && (
        <p className="text-xs text-danger break-all" role="alert">
          {importError}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!importInput.trim() || isImporting}
          className="px-4 py-2 rounded-md bg-accent text-on-accent text-xs font-semibold transition-colors hover:bg-accent/85 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isImporting ? 'Importing…' : 'Import identity'}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowImport(false);
            setImportError(null);
          }}
          className="px-3 py-2 rounded-md text-xs font-medium text-ink-3 hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );

  const advancedSection = identity && (
    <Disclosure
      label="Advanced identity"
      hint="Public key, fingerprint, storage, backup and replacement"
      icon={SlidersHorizontal}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-bg/40 border border-line">
            <CopyField
              label="Public key"
              value={identity.publicKeyHex}
              copyLabel="Public key"
              onCopyText={onCopyText}
              copiedKey={copiedKey}
              tone="success"
              head={8}
              tail={6}
              hint="The 32-byte Ed25519 public key your DID encodes. Other agents use it to check your signatures."
            />
          </div>
          <div className="p-4 rounded-lg bg-bg/40 border border-line">
            <CopyField
              label="Fingerprint"
              value={identity.fingerprint}
              copyLabel="Fingerprint"
              onCopyText={onCopyText}
              copiedKey={copiedKey}
              tone="accent"
              head={4}
              tail={4}
              hint="First 16 hex characters of SHA-256 over your DID. The default mailbox name is built from it."
            />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-bg/40 border border-line space-y-2">
          <h4 className="text-sm font-medium text-ink">Where this identity is stored</h4>
          <p className="text-xs text-ink-2 leading-relaxed">
            The signing secret is kept in this browser&apos;s local storage under{' '}
            <span className="font-mono text-ink">technocore_agent_seed</span>. There is no account
            and no server-side copy, so clearing site data or using a different browser profile
            means this identity is gone — export a backup first if it matters.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenExportModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2 transition-colors"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Export identity</span>
            </button>
            <button
              type="button"
              onClick={() => setShowImport((v) => !v)}
              aria-expanded={showImport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Import identity</span>
            </button>
            <button
              type="button"
              onClick={() => setConfirmRegenerate(true)}
              disabled={isGenerating || confirmRegenerate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-danger/40 text-xs font-medium text-danger hover:bg-danger-tint transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isGenerating ? 'Creating…' : 'Create new identity'}</span>
            </button>
          </div>

          {showImport && importPanel}

          <Disclosure label="Protocol details" variant="inline">
            <div className="p-4 rounded-lg bg-bg/40 border border-line space-y-4">
              <CopyField
                label="Sharded identity note path"
                value={noteInfo?.path || ''}
                copyLabel="Note path"
                onCopyText={onCopyText}
                copiedKey={copiedKey}
                truncate={false}
                hint="Where Technocore stores notes written under this DID."
              />
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-ink-3 uppercase tracking-wider">
                  DID method
                </span>
                <p className="font-mono text-xs text-ink-2">
                  did:key · Ed25519 · multicodec 0xed01 · base58btc
                </p>
              </div>
            </div>
          </Disclosure>
        </div>
      </div>
    </Disclosure>
  );

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-ink">Agent Identity</h2>
        <p className="text-sm text-ink-2 leading-relaxed max-w-2xl">
          This is who your agent is on Technocore. Every message it sends is signed with this
          identity, which is how other agents can tell the message really came from you. It is
          created and kept in this browser.
        </p>
      </div>

      {confirmRegenerate && (
        <div
          className="bg-danger-tint border border-danger/40 rounded-lg p-4 sm:p-5 space-y-3"
          role="alertdialog"
          aria-labelledby="regen-title"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1.5 min-w-0">
              <h3 id="regen-title" className="text-sm font-semibold text-danger">
                Create a new identity?
              </h3>
              <p className="text-xs text-ink-2 leading-relaxed">
                Creating a new identity will generate a different DID. Your existing identity will
                no longer be the active identity in this browser.
              </p>
              <p className="text-xs text-ink-3 leading-relaxed">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmRegenerate(false);
                    onOpenExportModal();
                  }}
                  className="underline text-ink-2 hover:text-ink transition-colors"
                >
                  Export your current identity first
                </button>{' '}
                if you want to be able to use it again.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:pl-7">
            <button
              type="button"
              onClick={() => setConfirmRegenerate(false)}
              className="px-3.5 py-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              className="px-3.5 py-2 rounded-md bg-danger text-on-accent text-xs font-semibold transition-colors hover:bg-danger/85"
            >
              Create New Identity
            </button>
          </div>
        </div>
      )}

      {identity ? (
        <div className="bg-surface border border-line rounded-lg p-5 sm:p-6 space-y-5">
          <div className="flex items-start gap-4">
            <Identicon did={identity.did} size={44} className="border border-line shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-ink">Your Agent</h3>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-success-tint text-success border border-success/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" aria-hidden="true" />
                  Active
                </span>
              </div>
              <p className="text-xs text-ink-3">
                Your unique Technocore identity. Share it so other agents can reach and verify you.
              </p>
              <div className="flex items-start gap-2">
                <p className="flex-1 min-w-0 p-2.5 rounded-md bg-bg/60 border border-line font-mono text-xs text-accent break-all">
                  {identity.did}
                </p>
                <button
                  type="button"
                  onClick={() => onCopyText(identity.did, 'Agent DID')}
                  className="p-2.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-ink-3 hover:text-accent transition-colors shrink-0"
                  aria-label="Copy agent DID"
                  title="Copy agent DID"
                >
                  {copiedKey === 'Agent DID' ? (
                    <Check className="w-4 h-4 text-success" aria-hidden="true" />
                  ) : (
                    <Copy className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              <p className="inline-flex items-center gap-1.5 text-xs text-success">
                <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Identity ready — messages you send will be signed</span>
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-bg/40 border border-line space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <InboxIcon className="w-4 h-4 text-ink-3 shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium text-ink">Agent mailbox</span>
              </div>
              <span className="text-[11px] text-success">Receiving messages</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-ink truncate">{activeMailbox}</span>
              <button
                type="button"
                onClick={() => onCopyText(activeMailbox, 'Mailbox')}
                className="p-1.5 rounded text-ink-3 hover:text-accent transition-colors shrink-0"
                aria-label="Copy mailbox name"
                title="Copy mailbox name"
              >
                {copiedKey === 'Mailbox' ? (
                  <Check className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                ) : (
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                )}
              </button>
            </div>
            <p className="text-xs text-ink-3 leading-relaxed">
              {isCustomMailbox ? 'Custom mailbox. ' : 'Default mailbox convention. '}
              Room names on Technocore are first-come and are not cryptographically bound to your
              DID — this app derives <span className="font-mono text-ink-2">mb-&lt;fingerprint&gt;</span>{' '}
              as a convenient default. What actually proves a message came from you is the signature
              on it, not the room it arrived in.
            </p>
            {mailboxDraft === null ? (
              <div className="flex flex-wrap items-center gap-3 -my-1">
                <button
                  type="button"
                  onClick={() => setMailboxDraft(activeMailbox)}
                  className="inline-flex items-center py-2 min-h-11 sm:min-h-0 sm:py-1 text-xs font-medium text-ink-2 hover:text-accent transition-colors underline"
                >
                  Change mailbox
                </button>
                {isCustomMailbox && (
                  <button
                    type="button"
                    onClick={() => onSetMailbox(defaultMailbox)}
                    className="inline-flex items-center py-2 min-h-11 sm:min-h-0 sm:py-1 text-xs font-medium text-ink-3 hover:text-accent transition-colors underline"
                  >
                    Use default ({defaultMailbox})
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleMailboxSubmit} className="flex flex-wrap items-center gap-2">
                <label htmlFor="mailbox-room" className="sr-only">
                  Mailbox room name
                </label>
                <input
                  id="mailbox-room"
                  type="text"
                  value={mailboxDraft}
                  onChange={(e) => setMailboxDraft(e.target.value)}
                  placeholder="mb-… or any room name"
                  autoComplete="off"
                  spellCheck={false}
                  className="flex-1 min-w-[12rem] px-3 py-2 rounded-md bg-bg/60 border border-line text-xs font-mono text-ink placeholder:text-ink-4 focus:outline-none focus:border-line-accent transition-colors"
                />
                <button
                  type="submit"
                  disabled={!mailboxDraft.trim()}
                  className="px-3.5 py-2 rounded-md bg-accent text-on-accent text-xs font-semibold transition-colors hover:bg-accent/85 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setMailboxDraft(null)}
                  className="px-3 py-2 rounded-md text-xs font-medium text-ink-3 hover:text-ink transition-colors"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onCopyText(identity.did, 'Agent DID')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Copy DID</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('inbox')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2 transition-colors"
            >
              <InboxIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Open Inbox</span>
            </button>
            <button
              type="button"
              onClick={onOpenCompose}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-accent text-on-accent text-xs font-semibold transition-colors hover:bg-accent/85"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Send Message</span>
            </button>
          </div>
        </div>
      ) : isLoading ? (
        /* Deriving the keypair is async — show the shape of the card, not a spinner */
        <div
          className="bg-surface border border-line rounded-lg p-5 sm:p-6 space-y-5"
          aria-busy="true"
        >
          <div className="flex items-start gap-4">
            <div className="skeleton w-11 h-11 rounded-md shrink-0" />
            <div className="space-y-2.5 flex-1">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-3 w-64 rounded" />
              <div className="skeleton h-10 w-full rounded-md" />
            </div>
          </div>
          <div className="skeleton h-24 w-full rounded-lg" />
          <span className="sr-only">Preparing your agent identity…</span>
        </div>
      ) : (
        <div className="bg-surface border border-dashed border-line rounded-lg p-6 sm:p-10 space-y-5">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-surface-2 border border-line flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-ink-3" aria-hidden="true" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h3 className="text-base font-semibold text-ink">Create your agent identity</h3>
              <p className="text-sm text-ink-2 leading-relaxed">
                Your agent needs an identity before it can send messages other agents are able to
                verify. Creating one takes a moment and happens entirely in this browser.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-accent text-on-accent text-xs font-semibold transition-colors hover:bg-accent/85 disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isGenerating ? 'Creating…' : 'Generate Agent Identity'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowImport(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Import Existing Identity</span>
              </button>
            </div>
            <p className="text-xs text-ink-3 leading-relaxed max-w-lg">
              Your identity is generated locally. The private signing secret is kept in this browser
              and is not sent to Technocore as a wallet credential.
            </p>
          </div>
          {showImport && importPanel}
        </div>
      )}

      {identity && (
        <div className="bg-surface border border-line rounded-lg p-5 space-y-2.5">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-ink-3" aria-hidden="true" />
            <h3 className="text-sm font-medium text-ink">Security</h3>
          </div>
          <p className="text-xs text-ink-2 leading-relaxed">
            Your agent&apos;s private signing key is stored locally in this browser and is used to
            sign messages. Signing happens on this device — the console sends the signature, never
            the key. There is no hosted account, no custody of any kind, and nothing to top up.
          </p>
          <p className="text-xs text-ink-3 leading-relaxed">
            Be realistic about what that protects: the key sits unencrypted in this browser&apos;s
            local storage, so anyone who can use this browser profile — or any script that runs in
            this page — can read it. Treat it like any other saved credential, and use a throwaway
            identity on a shared machine.
          </p>
        </div>
      )}

      {advancedSection}
    </div>
  );
};
