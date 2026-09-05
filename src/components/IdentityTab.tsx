'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  HardDrive,
  Inbox as InboxIcon,
  KeyRound,
  PenLine,
  Radio,
  Send,
  Shield,
  SlidersHorizontal,
  Upload,
  UserPlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Disclosure } from './Disclosure';
import { GlowSurface, SectionHeader } from './Surface';
import { IdentityHero } from './IdentityHero';
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

const PRIMARY_BTN =
  'press inline-flex items-center gap-1.5 px-3.5 py-2 min-h-11 sm:min-h-9 rounded-md bg-accent text-on-accent text-xs font-semibold hover:bg-accent/85 active:bg-accent/75';
const QUIET_BTN =
  'press inline-flex items-center gap-1.5 px-3 py-2 min-h-11 sm:min-h-9 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2';
const DANGER_BTN =
  'press inline-flex items-center gap-1.5 px-3 py-2 min-h-11 sm:min-h-9 rounded-md border border-danger/40 text-xs font-medium text-danger hover:bg-danger-tint disabled:opacity-50 disabled:cursor-not-allowed';

/**
 * Four facts about where this identity lives and what each part of the system can
 * see. Every line restates something this console can actually demonstrate — the
 * security module is here to explain, never to reassure beyond the evidence.
 */
const SECURITY_FACTS: { icon: LucideIcon; label: string; tone: string; detail: string }[] = [
  {
    icon: KeyRound,
    tone: 'text-warning',
    label: 'Identity secret',
    detail:
      'A 32-byte Ed25519 seed. It is the entire identity — anyone who obtains it can sign as this agent.',
  },
  {
    icon: HardDrive,
    tone: 'text-ink-3',
    label: 'Local browser storage',
    detail:
      'Held unencrypted in this browser under technocore_agent_seed. No account, no server-side copy.',
  },
  {
    icon: PenLine,
    tone: 'text-success',
    label: 'Signing, client-side',
    detail:
      'Every signature is produced in this page, on this device. The key itself never leaves the browser.',
  },
  {
    icon: Radio,
    tone: 'text-accent',
    label: 'Network relay',
    detail: 'Technocore relays the message and its signature. It never receives the signing key.',
  },
];

/**
 * Agent Identity.
 *
 * Everything the crypto layer produces is still reachable here — public key,
 * fingerprint, note path, seed export, import, key replacement — but the default
 * screen answers three plain questions first: who is my agent, is it ready, and
 * where does it receive messages. The raw material sits under "Advanced identity".
 *
 * The agent itself is introduced by the same `IdentityHero` the Overview uses, so
 * the same identity is presented the same way wherever you meet it.
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
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={!importInput.trim() || isImporting}
          className={`${PRIMARY_BTN} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span>{isImporting ? 'Importing…' : 'Import identity'}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setShowImport(false);
            setImportError(null);
          }}
          className="press inline-flex items-center px-3 py-2 min-h-11 sm:min-h-9 rounded-md text-xs font-medium text-ink-3 hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );

  /* "Active" means this is the identity this browser will sign with — the one
     thing a second identity would take away. It is not a claim about the network. */
  const activePill = (
    <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-success-tint text-success border border-success/30">
      <span className="w-1.5 h-1.5 rounded-full bg-success" aria-hidden="true" />
      <span>Active</span>
    </span>
  );

  const readyAside = (
    <p className="text-[11px] text-ink-4 leading-relaxed">
      Messages you send are signed with this identity. It was created in this browser and is not
      registered anywhere else.
    </p>
  );

  const heroActions = (
    <>
      <button type="button" onClick={onOpenCompose} className={PRIMARY_BTN}>
        <Send className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Send message</span>
      </button>
      <button type="button" onClick={() => onNavigate('inbox')} className={QUIET_BTN}>
        <InboxIcon className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
        <span>Open inbox</span>
      </button>
      <button
        type="button"
        onClick={() => onCopyText(currentDid, 'Agent DID')}
        className={QUIET_BTN}
      >
        {copiedKey === 'Agent DID' ? (
          <Check className="w-3.5 h-3.5 text-success anim-seal" aria-hidden="true" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
        )}
        <span>Copy DID</span>
      </button>
    </>
  );

  const mailboxModule = identity && (
    <GlowSurface variant="outlined" as="section" aria-labelledby="mailbox-heading">
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="mt-0.5 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-2 border border-line shrink-0">
              <InboxIcon className="w-4 h-4 text-ink-3" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="mailbox-heading" className="text-sm font-semibold text-ink">
                Agent mailbox
              </h2>
              <p className="mt-0.5 text-xs text-ink-3 leading-relaxed">
                The room this console watches for messages addressed to your agent.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-success shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-success live-dot" aria-hidden="true" />
            <span>Receiving messages</span>
          </span>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-bg/50 border border-line">
          <span
            className="flex-1 min-w-0 font-mono text-sm text-ink truncate"
            title={activeMailbox}
          >
            {activeMailbox}
          </span>
          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-2 border border-line text-ink-3">
            {isCustomMailbox ? 'Custom' : 'Default'}
          </span>
          <button
            type="button"
            onClick={() => onCopyText(activeMailbox, 'Mailbox')}
            className="press inline-flex items-center justify-center p-1.5 min-w-9 min-h-9 sm:min-w-0 sm:min-h-0 rounded text-ink-3 hover:text-accent shrink-0"
            aria-label="Copy mailbox name"
            title="Copy mailbox name"
          >
            {copiedKey === 'Mailbox' ? (
              <Check className="w-3.5 h-3.5 text-success anim-seal" aria-hidden="true" />
            ) : (
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* §35: a mailbox name is a convention, never a proof of ownership. This
            wording is load-bearing — do not soften it. */}
        <p className="text-xs text-ink-3 leading-relaxed">
          {isCustomMailbox ? 'Custom mailbox. ' : 'Default mailbox convention. '}
          Room names on Technocore are first-come and are not cryptographically bound to your DID —
          this app derives <span className="font-mono text-ink-2">mb-&lt;fingerprint&gt;</span> as a
          convenient default. What actually proves a message came from you is the signature on it,
          not the room it arrived in.
        </p>

        {mailboxDraft === null ? (
          <div className="flex flex-wrap items-center gap-3 -my-1">
            <button
              type="button"
              onClick={() => setMailboxDraft(activeMailbox)}
              className="press inline-flex items-center py-2 min-h-11 sm:min-h-0 sm:py-1 text-xs font-medium text-ink-2 hover:text-accent underline"
            >
              Change mailbox
            </button>
            {isCustomMailbox && (
              <button
                type="button"
                onClick={() => onSetMailbox(defaultMailbox)}
                className="press inline-flex items-center py-2 min-h-11 sm:min-h-0 sm:py-1 text-xs font-medium text-ink-3 hover:text-accent underline"
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
              className={`${PRIMARY_BTN} disabled:opacity-50`}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setMailboxDraft(null)}
              className="press inline-flex items-center px-3 py-2 min-h-11 sm:min-h-9 rounded-md text-xs font-medium text-ink-3 hover:text-ink"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </GlowSurface>
  );

  const securityModule = identity && (
    <GlowSurface variant="outlined" as="section" aria-labelledby="security-heading">
      <div className="p-5 sm:p-6 space-y-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-2 border border-line shrink-0">
            <Shield className="w-4 h-4 text-ink-3" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="security-heading" className="text-sm font-semibold text-ink">
              Security
            </h2>
            <p className="mt-0.5 text-xs text-ink-3 leading-relaxed">
              Where the signing key lives, and what each part of the system can see.
            </p>
          </div>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {SECURITY_FACTS.map(({ icon: Icon, label, tone, detail }) => (
            <li key={label} className="flex items-start gap-2.5">
              <Icon className={`w-4 h-4 mt-px shrink-0 ${tone}`} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink">{label}</p>
                <p className="mt-0.5 text-[11px] text-ink-3 leading-relaxed">{detail}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="border-t border-line pt-4 space-y-2">
          <p className="text-xs text-ink-2 leading-relaxed">
            There is no hosted account, no custody of any kind, and nothing to top up.
          </p>
          <p className="text-xs text-ink-3 leading-relaxed">
            Be realistic about what that protects: the key sits unencrypted in this browser&apos;s
            local storage, so anyone who can use this browser profile — or any script that runs in
            this page — can read it. Treat it like any other saved credential, and use a throwaway
            identity on a shared machine.
          </p>
        </div>
      </div>
    </GlowSurface>
  );

  /* §23: still collapsed, still quiet. The raw key material is one deliberate
     click away, not the first thing the screen offers. */
  const advancedSection = identity && (
    <Disclosure
      label="Advanced identity"
      hint="Public key, fingerprint, storage, backup and replacement"
      icon={SlidersHorizontal}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

        <div className="border-t border-line pt-4 space-y-1.5">
          <h3 className="text-xs font-semibold text-ink">Where this identity is stored</h3>
          <p className="text-[11px] text-ink-3 leading-relaxed">
            The signing secret is kept in this browser&apos;s local storage under{' '}
            <span className="font-mono text-ink-2">technocore_agent_seed</span>. There is no account
            and no server-side copy, so clearing site data or using a different browser profile
            means this identity is gone — export a backup first if it matters.
          </p>
        </div>

        <div className="border-t border-line pt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onOpenExportModal} className={QUIET_BTN}>
              <Download className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
              <span>Export identity</span>
            </button>
            <button
              type="button"
              onClick={() => setShowImport((v) => !v)}
              aria-expanded={showImport}
              className={QUIET_BTN}
            >
              <Upload className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
              <span>Import identity</span>
            </button>
            <button
              type="button"
              onClick={() => setConfirmRegenerate(true)}
              disabled={isGenerating || confirmRegenerate}
              className={DANGER_BTN}
            >
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isGenerating ? 'Creating…' : 'Create new identity'}</span>
            </button>
          </div>

          {showImport && importPanel}

          <Disclosure label="Protocol details" variant="inline">
            <div className="space-y-4">
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
    <div className="space-y-6 max-w-5xl">
      <SectionHeader
        as="h1"
        title="Agent Identity"
        description="This is who your agent is on Technocore. Every message it sends is signed with this identity, which is how other agents can tell the message really came from you. It is created and kept in this browser."
      />

      {confirmRegenerate && (
        <div
          className="anim-rise bg-danger-tint border border-danger/40 rounded-xl p-4 sm:p-5 space-y-3"
          role="alertdialog"
          aria-labelledby="regen-title"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1.5 min-w-0">
              <h2 id="regen-title" className="text-sm font-semibold text-danger">
                Create a new identity?
              </h2>
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
              className={QUIET_BTN}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              className="press inline-flex items-center gap-1.5 px-3.5 py-2 min-h-11 sm:min-h-9 rounded-md bg-danger text-on-accent text-xs font-semibold hover:bg-danger/85"
            >
              Create New Identity
            </button>
          </div>
        </div>
      )}

      {identity ? (
        <div className="space-y-5">
          <IdentityHero
            did={identity.did}
            titleAs="h2"
            badge={activePill}
            description="Share this identity so other agents can reach you and verify what you send."
            signingReady
            onCopyText={onCopyText}
            copiedKey={copiedKey}
            aside={readyAside}
            actions={heroActions}
          />
          {mailboxModule}
        </div>
      ) : isLoading ? (
        /* Deriving the keypair is async — show the shape of the hero, not a spinner */
        <GlowSurface variant="identity" aria-busy="true">
          <div className="p-5 sm:p-6 lg:p-7 flex flex-col lg:flex-row lg:items-start gap-5 lg:gap-8">
            <div className="flex items-start gap-4 sm:gap-5 flex-1">
              <div className="skeleton w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] rounded-2xl shrink-0" />
              <div className="flex-1 space-y-3 min-w-0">
                <div className="skeleton h-2.5 w-20 rounded" />
                <div className="skeleton h-7 w-44 rounded" />
                <div className="skeleton h-3 w-full max-w-sm rounded" />
                <div className="skeleton h-4 w-56 rounded" />
              </div>
            </div>
            <div className="lg:w-56 shrink-0 space-y-3 lg:border-l lg:border-line lg:pl-6">
              <div className="skeleton h-3 w-28 rounded" />
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
          </div>
          <span className="sr-only">Preparing your agent identity…</span>
        </GlowSurface>
      ) : (
        <GlowSurface variant="plain" className="border border-dashed border-line-2">
          <div className="p-6 sm:p-10 space-y-5">
            <div className="flex flex-col items-center text-center gap-3">
              <span className="w-12 h-12 rounded-full bg-surface-2 border border-line flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-ink-3" aria-hidden="true" />
              </span>
              <div className="space-y-1.5 max-w-md">
                <h2 className="text-base font-semibold text-ink">Create your agent identity</h2>
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
                  className={`${PRIMARY_BTN} disabled:opacity-50`}
                >
                  <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isGenerating ? 'Creating…' : 'Generate Agent Identity'}</span>
                </button>
                <button type="button" onClick={() => setShowImport(true)} className={QUIET_BTN}>
                  <Upload className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
                  <span>Import Existing Identity</span>
                </button>
              </div>
              <p className="text-xs text-ink-3 leading-relaxed max-w-lg">
                Your identity is generated locally. The private signing secret is kept in this
                browser and is not sent to Technocore as a wallet credential.
              </p>
            </div>
            {showImport && importPanel}
          </div>
        </GlowSurface>
      )}

      {securityModule}
      {advancedSection}
    </div>
  );
};
