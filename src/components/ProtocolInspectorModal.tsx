'use client';

import React, { useRef, useState } from 'react';
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  KeyRound,
  FileCode2,
  Fingerprint,
  Cpu,
  Layers,
} from 'lucide-react';
import { AgentIdentityMark } from './AgentIdentityMark';
import { GlowSurface } from './Surface';
import { ProtocolFlow, type FlowStep } from './ProtocolFlow';
import { CopyField } from './DataField';
import { publicKeyFromDid, isValidDid } from '@/lib/crypto/did';
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

/** The four sections of the instrument, ordered summary → depth → wire. */
const TABS = [
  { key: 'overview', label: 'Overview', icon: Layers },
  { key: 'crypto', label: 'Signature', icon: Cpu },
  { key: 'identity', label: 'Identity', icon: KeyRound },
  { key: 'raw', label: 'Raw data', icon: FileCode2 },
] as const;

type TabKey = (typeof TABS)[number]['key'];

/**
 * One group heading. Mono, small, and identical on every tab, so the four tabs
 * read as sections of a single instrument rather than four separate designs.
 */
const GroupLabel: React.FC<{
  icon: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ icon, children, actions }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="flex items-center gap-2 min-w-0">
      <span className="text-ink-4 shrink-0" aria-hidden="true">
        {icon}
      </span>
      {/* Wraps rather than truncates: at 360px "Canonical payload bytes (hex)"
          lost its "(hex)" to an ellipsis, which is the one word that tells it
          apart from the canonical-payload text block right above it. */}
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3 leading-tight">
        {children}
      </span>
    </span>
    {actions && <span className="shrink-0">{actions}</span>}
  </div>
);

/**
 * A block of protocol data. Outlined on purpose — §29 drops borders where they
 * are decoration, but a hard edge genuinely helps when the content is dense hex
 * and base64url rather than prose.
 */
const Group: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <GlowSurface variant="outlined" className={`p-3.5 sm:p-4 space-y-3 ${className}`}>
    {children}
  </GlowSurface>
);

/** A raw value in its own inset well. Wraps; never pushes the layout sideways. */
const Well: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div
    className={`rounded-lg bg-bg/60 border border-line px-3 py-2.5 font-mono text-xs break-all leading-relaxed ${className}`}
  >
    {children}
  </div>
);

/**
 * The copy affordance used in group headers: icon plus word, because a bare icon
 * is hard to find in a dense technical header. Flips to `Copied` for two seconds
 * and only ever after the clipboard write actually landed.
 */
const InlineCopy: React.FC<{ copied: boolean; onClick: () => void; name: string }> = ({
  copied,
  onClick,
  name,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={copied ? `${name} copied` : `Copy ${name}`}
    className="press inline-flex items-center gap-1 px-1.5 py-1.5 min-h-9 sm:min-h-6 sm:py-0.5 rounded text-[11px] font-medium text-ink-3 hover:text-accent"
  >
    {copied ? (
      <Check className="w-3.5 h-3.5 text-success anim-seal" aria-hidden="true" />
    ) : (
      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
    )}
    <span>{copied ? 'Copied' : 'Copy'}</span>
  </button>
);

export const ProtocolInspectorModal: React.FC<ProtocolInspectorModalProps> = ({
  message,
  room,
  isOpen,
  onClose,
  onCopyText,
  serverVersion,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const panelRef = useModalA11y(isOpen, onClose);

  if (!isOpen || !message) return null;

  const did = message.from;
  const isDidSender = isValidDid(did);
  const sweptText = sweep(message.text);
  const nonceStr = message.nonce ? String(message.nonce) : 'N/A';
  const canonicalString =
    isDidSender && message.nonce ? canonicalMessageString(room, nonceStr, sweptText) : '';
  const canonicalPayloadBytes = canonicalString
    ? canonicalMessagePayload(room, nonceStr, sweptText)
    : null;
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

  /** Copy through the app's handler, and flash the tick only if the write landed. */
  const copyValue = async (text: string, label: string) => {
    const ok = await onCopyText(text, label);
    if (!ok) return;
    setCopiedKey(label);
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

  const verdictBad =
    isDidSender &&
    message.verification?.signatureFormatValid &&
    !message.verification?.signatureValid;

  // The wire itself, not just the payload: this is the request this console made to
  // fetch the record below, and the shape it would POST to write one.
  const readEndpoint = `/api/proxy?path=/r/${room}&format=json&limit=50`;
  const sendBody = JSON.stringify(
    { did: '<sender did:key>', sig: '<86-char base64url signature>', nonce: '<counter>', text: '<message>' },
    null,
    2
  );

  /* One verdict, three shapes. Green is only ever the real Ed25519 result. */
  const verdict = message.verification?.valid
    ? {
        tint: 'bg-success-tint border-success/30',
        icon: <ShieldCheck className="w-5 h-5 text-success" aria-hidden="true" />,
        title: 'Signature verified',
        claim: 'The sender’s identity signed this exact message, checked in this browser.',
      }
    : verdictBad
    ? {
        tint: 'bg-danger-tint border-danger/30',
        icon: <ShieldX className="w-5 h-5 text-danger" aria-hidden="true" />,
        title: 'Signature does not match',
        claim: message.verification?.error || 'The signature does not cover this payload.',
      }
    : {
        tint: 'bg-surface-2 border-line',
        icon: <ShieldAlert className="w-5 h-5 text-warning" aria-hidden="true" />,
        title: 'Not signed',
        claim: 'No attributable signature, so the sender name is self-asserted.',
      };

  /* Every stage below reports a check this console really ran. A stage that did
     not apply stays neutral — it never turns green to complete the picture. */
  const flow: FlowStep[] = [
    { label: 'Message', state: 'ok', detail: `#${room} · seq ${message.seq}` },
    {
      label: 'Canonical',
      state: canonicalString ? 'ok' : 'pending',
      detail: canonicalString ? '<room>|<nonce>|<text>' : 'Cannot rebuild',
    },
    {
      label: 'Signature',
      state: message.verification?.signatureFormatValid ? 'ok' : message.sig ? 'fail' : 'pending',
      detail: message.sig ? `${message.sig.length} base64url chars` : 'Absent',
    },
    {
      label: 'Identity',
      state: message.verification?.didFormatValid ? 'ok' : 'pending',
      detail: isDidSender ? 'did:key ed25519-pub' : 'Not a did:key',
    },
    {
      label: 'Verified',
      state: message.verification?.valid ? 'ok' : verdictBad ? 'fail' : 'pending',
      detail: message.verification?.valid
        ? 'Checked locally'
        : verdictBad
        ? 'Check failed'
        : 'Not run',
    },
  ];

  /* Arrow keys move between sections, which is what a tablist is expected to do,
     and only the selected tab sits in the Tab sequence. */
  const handleTabKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = TABS.length - 1;
    const next =
      e.key === 'ArrowRight'
        ? i === last
          ? 0
          : i + 1
        : e.key === 'ArrowLeft'
        ? i === 0
          ? last
          : i - 1
        : e.key === 'Home'
        ? 0
        : e.key === 'End'
        ? last
        : -1;
    if (next < 0) return;
    e.preventDefault();
    setActiveTab(TABS[next].key);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 modal-backdrop">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspector-title"
        className="modal-panel relative w-full max-w-3xl surface-raised border border-line-2 rounded-xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Nameplate: what this instrument is, and exactly which record is loaded. */}
        <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-line wash-accent">
          <div className="flex items-start gap-3 min-w-0">
            <span className="shrink-0 grid place-items-center w-9 h-9 rounded-lg bg-surface-2 border border-line text-accent">
              <Cpu className="w-4 h-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-4">
                Protocol analysis
              </p>
              <h2
                id="inspector-title"
                className="text-base sm:text-lg font-bold tracking-tight text-ink"
              >
                Protocol Inspector
              </h2>

              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-ink-2 border border-line tabular-nums">
                  seq #{String(message.seq).padStart(5, '0')}
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-ink-3 border border-line truncate max-w-[11rem]">
                  #{room}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close protocol inspector"
            className="press inline-flex items-center justify-center p-1.5 min-w-9 min-h-9 rounded-md text-ink-3 hover:text-ink hover:bg-surface-3 shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* The verdict. Prominent because it is the answer; one line because the
            flow and the fields below are where the evidence lives. */}
        <div className={`flex items-start gap-3 px-4 sm:px-5 py-3 border-b ${verdict.tint}`}>
          <span className="shrink-0 mt-0.5">{verdict.icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{verdict.title}</p>
            <p className="text-[11px] text-ink-2 leading-relaxed">{verdict.claim}</p>
          </div>
        </div>

        {/* Sections. Segmented pills rather than an underline strip: this reads as
            an instrument with modes, and each one clears the touch floor. */}
        <div
          role="tablist"
          aria-label="Inspector sections"
          className="flex items-center gap-1 px-2 sm:px-4 py-2 border-b border-line bg-bg/40 overflow-x-auto"
        >
          {TABS.map((tab, i) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                role="tab"
                id={`inspector-tab-${tab.key}`}
                aria-selected={active}
                aria-controls={`inspector-panel-${tab.key}`}
                tabIndex={active ? 0 : -1}
                onClick={() => setActiveTab(tab.key)}
                onKeyDown={(e) => handleTabKey(e, i)}
                className={`press inline-flex items-center gap-1.5 px-2.5 py-2 min-h-9 rounded-md border text-xs font-medium whitespace-nowrap ${
                  active
                    ? 'bg-surface-2 border-line text-ink'
                    : 'border-transparent text-ink-3 hover:text-ink hover:bg-surface-2/60'
                }`}
              >
                <tab.icon
                  className={`w-3.5 h-3.5 ${active ? 'text-accent' : ''}`}
                  aria-hidden="true"
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="px-4 sm:px-5 py-4 sm:py-5 overflow-y-auto">
          {/* SECTION 1 — OVERVIEW: every field, grouped the way §18 asks. */}
          {activeTab === 'overview' && (
            <div
              role="tabpanel"
              id="inspector-panel-overview"
              aria-labelledby="inspector-tab-overview"
              className="space-y-3.5 anim-fade"
            >
              <ProtocolFlow steps={flow} />

              <Group>
                <GroupLabel icon={<Layers className="w-3.5 h-3.5" />}>Message as stored</GroupLabel>
                <Well className="text-ink whitespace-pre-wrap">{message.text}</Well>
                {message.text !== sweptText && (
                  <p className="text-[11px] text-warning leading-relaxed">
                    Whitespace was collapsed before signing, so the signature covers{' '}
                    <span className="font-mono">&quot;{sweptText}&quot;</span>.
                  </p>
                )}
              </Group>

              <Group>
                <GroupLabel icon={<KeyRound className="w-3.5 h-3.5" />}>Identity</GroupLabel>
                <div className="flex items-start gap-3">
                  {isDidSender ? (
                    <AgentIdentityMark did={did} size={40} />
                  ) : (
                    <span
                      className="grid place-items-center w-10 h-10 rounded-lg bg-surface-2 border border-line text-ink-4 shrink-0"
                      aria-hidden="true"
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <CopyField
                      label={isDidSender ? 'Sender DID' : 'Sender name'}
                      value={did}
                      copyLabel="Sender identity"
                      onCopyText={copyValue}
                      copiedKey={copiedKey}
                      tone={isDidSender ? 'accent' : 'ink'}
                      head={22}
                      tail={8}
                      hint={
                        isDidSender
                          ? 'did:key · multicodec 0xed01 (ed25519-pub). The public key is inside the identifier.'
                          : 'Not a did:key, so this name proves nothing about who sent it.'
                      }
                    />
                  </div>
                </div>
              </Group>

              <Group>
                <GroupLabel icon={<Layers className="w-3.5 h-3.5" />}>Message record</GroupLabel>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="rounded-lg bg-surface-2 border border-line px-3 py-2 min-w-0">
                    <dt className="text-[10px] font-medium uppercase tracking-wider text-ink-4">
                      Room
                    </dt>
                    <dd className="mt-0.5 font-mono text-xs text-accent truncate" title={room}>
                      {room}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-surface-2 border border-line px-3 py-2 min-w-0">
                    <dt className="text-[10px] font-medium uppercase tracking-wider text-ink-4">
                      Sequence
                    </dt>
                    <dd className="mt-0.5 font-mono text-xs text-ink tabular-nums">
                      #{message.seq}
                    </dd>
                  </div>
                  <div className="col-span-2 sm:col-span-1 rounded-lg bg-surface-2 border border-line px-3 py-2 min-w-0">
                    <dt className="text-[10px] font-medium uppercase tracking-wider text-ink-4">
                      Server timestamp
                    </dt>
                    <dd
                      className="mt-0.5 font-mono text-xs text-ink-2 truncate"
                      title={message.ts || undefined}
                    >
                      {message.ts || 'Not recorded'}
                    </dd>
                  </div>
                </dl>
              </Group>

              <Group>
                <GroupLabel icon={<Cpu className="w-3.5 h-3.5" />}>Cryptography</GroupLabel>
                <div className="rounded-lg bg-surface-2 border border-line px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-ink-4">
                    Nonce
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-success tabular-nums break-all">
                    {nonceStr}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-3 leading-relaxed">
                    A counter the sender increments, so the same signature cannot be replayed.
                  </p>
                </div>
                <CopyField
                  label="Ed25519 signature"
                  value={message.sig || ''}
                  copyLabel="Signature"
                  onCopyText={copyValue}
                  copiedKey={copiedKey}
                  head={16}
                  tail={10}
                  hint={message.sig ? undefined : 'This record carries no signature field.'}
                />
                <CopyField
                  label="Canonical payload"
                  value={canonicalString}
                  copyLabel="Canonical payload"
                  onCopyText={copyValue}
                  copiedKey={copiedKey}
                  tone="accent"
                  head={20}
                  tail={10}
                  hint={
                    canonicalString
                      ? 'The exact characters the signature covers: <room>|<nonce>|<text>.'
                      : 'Cannot be rebuilt — this record has no did:key sender, or no nonce.'
                  }
                />
              </Group>
            </div>
          )}

          {/* SECTION 2 — SIGNATURE: the same values at byte level. */}
          {activeTab === 'crypto' && (
            <div
              role="tabpanel"
              id="inspector-panel-crypto"
              aria-labelledby="inspector-tab-crypto"
              className="space-y-3.5 anim-fade"
            >
              <Group>
                <GroupLabel
                  icon={<Cpu className="w-3.5 h-3.5" />}
                  actions={
                    message.sig ? (
                      <InlineCopy
                        copied={copiedKey === 'Signature'}
                        onClick={() => copyValue(message.sig || '', 'Signature')}
                        name="signature"
                      />
                    ) : undefined
                  }
                >
                  Ed25519 signature
                </GroupLabel>
                <Well className="text-warning">
                  {message.sig || 'No signature field present in this record.'}
                </Well>
                {message.sig && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-ink-3">
                    <span className="tabular-nums">
                      {message.sig.length} base64url characters
                    </span>
                    <span>
                      Ends in &apos;{message.sig.slice(-1)}&apos; (
                      {['A', 'Q', 'g', 'w'].includes(message.sig.slice(-1))
                        ? 'canonical'
                        : 'non-canonical'}
                      )
                    </span>
                  </div>
                )}
              </Group>

              <Group>
                <GroupLabel
                  icon={<FileCode2 className="w-3.5 h-3.5" />}
                  actions={
                    canonicalString ? (
                      <InlineCopy
                        copied={copiedKey === 'Canonical payload'}
                        onClick={() => copyValue(canonicalString, 'Canonical payload')}
                        name="canonical payload"
                      />
                    ) : undefined
                  }
                >
                  Canonical signing payload
                </GroupLabel>
                <p className="font-mono text-[11px] text-ink-4">
                  &lt;room&gt;|&lt;nonce&gt;|&lt;text&gt;
                </p>
                <Well className="text-accent">
                  {canonicalString ||
                    'Cannot rebuild the payload — this record has no did:key sender, or no nonce.'}
                </Well>
                <p className="text-[11px] text-ink-3 leading-relaxed">
                  These are the exact characters the signature covers. Change one of them and the
                  Ed25519 check fails.
                </p>
              </Group>

              {canonicalPayloadHex && (
                <Group>
                  <GroupLabel
                    icon={<Cpu className="w-3.5 h-3.5" />}
                    actions={
                      <InlineCopy
                        copied={copiedKey === 'Canonical payload bytes'}
                        onClick={() => copyValue(canonicalPayloadHex, 'Canonical payload bytes')}
                        name="canonical payload bytes"
                      />
                    }
                  >
                    Canonical payload bytes (hex)
                  </GroupLabel>
                  <Well className="text-[11px] text-ink-3 max-h-40 overflow-y-auto">
                    {canonicalPayloadHex}
                  </Well>
                </Group>
              )}
            </div>
          )}

          {/* SECTION 3 — IDENTITY: what the DID itself contains. */}
          {activeTab === 'identity' && (
            <div
              role="tabpanel"
              id="inspector-panel-identity"
              aria-labelledby="inspector-tab-identity"
              className="space-y-3.5 anim-fade"
            >
              <Group>
                <GroupLabel
                  icon={<KeyRound className="w-3.5 h-3.5" />}
                  actions={
                    <InlineCopy
                      copied={copiedKey === 'Agent identity'}
                      onClick={() => copyValue(did, 'Agent identity')}
                      name="agent identity"
                    />
                  }
                >
                  Agent identity (DID)
                </GroupLabel>
                <div className="flex items-center gap-3 rounded-lg bg-surface-2 border border-line p-3">
                  {isDidSender ? (
                    <AgentIdentityMark did={did} size={44} />
                  ) : (
                    <span
                      className="grid place-items-center w-11 h-11 rounded-lg bg-surface-3 border border-line text-ink-4 shrink-0"
                      aria-hidden="true"
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </span>
                  )}
                  <div className="min-w-0 font-mono text-xs text-ink-2 break-all">{did}</div>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-ink-3">
                  <span>Method: did:key</span>
                  <span>Multicodec: 0xed01 (ed25519-pub)</span>
                  <span className="tabular-nums">{did.length} characters</span>
                </div>
              </Group>

              <Group>
                <GroupLabel
                  icon={<Cpu className="w-3.5 h-3.5" />}
                  actions={
                    pubKeyHex !== 'N/A' ? (
                      <InlineCopy
                        copied={copiedKey === 'Public key'}
                        onClick={() => copyValue(pubKeyHex, 'Public key')}
                        name="public key"
                      />
                    ) : undefined
                  }
                >
                  Ed25519 public key (32 bytes, hex)
                </GroupLabel>
                <Well className="text-success">
                  {pubKeyHex === 'N/A' ? 'Not derivable — this sender is not a did:key.' : pubKeyHex}
                </Well>
                <p className="text-[11px] text-ink-3 leading-relaxed">
                  Decoded from the DID itself. This is the key the signature is checked against.
                </p>
              </Group>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <Group>
                  <GroupLabel icon={<Fingerprint className="w-3.5 h-3.5" />}>
                    Fingerprint (SHA-256)
                  </GroupLabel>
                  <Well className="text-accent">{fingerprint}</Well>
                  <p className="text-[11px] text-ink-3 leading-relaxed">
                    A short hash of the public key. This app derives the suggested{' '}
                    <span className="font-mono">mb-</span> mailbox name from it — a convention, not a
                    protocol-enforced binding.
                  </p>
                </Group>
                <Group>
                  <GroupLabel icon={<FileCode2 className="w-3.5 h-3.5" />}>
                    Sharded note path
                  </GroupLabel>
                  <Well className="text-ink-2">{notePath.path}</Well>
                  <p className="text-[11px] text-ink-3 leading-relaxed">
                    Where a public note for this identity would live in Technocore&apos;s key-value
                    store. Nothing is written there by this console.
                  </p>
                </Group>
              </div>
            </div>
          )}

          {/* SECTION 4 — RAW DATA: the wire, kept developer-plain on purpose. */}
          {activeTab === 'raw' && (
            <div
              role="tabpanel"
              id="inspector-panel-raw"
              aria-labelledby="inspector-tab-raw"
              className="space-y-3.5 anim-fade"
            >
              <Group>
                <GroupLabel
                  icon={<FileCode2 className="w-3.5 h-3.5" />}
                  actions={
                    <InlineCopy
                      copied={copiedKey === 'Read endpoint'}
                      onClick={() => copyValue(readEndpoint, 'Read endpoint')}
                      name="read endpoint"
                    />
                  }
                >
                  Read endpoint
                </GroupLabel>
                <Well className="text-accent">GET {readEndpoint}</Well>
                <p className="text-[11px] text-ink-3 leading-relaxed">
                  Requests go through this app&apos;s own proxy route, which forwards to Technocore.
                </p>
              </Group>

              <Group>
                <GroupLabel icon={<FileCode2 className="w-3.5 h-3.5" />}>
                  Signed send request
                </GroupLabel>
                <Well className="text-ink-2">POST /api/proxy?path=/r/{room}</Well>
                <pre className="rounded-lg bg-bg/60 border border-line px-3 py-2.5 font-mono text-[11px] text-ink-3 overflow-x-auto leading-relaxed">
                  {sendBody}
                </pre>
              </Group>

              <Group>
                <GroupLabel
                  icon={<Layers className="w-3.5 h-3.5" />}
                  actions={
                    <InlineCopy
                      copied={copiedKey === 'Response record'}
                      onClick={() => copyValue(rawJson, 'Response record')}
                      name="response record"
                    />
                  }
                >
                  Response record
                </GroupLabel>
                <pre className="rounded-lg bg-bg/60 border border-line px-3 py-2.5 font-mono text-xs text-success/90 overflow-x-auto leading-relaxed">
                  {rawJson}
                </pre>
              </Group>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-line bg-surface-2/50">
          <span className="min-w-0 truncate font-mono text-[10px] sm:text-[11px] text-ink-3">
            {serverVersion
              ? `Technocore protocol v${serverVersion} (live)`
              : 'Technocore protocol version unavailable'}
          </span>
          <button
            onClick={onClose}
            className="press px-3.5 py-2 min-h-9 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2 shrink-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
