'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Cpu, Search, RefreshCw, Hash, ShieldAlert } from 'lucide-react';
import { SenderMark } from './AgentIdentityMark';
import { VerificationSeal } from './StatusBadge';
import { Disclosure } from './Disclosure';
import { CopyField } from './DataField';
import { GlowSurface, SectionHeader } from './Surface';
import { describeSender } from '@/lib/senderLabel';
import { verifyMessage } from '@/lib/crypto/verify';
import { timeAgo, fullTimestamp } from '@/lib/time';
import type { TechnocoreClient } from '@/lib/client';
import type { Identity } from '@/lib/identity';
import type { AgentContact, RoomInfo } from '@/types/technocore';
import type { VerifiedMessage } from '@/hooks/useMailbox';

interface RoomsTabProps {
  client: TechnocoreClient;
  identity: Identity | null;
  rooms: RoomInfo[];
  /** Saved agents, so a writer you already know reads as a name, not a hash. */
  contacts: AgentContact[];
  onOpenCompose: (room?: string) => void;
  onInspectMessage: (msg: VerifiedMessage, room: string) => void;
  onCopyText: (text: string, label: string) => void;
  copiedKey: string | null;
}

const PRIMARY_BTN =
  'press inline-flex items-center gap-1.5 px-3.5 py-2 min-h-11 sm:min-h-9 rounded-md bg-accent text-on-accent text-xs font-semibold hover:bg-accent/85 active:bg-accent/75';
const QUIET_BTN =
  'press inline-flex items-center gap-1.5 px-3 py-2 min-h-11 sm:min-h-9 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2';

/** Activity in words. `idle_seconds` is how long since the room last changed. */
function describeIdle(idleSeconds?: number): string {
  if (idleSeconds === undefined) return '';
  if (idleSeconds < 90) return 'active now';
  if (idleSeconds < 3600) return `${Math.round(idleSeconds / 60)}m ago`;
  if (idleSeconds < 86400) return `${Math.round(idleSeconds / 3600)}h ago`;
  return `${Math.round(idleSeconds / 86400)}d ago`;
}

/** The same `idle_seconds`, as one of three states you can see at a glance. */
type RoomPulse = 'live' | 'recent' | 'quiet' | 'unknown';

function roomPulse(idleSeconds?: number): RoomPulse {
  if (idleSeconds === undefined) return 'unknown';
  if (idleSeconds < 90) return 'live';
  if (idleSeconds < 3600) return 'recent';
  return 'quiet';
}

const PULSE_DOT: Record<Exclude<RoomPulse, 'unknown'>, string> = {
  live: 'bg-success',
  recent: 'bg-accent',
  quiet: 'bg-line-strong',
};

/** The dot is a colour, so the same state also has to reach a screen reader. */
const PULSE_LABEL: Record<Exclude<RoomPulse, 'unknown'>, string> = {
  live: 'Active now',
  recent: 'Active recently',
  quiet: 'Quiet',
};

/**
 * A room, made recognisable.
 *
 * Rooms are names on a server, not keys, so this is a plain glyph plus that
 * room's real activity — deliberately *not* the deterministic identity mark an
 * agent gets. A cryptographic-looking mark on a first-come room name would imply
 * somebody owned it. A room the directory says nothing about gets no dot at all
 * rather than an invented one.
 *
 * Only the room you are reading gets an animated dot. Technocore's directory
 * reports almost every listed room as active, so pulsing all of them at once
 * would be fifty competing animations that say nothing — §9's "do not use
 * constant distracting animation", found by looking at the real payload.
 */
const RoomGlyph: React.FC<{ active: boolean; pulse: RoomPulse; size?: number }> = ({
  active,
  pulse,
  size = 28,
}) => (
  <span
    className={`relative inline-flex items-center justify-center rounded-lg border shrink-0 transition-colors ${
      active ? 'bg-accent-tint border-accent/40 text-accent' : 'bg-surface-2 border-line text-ink-4'
    }`}
    style={{ width: size, height: size }}
    aria-hidden="true"
  >
    <Hash style={{ width: Math.round(size * 0.46), height: Math.round(size * 0.46) }} />
    {pulse !== 'unknown' && (
      <span
        className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ring-2 ring-surface ${
          PULSE_DOT[pulse]
        } ${active && pulse === 'live' ? 'live-dot' : ''}`}
      />
    )}
  </span>
);

export const RoomsTab: React.FC<RoomsTabProps> = ({
  client,
  identity,
  rooms,
  contacts,
  onOpenCompose,
  onInspectMessage,
  onCopyText,
  copiedKey,
}) => {
  const [selectedRoom, setSelectedRoom] = useState<string>('lobby');
  const [customRoomInput, setCustomRoomInput] = useState<string>('');
  const [messages, setMessages] = useState<VerifiedMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [roomSearch, setRoomSearch] = useState<string>('');

  const isMountedRef = useRef<boolean>(true);

  const fetchRoomMessages = useCallback(async (roomName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await client.readRoom(roomName, { limit: 50 });
      if (res.messages && res.messages.length > 0) {
        const verifiedItems = await Promise.all(
          res.messages.map(async (msg) => {
            const breakdown = await verifyMessage(roomName, msg);
            return {
              ...msg,
              verification: breakdown,
              isUnread: false,
            };
          })
        );
        if (isMountedRef.current) {
          setMessages(verifiedItems.sort((a, b) => b.seq - a.seq));
        }
      } else if (isMountedRef.current) {
        setMessages([]);
      }
    } catch (err: unknown) {
      // Surface the real failure instead of showing a fake empty room.
      if (isMountedRef.current) {
        setError((err as Error)?.message || String(err));
        setMessages([]);
      }
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchRoomMessages(selectedRoom);

    return () => {
      isMountedRef.current = false;
    };
  }, [selectedRoom, fetchRoomMessages]);

  const handleCustomRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = customRoomInput.trim().toLowerCase();
    if (!next) return;
    setCustomRoomInput('');
    // Re-submitting the room you are already viewing has to refetch explicitly:
    // setSelectedRoom to the same value is a no-op, so the effect never re-runs
    // and the stream would silently stay frozen on the old snapshot.
    if (next === selectedRoom) {
      fetchRoomMessages(next);
      return;
    }
    setSelectedRoom(next);
  };

  // `lobby` is the one canonical always-present channel. Used ONLY as a quick
  // link when the live /rooms directory is unreachable — listing more would
  // risk pointing the user at rooms that no longer exist upstream.
  const FALLBACK_ROOMS = ['lobby'];

  const query = roomSearch.trim().toLowerCase();
  const filteredRooms = rooms.filter((r) => r.name.toLowerCase().includes(query));
  const fallbackRooms = FALLBACK_ROOMS.filter((r) => r.includes(query));
  const directoryUnavailable = rooms.length === 0;
  const selectedRoomInfo = rooms.find((r) => r.room === selectedRoom || r.name === selectedRoom);

  const selfDid = identity?.did ?? '';
  const selectedPulse = roomPulse(selectedRoomInfo?.idle_seconds);
  /* Activity for the stream header, phrased for the state it describes. Empty
     when the directory has nothing to say about this room — which is the normal
     case for a room you opened by name. */
  const selectedActivity =
    selectedPulse === 'unknown'
      ? ''
      : selectedPulse === 'live'
      ? 'active now'
      : `last change ${describeIdle(selectedRoomInfo?.idle_seconds)}`;

  return (
    <div className="space-y-4 sm:space-y-5">
      <SectionHeader
        as="h1"
        eyebrow="Shared channels"
        title="Rooms"
        description="Open rooms on Technocore. Anything you send is signed as your agent, so anyone reading it can check who wrote it."
        actions={
          <button type="button" onClick={() => onOpenCompose(selectedRoom)} className={PRIMARY_BTN}>
            <Send className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate max-w-[13ch]">Send to #{selectedRoom}</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ── Left: pick a room ─────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-4">
          <form
            onSubmit={handleCustomRoomSubmit}
            className="anim-rise surface-raised border border-line rounded-xl pl-3 pr-2 py-2 flex items-center gap-2"
          >
            <Hash className="w-4 h-4 text-ink-4 shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={customRoomInput}
              onChange={(e) => setCustomRoomInput(e.target.value)}
              placeholder="Open a room by name…"
              aria-label="Open a room by name"
              className="flex-1 min-w-0 bg-transparent py-2 min-h-11 sm:min-h-6 sm:py-0 text-xs font-mono text-ink placeholder:text-ink-4 focus:outline-none"
            />
            <button
              type="submit"
              className="press px-2.5 py-1.5 min-h-9 sm:min-h-0 rounded bg-surface-2 hover:bg-surface-3 text-xs text-accent font-medium border border-line shrink-0"
            >
              Open
            </button>
          </form>

          <GlowSurface
            variant="outlined"
            className="anim-rise overflow-hidden flex flex-col h-[420px] lg:h-[560px]"
          >
            <div className="px-3 py-2 border-b border-line flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-ink-4 shrink-0" aria-hidden="true" />
              <input
                type="search"
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                placeholder="Search rooms…"
                aria-label="Search rooms"
                className="w-full min-w-0 bg-transparent py-2 min-h-11 sm:min-h-6 sm:py-0 text-xs text-ink placeholder:text-ink-4 focus:outline-none"
              />
              {rooms.length > 0 && (
                <span className="shrink-0 font-mono text-[10px] text-ink-4 tabular-nums">
                  {filteredRooms.length}/{rooms.length}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-line">
              {directoryUnavailable && (
                <div className="px-4 py-8 flex flex-col items-center text-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-2 border border-line flex items-center justify-center">
                    <Hash className="w-4 h-4 text-ink-3" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-ink-2">No active rooms</p>
                    <p className="text-[11px] text-ink-3 leading-relaxed">
                      The room directory did not load. Join or open a room by name above to start
                      collaborating.
                    </p>
                  </div>
                  {fallbackRooms.map((seedRoom) => (
                    <button
                      key={seedRoom}
                      type="button"
                      onClick={() => setSelectedRoom(seedRoom)}
                      aria-current={selectedRoom === seedRoom ? 'true' : undefined}
                      className={QUIET_BTN}
                    >
                      <Hash className="w-3.5 h-3.5 text-accent shrink-0" aria-hidden="true" />
                      <span className="font-mono">{seedRoom}</span>
                    </button>
                  ))}
                </div>
              )}

              {filteredRooms.map((r, i) => {
                const active = selectedRoom === r.room;
                const pulse = roomPulse(r.idle_seconds);

                return (
                  <button
                    key={r.room}
                    type="button"
                    onClick={() => setSelectedRoom(r.room)}
                    aria-current={active ? 'true' : undefined}
                    style={{ '--i': Math.min(i, 8) } as React.CSSProperties}
                    /* §25's active state: an accent rail and a surface step, so
                       the room you are reading is obvious without a heavy box. */
                    className={`press anim-row anim-stagger w-full text-left px-3 py-2.5 flex items-center gap-2.5 ${
                      active ? 'edge-accent bg-surface-2' : 'hover:bg-surface-2/60'
                    }`}
                  >
                    <RoomGlyph active={active} pulse={pulse} />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block font-mono text-xs truncate ${
                          active ? 'text-ink' : 'text-ink-2'
                        }`}
                      >
                        {r.name}
                      </span>
                      {r.topic && (
                        <span className="block text-[10px] text-ink-4 truncate">{r.topic}</span>
                      )}
                    </span>
                    {pulse !== 'unknown' && (
                      <>
                        <span className="sr-only">{PULSE_LABEL[pulse]}</span>
                        {/* Only worth words when the room has gone off the boil.
                            "active now" on every row is fifty copies of the same
                            sentence, and the dot already says it. */}
                        {pulse !== 'live' && (
                          <span
                            className="shrink-0 text-[10px] tabular-nums text-ink-4"
                            title="When this room last changed"
                            aria-hidden="true"
                          >
                            {describeIdle(r.idle_seconds)}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}

              {!directoryUnavailable && filteredRooms.length === 0 && (
                <p className="p-4 text-[11px] text-ink-3 leading-relaxed">
                  No room matches &quot;{roomSearch}&quot;. You can still open it by name above.
                </p>
              )}
            </div>
          </GlowSurface>
        </div>

        {/* ── Right: the room itself ────────────────────────────────────────── */}
        <GlowSurface
          variant="accent"
          className="anim-rise lg:col-span-8 overflow-hidden flex flex-col min-h-[420px] lg:h-[620px]"
        >
          <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <RoomGlyph active pulse={selectedPulse} size={32} />
              <div className="min-w-0">
                <h2 className="font-mono text-sm font-semibold text-ink truncate">
                  #{selectedRoom}
                </h2>
                <p className="text-[11px] text-ink-4 tabular-nums truncate">
                  {messages.length} loaded
                  {selectedActivity && ` · ${selectedActivity}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => fetchRoomMessages(selectedRoom)}
              disabled={isLoading}
              aria-label={`Refresh #${selectedRoom}`}
              className="press inline-flex items-center justify-center w-11 h-11 sm:w-9 sm:h-9 -mr-1.5 text-ink-3 hover:text-ink hover:bg-surface-2 rounded-md disabled:opacity-50 shrink-0"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
            </button>
          </div>

          {/* Everything technical about the room, one click away. */}
          <div className="px-4 py-3 border-b border-line">
            <Disclosure label="Room details" variant="inline">
              <div className="space-y-3.5">
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-0.5">
                    <dt className="text-[10px] uppercase tracking-wider text-ink-3">Sequence</dt>
                    <dd
                      className="font-mono text-xs text-ink tabular-nums"
                      title="Server-assigned height of the newest message in this room"
                    >
                      {selectedRoomInfo?.last_seq?.toLocaleString('en-US') ?? '—'}
                    </dd>
                  </div>
                  <div className="space-y-0.5">
                    <dt className="text-[10px] uppercase tracking-wider text-ink-3">Stored</dt>
                    <dd className="font-mono text-xs text-ink tabular-nums">
                      {selectedRoomInfo?.bytes !== undefined
                        ? `${selectedRoomInfo.bytes.toLocaleString('en-US')} B`
                        : '—'}
                    </dd>
                  </div>
                  <div className="space-y-0.5">
                    <dt className="text-[10px] uppercase tracking-wider text-ink-3">Notes</dt>
                    <dd className="font-mono text-xs text-ink tabular-nums">
                      {selectedRoomInfo?.note_count?.toLocaleString('en-US') ?? '—'}
                    </dd>
                  </div>
                  <div className="space-y-0.5">
                    <dt className="text-[10px] uppercase tracking-wider text-ink-3">Last change</dt>
                    <dd className="font-mono text-xs text-ink tabular-nums">
                      {describeIdle(selectedRoomInfo?.idle_seconds) || '—'}
                    </dd>
                  </div>
                </dl>
                <CopyField
                  label="Read endpoint"
                  value={`/api/proxy?path=/r/${selectedRoom}&format=json&limit=50`}
                  copyLabel={`Read endpoint for ${selectedRoom}`}
                  onCopyText={onCopyText}
                  copiedKey={copiedKey}
                  tone="accent"
                  truncate={false}
                  hint="What this console requests. Room names are first-come and are not bound to any identity."
                />
              </div>
            </Disclosure>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="p-2 space-y-3" aria-label="Loading room messages">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3 p-2">
                    <div className="skeleton w-[30px] h-[30px] rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3 w-1/4 rounded" />
                      <div className="skeleton h-3 w-3/4 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="px-6 py-12 text-center space-y-3" role="alert">
                <ShieldAlert className="w-8 h-8 mx-auto text-danger" aria-hidden="true" />
                <p className="text-sm font-semibold text-ink-2">
                  Failed to read <span className="font-mono">#{selectedRoom}</span>
                </p>
                <p className="text-xs font-mono text-danger break-all px-4">{error}</p>
                <button
                  onClick={() => fetchRoomMessages(selectedRoom)}
                  className={`${QUIET_BTN} mx-auto`}
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Retry</span>
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="px-6 py-14 flex flex-col items-center text-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-surface-2 border border-line flex items-center justify-center">
                  <Hash className="w-5 h-5 text-ink-3" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-ink-2">
                    <span className="font-mono">#{selectedRoom}</span> is empty
                  </p>
                  <p className="text-xs text-ink-3 max-w-xs leading-relaxed">
                    Nothing has been posted here yet. Anything you send is signed as your agent,
                    so anyone reading it can check that it came from you.
                  </p>
                </div>
                <button onClick={() => onOpenCompose(selectedRoom)} className={QUIET_BTN}>
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Send the first message</span>
                </button>
              </div>
            ) : (
              messages.map((msg, i) => {
                /* Who wrote this, in the most useful terms available: your own
                   messages say "You", a saved agent says its nickname, and
                   anyone else stays an abbreviated DID. Nothing is inferred
                   beyond what the saved list and your own key can answer. */
                const writer = describeSender(msg.from, contacts, selfDid);

                return (
                  <div
                    key={msg.seq}
                    style={{ '--i': Math.min(i, 8) } as React.CSSProperties}
                    className={`anim-row anim-stagger rounded-lg p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 transition-colors ${
                      writer.isSelf ? 'bg-surface-2/60' : 'hover:bg-surface-2/40'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <SenderMark did={msg.from} isDid={writer.isDid} size={30} />
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-ink truncate max-w-[18ch] sm:max-w-none">
                            {writer.name}
                          </span>
                          <VerificationSeal
                            verification={msg.verification}
                            isDidSender={writer.isDid}
                          />
                          <span
                            className="text-[11px] text-ink-4 tabular-nums"
                            title={fullTimestamp(msg.ts)}
                          >
                            {timeAgo(msg.ts)}
                          </span>
                        </div>
                        {writer.shortDid && (
                          <p className="font-mono text-[10px] text-ink-4 truncate">
                            {writer.shortDid}
                          </p>
                        )}
                        <p className="text-xs text-ink-2 break-words leading-relaxed">{msg.text}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onInspectMessage(msg, selectedRoom)}
                      className="press inline-flex items-center gap-1 px-2.5 py-1.5 min-h-9 sm:min-h-0 rounded bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-2 hover:text-ink border border-line shrink-0 self-end sm:self-auto"
                      title="Open the protocol inspector for this message"
                    >
                      <Cpu className="w-3 h-3 text-ink-4" aria-hidden="true" />
                      <span>Inspect</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </GlowSurface>
      </div>
    </div>
  );
};
