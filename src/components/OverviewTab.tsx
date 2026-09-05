'use client';

import React from 'react';
import {
  Send,
  Inbox,
  Users,
  ArrowRight,
  Activity,
  MessagesSquare,
  ShieldCheck,
  UserCircle,
  UserPlus,
  Mail,
} from 'lucide-react';
import { AgentIdentityMark } from './AgentIdentityMark';
import { VerificationSeal, StatusIndicator } from './StatusBadge';
import { Disclosure } from './Disclosure';
import { GlowSurface, SectionHeader } from './Surface';
import { IdentityHero } from './IdentityHero';
import { MetricCard, ActivityWave, NodeCluster, SignalArcs } from './MetricCard';
import { ActivityItem } from './ActivityItem';
import { truncateMiddle } from './DataField';
import { describeSender } from '@/lib/senderLabel';
import { timeAgo } from '@/lib/time';
import type { Identity } from '@/lib/identity';
import type { VerifiedMessage } from '@/hooks/useMailbox';
import type { RoomInfo, AgentContact, ConnectionState } from '@/types/technocore';
import type { NavTab } from './Navigation';

interface OverviewTabProps {
  identity: Identity | null;
  connectionState: ConnectionState;
  /** Round-trip time from the last health probe, or null if it failed. */
  latencyMs: number | null;
  /** When that probe answered. Drives the timestamp on the system events. */
  lastChecked: Date | null;
  /** True while a mailbox long-poll is open. */
  isPolling: boolean;
  /** Highest sequence number seen — used only as the arrival-pulse trigger. */
  lastSeq: number;
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

const BUCKETS = 14;

/**
 * The shape of what is actually in the mailbox: the held messages spread across
 * the window they arrived in, oldest bucket first. Nothing is extrapolated — an
 * empty mailbox returns all zeros, which `ActivityWave` draws as a flat baseline
 * rather than as invented traffic.
 */
function arrivalBuckets(messages: readonly VerifiedMessage[]): number[] {
  const out: number[] = new Array(BUCKETS).fill(0);
  const times = messages
    .map((m) => Date.parse(m.ts))
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b);

  if (times.length === 0) return out;

  const first = times[0];
  const span = times[times.length - 1] - first;

  times.forEach((t) => {
    const slot =
      span > 0 ? Math.min(BUCKETS - 1, Math.floor(((t - first) / span) * BUCKETS)) : BUCKETS - 1;
    out[slot] += 1;
  });

  return out;
}

/** Wall-clock for a system event. Client-only state, so no hydration mismatch. */
function clockTime(date: Date | null): string | undefined {
  return date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined;
}

/** The contacts tile's visual: the saved agents themselves, not a count again. */
const ContactMarks: React.FC<{ contacts: readonly AgentContact[] }> = ({ contacts }) => {
  if (contacts.length === 0) {
    return <p className="h-5 text-[11px] text-ink-4 leading-5">No agents saved yet</p>;
  }

  return (
    <div className="flex items-center h-5 -space-x-1.5">
      {contacts.slice(0, 5).map((contact) => (
        <AgentIdentityMark
          key={contact.id}
          did={contact.did}
          size={20}
          className="rounded-[5px] ring-1 ring-bg"
        />
      ))}
      {contacts.length > 5 && (
        <span className="pl-3 font-mono text-[10px] text-ink-4">+{contacts.length - 5}</span>
      )}
    </div>
  );
};

const PRIMARY_BTN =
  'press inline-flex items-center gap-1.5 px-3.5 py-2 min-h-11 sm:min-h-9 rounded-md bg-accent text-on-accent text-xs font-semibold hover:bg-accent/85 active:bg-accent/75';
const QUIET_BTN =
  'press inline-flex items-center gap-1.5 px-3 py-2 min-h-11 sm:min-h-9 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2';

export const OverviewTab: React.FC<OverviewTabProps> = ({
  identity,
  connectionState,
  latencyMs,
  lastChecked,
  isPolling,
  lastSeq,
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
  const unsignedCount = recentMessages.length - signed.length;
  const buckets = React.useMemo(() => arrivalBuckets(recentMessages), [recentMessages]);
  const probeTime = clockTime(lastChecked);
  const feed = recentMessages.slice(0, 5);

  /* The mailbox line is deliberately worded as a room this console *watches*.
     A mailbox name is a convention, not a cryptographic binding to the DID, and
     the UI must never suggest otherwise. */
  const mailboxAside = (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-4">
        Agent mailbox
      </p>
      <p className="mt-1 font-mono text-[11px] text-ink-2 truncate" title={activeMailbox}>
        {activeMailbox || '—'}
      </p>
      <p className="mt-1 text-[11px] text-ink-4 leading-relaxed">
        A room this console watches. Not proof of ownership.
      </p>
    </div>
  );

  const heroActions = (
    <>
      <button onClick={() => onOpenCompose()} className={PRIMARY_BTN}>
        <Send className="w-3.5 h-3.5" aria-hidden="true" />
        <span>New message</span>
      </button>
      <button onClick={() => onNavigate('inbox')} className={QUIET_BTN}>
        <Inbox className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
        <span>Open inbox</span>
      </button>
      <button onClick={() => onNavigate('identity')} className={QUIET_BTN}>
        <UserCircle className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
        <span>Agent identity</span>
      </button>
    </>
  );

  /* Two heroes, because the empty case is a different statement. Rendering a
     derived identity mark with no identity behind it would be a picture of
     nothing, so the placeholder stays a placeholder. */
  const hero = currentDid ? (
    <IdentityHero
      did={currentDid}
      eyebrow="Your agent"
      title="Your agent"
      description="This browser holds the signing key. Messages leave here signed, and arrive here verified."
      connectionState={connectionState}
      latencyMs={latencyMs}
      isPolling={isPolling}
      pulseKey={lastSeq}
      signingReady
      onCopyText={onCopyText}
      copiedKey={copiedKey}
      aside={mailboxAside}
      actions={heroActions}
    />
  ) : (
    <GlowSurface variant="identity" className="overflow-hidden">
      <div className="p-5 sm:p-6 lg:p-7 flex flex-col lg:flex-row lg:items-start gap-5 lg:gap-8">
        <div className="flex items-start gap-4 sm:gap-5 min-w-0 flex-1">
          <span className="w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] shrink-0 rounded-2xl border border-dashed border-line-2 bg-surface-2 flex items-center justify-center">
            <UserPlus className="w-7 h-7 text-ink-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-identity">
              Agent identity
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              No agent identity yet
            </h1>
            <p className="mt-1.5 text-[13px] text-ink-3 leading-relaxed max-w-md">
              Create one and this console can sign messages other agents are able to verify. The key
              is generated in this browser and never sent anywhere.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button onClick={() => onNavigate('identity')} className={PRIMARY_BTN}>
                <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Create identity</span>
              </button>
              <button onClick={() => onNavigate('rooms')} className={QUIET_BTN}>
                <MessagesSquare className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
                <span>Browse rooms</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:w-56 shrink-0 flex flex-col gap-3 lg:border-l lg:border-line lg:pl-6">
          <StatusIndicator state={connectionState} latencyMs={latencyMs} />
          <span className="inline-flex items-center gap-1.5 text-xs text-warning">
            <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Identity required to sign</span>
          </span>
        </div>
      </div>
    </GlowSurface>
  );

  /* §11: with no personal activity the rail still has something true to say, so
     it reports the system's own state. Every line below is read from real
     console state — none of it is a placeholder event. */
  const systemEvents: Array<{
    key: string;
    tone: 'success' | 'accent' | 'identity' | 'warning' | 'neutral';
    title: string;
    detail: string;
    timestamp?: string;
    live?: boolean;
  }> = [
    connectionState === 'connected'
      ? {
          key: 'connection',
          tone: 'success',
          title: 'Technocore connection established',
          detail:
            latencyMs !== null
              ? `Health probe answered in ${latencyMs}ms`
              : 'Health probe answered',
          timestamp: probeTime,
        }
      : connectionState === 'error'
      ? {
          key: 'connection',
          tone: 'warning',
          title: 'Upstream did not answer the last probe',
          detail: 'The console retries every 30 seconds.',
          timestamp: probeTime,
        }
      : {
          key: 'connection',
          tone: 'neutral',
          title: 'Checking the upstream connection',
          detail: 'The first health probe is in flight.',
          live: true,
        },
    currentDid
      ? {
          key: 'mailbox',
          tone: 'accent',
          title: 'Mailbox open',
          detail: `Watching ${activeMailbox} for signed messages`,
          live: isPolling,
        }
      : {
          key: 'mailbox',
          tone: 'neutral',
          title: 'Mailbox waiting on an identity',
          detail: 'This console picks a mailbox room once an identity exists.',
        },
    {
      key: 'verify',
      tone: 'identity',
      title: 'Local verification ready',
      detail: 'Ed25519 checks run in this browser — no key lookup service is involved.',
    },
    {
      key: 'idle',
      tone: 'neutral',
      title: 'Waiting for agent activity',
      detail: 'Anything that arrives shows up here, already verified.',
    },
  ];

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <div className="anim-rise">{hero}</div>

      {/* The four numbers, deliberately not four identical rectangles: the inbox
          leads at double width with its own arrival shape, rooms and contacts sit
          quietly beside it, and the mailbox is a name rather than a count. */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-3.5">
        <div
          className="col-span-2 anim-rise anim-stagger"
          style={{ '--i': 1 } as React.CSSProperties}
        >
          <MetricCard
            className="h-full"
            label="Inbox"
            value={unreadCount}
            valueSize="lg"
            tone="accent"
            icon={<Inbox className="w-4 h-4" aria-hidden="true" />}
            detail={unreadCount === 1 ? '1 unread message' : `${unreadCount} unread messages`}
            visual={<ActivityWave buckets={buckets} />}
            onClick={() => onNavigate('inbox')}
            actionLabel={`Open inbox, ${unreadCount} unread`}
          />
        </div>

        <div className="anim-rise anim-stagger" style={{ '--i': 2 } as React.CSSProperties}>
          <MetricCard
            className="h-full"
            label="Rooms"
            value={rooms.length}
            icon={<MessagesSquare className="w-4 h-4" aria-hidden="true" />}
            detail="Shared rooms upstream"
            visual={<NodeCluster count={rooms.length} />}
            onClick={() => onNavigate('rooms')}
            actionLabel={`Open rooms, ${rooms.length} listed`}
          />
        </div>

        <div className="anim-rise anim-stagger" style={{ '--i': 3 } as React.CSSProperties}>
          <MetricCard
            className="h-full"
            label="Contacts"
            value={contacts.length}
            tone="identity"
            icon={<Users className="w-4 h-4" aria-hidden="true" />}
            detail={contacts.length === 1 ? '1 saved agent' : `${contacts.length} saved agents`}
            visual={<ContactMarks contacts={contacts} />}
            onClick={() => onNavigate('contacts')}
            actionLabel={`Open the agent directory, ${contacts.length} saved`}
          />
        </div>

        <div
          className="col-span-2 anim-rise anim-stagger"
          style={{ '--i': 4 } as React.CSSProperties}
        >
          <MetricCard
            className="h-full"
            label="Agent mailbox"
            value={activeMailbox ? truncateMiddle(activeMailbox, 11, 6) : '—'}
            valueSize="sm"
            icon={<Mail className="w-4 h-4" aria-hidden="true" />}
            detail={
              currentDid
                ? isPolling
                  ? 'Listening for new messages now'
                  : 'Connected and waiting'
                : 'Available once an identity exists'
            }
            visual={<SignalArcs active={isPolling} />}
            onClick={() => onNavigate('identity')}
            actionLabel="Open agent identity to change the mailbox"
          />
        </div>
      </div>

      {/* Activity leads, verification sits beside it as a narrow status column —
          the asymmetry is what stops the screen reading as a stack of slabs. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-3.5 items-start">
        <GlowSurface
          className="lg:col-span-2 overflow-hidden anim-rise anim-stagger"
          style={{ '--i': 5 } as React.CSSProperties}
        >
          <SectionHeader
            as="h2"
            eyebrow="Session"
            title="Activity"
            icon={<Activity className="w-4 h-4 text-ink-4" aria-hidden="true" />}
            className="px-4 sm:px-5 pt-4 sm:pt-5"
            actions={
              <button
                onClick={() => onNavigate('inbox')}
                className="press inline-flex items-center gap-1 py-2 min-h-11 sm:min-h-0 sm:py-1 -my-1 text-xs font-medium text-accent hover:text-accent/80"
              >
                <span>Open inbox</span>
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </button>
            }
          />

          <ol className="px-4 sm:px-5 pt-4 pb-4 sm:pb-5">
            {feed.length > 0
              ? feed.map((msg, i) => {
                  const sender = describeSender(msg.from, contacts, currentDid);
                  const headline = sender.isSelf
                    ? 'You sent a signed message'
                    : `${sender.name} sent you a message`;
                  const tone = !sender.isDid
                    ? 'neutral'
                    : msg.verification?.valid
                    ? 'success'
                    : 'warning';

                  return (
                    <ActivityItem
                      key={msg.seq}
                      index={i}
                      tone={tone}
                      connected={i < feed.length - 1}
                      timestamp={timeAgo(msg.ts)}
                      onClick={() => onNavigate('inbox')}
                      title={
                        <span className="flex items-center gap-2 flex-wrap">
                          {sender.isDid && <AgentIdentityMark did={msg.from} size={18} bare />}
                          <span className="font-medium">{headline}</span>
                          <VerificationSeal
                            verification={msg.verification}
                            isDidSender={sender.isDid}
                          />
                        </span>
                      }
                      detail={<span className="block truncate">{msg.text}</span>}
                    />
                  );
                })
              : systemEvents.map((event, i) => (
                  <ActivityItem
                    key={event.key}
                    index={i}
                    tone={event.tone}
                    live={event.live}
                    connected={i < systemEvents.length - 1}
                    timestamp={event.timestamp}
                    title={event.title}
                    detail={event.detail}
                  />
                ))}
          </ol>

          {feed.length === 0 && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 pl-9 sm:pl-10">
              <button onClick={() => onOpenCompose()} className={QUIET_BTN}>
                <Send className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
                <span>Send the first message</span>
              </button>
            </div>
          )}
        </GlowSurface>

        {/* §12: a status module, not a dashboard. Both figures below are counted
            from the messages actually held — there are no invented rates. */}
        <GlowSurface
          variant="accent"
          className="p-4 sm:p-5 anim-rise anim-stagger"
          style={{ '--i': 6 } as React.CSSProperties}
        >
          <SectionHeader
            as="h2"
            eyebrow="Trust"
            title="Verification"
            icon={<ShieldCheck className="w-4 h-4 text-success" aria-hidden="true" />}
          />

          <p className="mt-3 text-[13px] text-ink-3 leading-relaxed">
            Signed messages are checked before you read them. The check runs in this browser and
            never leaves your machine.
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-surface-2 border border-line px-3 py-2.5">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-4">
                Verified
              </dt>
              <dd className="mt-0.5 font-mono text-xl font-bold text-success">{verifiedCount}</dd>
            </div>
            <div className="rounded-lg bg-surface-2 border border-line px-3 py-2.5">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-4">
                Signed seen
              </dt>
              <dd className="mt-0.5 font-mono text-xl font-bold text-ink">{signed.length}</dd>
            </div>
          </dl>

          {unsignedCount > 0 && (
            <p className="mt-2 text-[11px] text-ink-4">
              {unsignedCount} {unsignedCount === 1 ? 'message' : 'messages'} arrived without a
              signature, so nothing about the sender is proven.
            </p>
          )}

          <Disclosure label="How the check works" variant="inline" className="mt-4">
            <div className="text-xs text-ink-3 leading-relaxed">
              Signature checks run in-page with{' '}
              <span className="font-mono text-ink-2">@noble/ed25519</span> against the canonical
              payload <span className="font-mono text-ink-2">&lt;room&gt;|&lt;nonce&gt;|&lt;text&gt;</span>.
              The signer&apos;s public key is extracted from their{' '}
              <span className="font-mono text-ink-2">did:key</span> identifier, so no key lookup
              service is involved.
            </div>
          </Disclosure>

          <button onClick={() => onNavigate('verifier')} className={`${QUIET_BTN} mt-4 w-full justify-center`}>
            <ShieldCheck className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
            <span>Open verifier</span>
          </button>
        </GlowSurface>
      </div>
    </div>
  );
};
