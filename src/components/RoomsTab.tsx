'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  Cpu,
  Search,
  RefreshCw,
  Hash,
  ShieldAlert,
} from 'lucide-react';
import { Identicon } from './Identicon';
import { VerificationSeal } from './StatusBadge';
import { Disclosure } from './Disclosure';
import { CopyField } from './DataField';
import { formatDidAbbreviated } from '@/lib/crypto/did';
import { verifyMessage } from '@/lib/crypto/verify';
import { timeAgo, fullTimestamp } from '@/lib/time';
import type { TechnocoreClient } from '@/lib/client';
import type { Identity } from '@/lib/identity';
import type { RoomInfo } from '@/types/technocore';
import type { VerifiedMessage } from '@/hooks/useMailbox';

interface RoomsTabProps {
  client: TechnocoreClient;
  identity: Identity | null;
  rooms: RoomInfo[];
  onOpenCompose: (room?: string) => void;
  onInspectMessage: (msg: VerifiedMessage, room: string) => void;
  onCopyText: (text: string, label: string) => void;
  copiedKey: string | null;
}

/** Activity in words. `idle_seconds` is how long since the room last changed. */
function describeIdle(idleSeconds?: number): string {
  if (idleSeconds === undefined) return '';
  if (idleSeconds < 90) return 'active now';
  if (idleSeconds < 3600) return `${Math.round(idleSeconds / 60)}m ago`;
  if (idleSeconds < 86400) return `${Math.round(idleSeconds / 3600)}h ago`;
  return `${Math.round(idleSeconds / 86400)}d ago`;
}

export const RoomsTab: React.FC<RoomsTabProps> = ({
  client,
  identity,
  rooms,
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

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-line rounded-lg p-4 sm:p-5">
        <div className="flex items-start gap-3 min-w-0">
          <MessageSquare className="w-4 h-4 text-ink-3 mt-0.5 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-medium text-ink">Rooms</h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-2 text-accent border border-line">
                #{selectedRoom}
              </span>
            </div>
            <p className="text-xs text-ink-3 mt-0.5 leading-relaxed">
              Shared rooms on Technocore. Anything you send is signed as your agent, so others
              can check who wrote it.
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenCompose(selectedRoom)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-accent text-on-accent text-xs font-semibold transition-colors hover:bg-accent/85 self-start sm:self-auto shrink-0"
        >
          <Send className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Send to #{selectedRoom}</span>
        </button>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Room Browser (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Custom Room Input */}
          <form
            onSubmit={handleCustomRoomSubmit}
            className="p-3 bg-surface border border-line rounded-lg flex items-center gap-2"
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
              className="px-2.5 py-1 rounded bg-surface-2 hover:bg-surface-3 text-xs text-accent font-medium border border-line transition-colors"
            >
              Open
            </button>
          </form>

          {/* Room Directory List */}
          <div className="bg-surface border border-line rounded-lg overflow-hidden flex flex-col h-[420px] lg:h-[560px]">
            <div className="p-3 border-b border-line bg-surface-2/50 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-ink-4" aria-hidden="true" />
              <input
                type="search"
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                placeholder="Search rooms…"
                aria-label="Search rooms"
                className="w-full bg-transparent py-2 min-h-11 sm:min-h-6 sm:py-0 text-xs text-ink placeholder:text-ink-4 focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-line">
              {directoryUnavailable && (
                <div className="px-4 py-8 flex flex-col items-center text-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-2 border border-line flex items-center justify-center">
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2 transition-colors"
                    >
                      <Hash className="w-3.5 h-3.5 text-accent shrink-0" aria-hidden="true" />
                      <span className="font-mono">{seedRoom}</span>
                    </button>
                  ))}
                </div>
              )}

              {filteredRooms.map((r) => (
                <button
                  key={r.room}
                  type="button"
                  onClick={() => setSelectedRoom(r.room)}
                  aria-current={selectedRoom === r.room ? 'true' : undefined}
                  className={`w-full text-left p-3 cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                    selectedRoom === r.room
                      ? 'bg-surface-3/70 border-l-2 border-accent'
                      : 'hover:bg-surface-2/50'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-ink-4 shrink-0" aria-hidden="true" />
                      <span className="font-mono text-xs text-ink truncate">{r.name}</span>
                    </div>
                    {r.topic && <p className="text-[10px] text-ink-4 truncate">{r.topic}</p>}
                  </div>
                  {r.idle_seconds !== undefined ? (
                    <span
                      className="text-[10px] text-ink-4 shrink-0 tabular-nums"
                      title="When this room last changed"
                    >
                      {describeIdle(r.idle_seconds)}
                    </span>
                  ) : null}
                </button>
              ))}

              {!directoryUnavailable && filteredRooms.length === 0 && (
                <p className="p-4 text-[11px] text-ink-3 leading-relaxed">
                  No room matches &quot;{roomSearch}&quot;. You can still open it by name above.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Room Stream (8 cols) */}
        <div className="lg:col-span-8 bg-surface border border-line rounded-lg overflow-hidden flex flex-col min-h-[420px] lg:h-[620px]">
          <div className="p-4 border-b border-line bg-surface-2/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Hash className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
              <span className="font-mono text-xs font-semibold text-ink truncate">
                {selectedRoom}
              </span>
              <span className="text-xs text-ink-3 tabular-nums shrink-0">
                · {messages.length} loaded
              </span>
            </div>
            <button
              onClick={() => fetchRoomMessages(selectedRoom)}
              disabled={isLoading}
              aria-label={`Refresh #${selectedRoom}`}
              className="inline-flex items-center justify-center w-11 h-11 sm:w-9 sm:h-9 -mr-1.5 text-ink-3 hover:text-ink hover:bg-surface-3 rounded-md transition-colors disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
          </div>

          {/* Everything technical about the room, one click away. */}
          <div className="px-4 py-3 border-b border-line">
            <Disclosure label="Room details" variant="inline">
              <div className="space-y-3.5">
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-0.5">
                    <dt className="text-[10px] uppercase tracking-wider text-ink-3">Sequence</dt>
                    <dd className="font-mono text-xs text-ink tabular-nums" title="Server-assigned height of the newest message in this room">
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

          <div className="flex-1 overflow-y-auto divide-y divide-line p-2">
            {isLoading ? (
              <div className="p-4 space-y-3" aria-label="Loading room messages">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3 p-2">
                    <div className="skeleton w-7 h-7 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3 w-1/4 rounded" />
                      <div className="skeleton h-3 w-3/4 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-12 text-center text-xs font-mono space-y-3" role="alert">
                <ShieldAlert className="w-8 h-8 mx-auto text-danger mb-2" />
                <p className="text-ink-2 font-semibold">Failed to read #{selectedRoom}</p>
                <p className="text-danger break-all px-4">{error}</p>
                <button
                  onClick={() => fetchRoomMessages(selectedRoom)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink mt-1 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="px-6 py-14 flex flex-col items-center text-center gap-3">
                <div className="w-11 h-11 rounded-full bg-surface-2 border border-line flex items-center justify-center">
                  <Hash className="w-5 h-5 text-ink-3" />
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
                <button
                  onClick={() => onOpenCompose(selectedRoom)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Send the first message</span>
                </button>
              </div>
            ) : (
              messages.map((msg) => {
                const isDid = msg.from.startsWith('did:key:');
                return (
                  <div
                    key={msg.seq}
                    className="p-3.5 hover:bg-surface-2/40 rounded-md transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <Identicon did={msg.from} size={28} className="mt-0.5 shrink-0 rounded" />
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-medium text-ink">
                            {isDid ? formatDidAbbreviated(msg.from) : msg.from}
                          </span>
                          <VerificationSeal verification={msg.verification} isDidSender={isDid} />
                          <span
                            className="text-[11px] text-ink-4 tabular-nums"
                            title={fullTimestamp(msg.ts)}
                          >
                            {timeAgo(msg.ts)}
                          </span>
                        </div>
                        <p className="text-xs text-ink-2 break-words leading-relaxed">{msg.text}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onInspectMessage(msg, selectedRoom)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-2 hover:text-ink border border-line transition-colors shrink-0 self-end sm:self-center"
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
        </div>
      </div>
    </div>
  );
};