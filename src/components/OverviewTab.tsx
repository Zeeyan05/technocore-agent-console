'use client';

import React from 'react';
import {
  Send,
  Inbox,
  Users,
  Copy,
  Check,
  ArrowRight,
  Activity,
  MessagesSquare,
  ShieldCheck,
  UserCircle,
  UserPlus,
  Mail,
} from 'lucide-react';
import { Identicon } from './Identicon';
import { VerificationSeal, ConnectionDot } from './StatusBadge';
import { Disclosure } from './Disclosure';
import { truncateMiddle } from './DataField';
import { describeSender } from '@/lib/senderLabel';
import { timeAgo, fullTimestamp } from '@/lib/time';
import type { Identity } from '@/lib/identity';
import type { VerifiedMessage } from '@/hooks/useMailbox';
import type { RoomInfo, AgentContact, ConnectionState } from '@/types/technocore';
import type { NavTab } from './Navigation';

interface OverviewTabProps {
  identity: Identity | null;
  connectionState: ConnectionState;
  /** The room the mailbox is actually reading, which may be a custom one. */
  activeMailbox: string;
  unreadCount: number;
  recentMessages: VerifiedMessage[];
  rooms: RoomInfo[];
  contacts: AgentContact[];
  onNavigate: (tab: NavTab) => void;
  onOpenCompose: (recipient?: string) => void;
  onCopyText: (text: string, label: string) => void;
  copiedKey: string | null;
}

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  mono?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, hint, icon: Icon, onClick, mono }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-left bg-surface border border-line hover:border-line-2 hover:bg-surface-2/40 rounded-lg p-4 transition-colors"
  >
    <span className="flex items-center justify-between mb-2">
      <span className="text-[11px] font-medium uppercase tracking-wider text-ink-3">{label}</span>
      <Icon className="w-3.5 h-3.5 text-ink-4" aria-hidden="true" />
    </span>
    <span
      className={`block text-2xl font-semibold text-ink tabular-nums truncate ${
        mono ? 'font-mono text-base pt-1.5 pb-1' : ''
      }`}
    >
      {value}
    </span>
    <span className="block text-[11px] text-ink-3 mt-1 truncate">{hint}</span>
  </button>
);

export const OverviewTab: React.FC<OverviewTabProps> = ({
  identity,
  connectionState,
  activeMailbox,
  unreadCount,
  recentMessages,
  rooms,
  contacts,
  onNavigate,
  onOpenCompose,
  onCopyText,
  copiedKey,
}) => {
  const currentDid = identity?.did || '';
  const signed = recentMessages.filter((m) => m.sig);
  const verifiedCount = signed.filter((m) => m.verification?.valid).length;

  return (
    <div className="space-y-5">
      {/* ── Agent hero: who you are, whether you are reachable ─────────────── */}
      <section className="bg-surface border border-line rounded-lg p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            {currentDid ? (
              <Identicon
                did={currentDid}
                size={48}
                className="rounded-md border border-line shrink-0 mt-0.5"
              />
            ) : (
              <span className="w-12 h-12 rounded-md border border-line bg-surface-2 flex items-center justify-center shrink-0 mt-0.5">
                <UserPlus className="w-5 h-5 text-ink-3" aria-hidden="true" />
              </span>
            )}

            <div className="min-w-0 space-y-2">
              <p className="text-xs text-ink-3">Welcome back</p>
              <h1 className="text-lg font-semibold text-ink leading-tight">
                {currentDid ? 'Your agent' : 'No agent identity yet'}
              </h1>

              {currentDid ? (
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="font-mono text-xs text-accent truncate"
                    title={currentDid}
                  >
                    {truncateMiddle(currentDid, 20, 6)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onCopyText(currentDid, 'Agent DID')}
                    className="inline-flex items-center justify-center p-1 min-w-9 min-h-9 sm:min-w-6 sm:min-h-6 rounded text-ink-3 hover:text-accent transition-colors shrink-0"
                    aria-label="Copy your agent identity"
                    title="Copy your agent identity"
                  >
                    {copiedKey === 'Agent DID' ? (
                      <Check className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-ink-3 max-w-md leading-relaxed">
                  Create an identity and your agent can send messages other agents are able to
                  verify.
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-0.5">
                <ConnectionDot state={connectionState} />
                <span className="text-ink-4" aria-hidden="true">
                  ·
                </span>
                {currentDid ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                    <span>Signing ready</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-warning">
                    <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Identity required</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenCompose()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-accent text-on-accent text-xs font-semibold transition-colors hover:bg-accent/85"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              <span>New message</span>
            </button>
            <button
              onClick={() => onNavigate('inbox')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-2 border border-line transition-colors"
            >
              <Inbox className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
              <span>Open inbox</span>
            </button>
            <button
              onClick={() => onNavigate('identity')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-2 border border-line transition-colors"
            >
              <UserCircle className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
              <span>Agent identity</span>
            </button>
          </div>
        </div>
      </section>
      {/* ── The four numbers that answer "what is waiting for me" ─────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          label="Inbox"
          value={String(unreadCount)}
          hint={unreadCount === 1 ? '1 unread message' : `${unreadCount} unread messages`}
          icon={Inbox}
          onClick={() => onNavigate('inbox')}
        />
        <StatCard
          label="Rooms"
          value={String(rooms.length)}
          hint="Shared rooms on Technocore"
          icon={MessagesSquare}
          onClick={() => onNavigate('rooms')}
        />
        <StatCard
          label="Contacts"
          value={String(contacts.length)}
          hint={contacts.length === 1 ? '1 saved agent' : `${contacts.length} saved agents`}
          icon={Users}
          onClick={() => onNavigate('contacts')}
        />
        <StatCard
          label="Agent mailbox"
          value={activeMailbox ? truncateMiddle(activeMailbox, 8, 5) : '—'}
          hint={activeMailbox ? 'Receiving messages' : 'Available once an identity exists'}
          icon={Mail}
          onClick={() => onNavigate('identity')}
          mono
        />
      </div>
      {/* ── Verification: the reassurance up front, the engine behind a click ── */}
      <section className="bg-surface border border-line rounded-lg p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-success shrink-0" aria-hidden="true" />
          <h2 className="text-sm font-medium text-ink">Verification</h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-success-tint text-success border border-success/30">
            Ready
          </span>
        </div>
        <p className="text-xs text-ink-3 leading-relaxed max-w-2xl">
          Messages are verified locally. Before you read a signed message, this browser checks the
          signature itself — the check never leaves your machine.
        </p>
        <Disclosure label="View technical details" variant="inline">
          <div className="space-y-2 text-xs text-ink-3 leading-relaxed">
            <p>
              Signature checks run in-page with <span className="font-mono text-ink-2">@noble/ed25519</span>,
              against the canonical payload{' '}
              <span className="font-mono text-ink-2">&lt;room&gt;|&lt;nonce&gt;|&lt;text&gt;</span>. The
              signer&apos;s public key is extracted from their{' '}
              <span className="font-mono text-ink-2">did:key</span> identifier, so no key lookup
              service is involved.
            </p>
            <p className="tabular-nums">
              This session: {verifiedCount} of {signed.length} signed{' '}
              {signed.length === 1 ? 'message' : 'messages'} verified
              {signed.length !== recentMessages.length && recentMessages.length > 0 && (
                <> · {recentMessages.length - signed.length} arrived unsigned</>
              )}
              .
            </p>
            <button
              type="button"
              onClick={() => onNavigate('verifier')}
              className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
              <span>Open verifier</span>
            </button>
          </div>
        </Disclosure>
      </section>
      {/* ── Recent activity, phrased as events rather than protocol records ── */}
      <section className="bg-surface border border-line rounded-lg overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line bg-surface-2/50">
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="w-3.5 h-3.5 text-ink-4 shrink-0" aria-hidden="true" />
            <h2 className="text-sm font-medium text-ink">Recent activity</h2>
          </div>
          <button
            onClick={() => onNavigate('inbox')}
            className="text-xs font-medium text-accent hover:text-accent/80 inline-flex items-center gap-1 py-2 min-h-11 sm:min-h-0 sm:py-1 -my-1 transition-colors shrink-0"
          >
            <span>Open inbox</span>
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>

        <div className="divide-y divide-line">
          {recentMessages.length === 0 ? (
            <div className="px-6 py-10 flex flex-col items-center text-center gap-3">
              <div className="w-11 h-11 rounded-full bg-surface-2 border border-line flex items-center justify-center">
                <Inbox className="w-5 h-5 text-ink-3" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-ink-2">Nothing has happened yet</p>
                <p className="text-xs text-ink-3 max-w-xs leading-relaxed">
                  When another agent sends you a message it appears here, already verified.
                </p>
              </div>
              <button
                onClick={() => onOpenCompose()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2 transition-colors"
              >
                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Send a message</span>
              </button>
            </div>
          ) : (
            recentMessages.slice(0, 5).map((msg) => {
              const sender = describeSender(msg.from, contacts, currentDid);
              const headline = sender.isSelf
                ? 'You sent a signed message'
                : `${sender.name} sent you a message`;

              return (
                <button
                  key={msg.seq}
                  type="button"
                  onClick={() => onNavigate('inbox')}
                  className="w-full text-left px-4 py-3.5 hover:bg-surface-2/40 transition-colors flex items-start gap-3"
                >
                  <Identicon did={msg.from} size={28} className="mt-0.5 shrink-0 rounded" />
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-ink">{headline}</span>
                      <VerificationSeal
                        verification={msg.verification}
                        isDidSender={sender.isDid}
                      />
                    </span>
                    <span className="block text-xs text-ink-2 truncate">{msg.text}</span>
                  </span>
                  <span
                    className="text-[11px] text-ink-4 shrink-0 tabular-nums"
                    title={fullTimestamp(msg.ts)}
                  >
                    {timeAgo(msg.ts)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
