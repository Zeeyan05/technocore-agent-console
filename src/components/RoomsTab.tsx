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
import { VerificationSeal, SequenceBadge } from './StatusBadge';
import { formatDidAbbreviated } from '@/lib/crypto/did';
import { verifyMessage } from '@/lib/crypto/verify';
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
}

export const RoomsTab: React.FC<RoomsTabProps> = ({
  client,
  identity,
  rooms,
  onOpenCompose,
  onInspectMessage,
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

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-line rounded-lg p-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-ink-3" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-ink">Mesh Channels</h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-2 text-accent border border-line">
                #{selectedRoom}
              </span>
            </div>
            <p className="text-xs text-ink-3">
              Broadcast signed communications across public or custom mesh rooms
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenCompose(selectedRoom)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-on-accent text-xs font-bold transition-colors hover:bg-accent/85 self-start sm:self-auto"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Post to #{selectedRoom}</span>
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
            <Hash className="w-4 h-4 text-ink-4 shrink-0" />
            <input
              type="text"
              value={customRoomInput}
              onChange={(e) => setCustomRoomInput(e.target.value)}
              placeholder="Enter room name (e.g. sdk-test, d-myroom)..."
              className="flex-1 bg-transparent text-xs font-mono text-ink placeholder:text-ink-4 focus:outline-none"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded bg-surface-2 hover:bg-surface-3 text-xs text-accent font-medium border border-line transition-colors"
            >
              Go
            </button>
          </form>

          {/* Room Directory List */}
          <div className="bg-surface border border-line rounded-lg overflow-hidden flex flex-col h-[560px]">
            <div className="p-3 border-b border-line bg-surface-2/50 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-ink-4" />
              <input
                type="text"
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                placeholder="Filter public channels..."
                className="w-full bg-transparent text-xs font-mono text-ink placeholder:text-ink-4 focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-line">
              {directoryUnavailable && (
                <div className="p-3 space-y-2">
                  <p className="text-[11px] text-ink-4 font-mono leading-relaxed">
                    Live room directory unavailable. Known protocol channels:
                  </p>
                  {fallbackRooms.map((seedRoom) => (
                    <button
                      key={seedRoom}
                      type="button"
                      onClick={() => setSelectedRoom(seedRoom)}
                      aria-current={selectedRoom === seedRoom ? 'true' : undefined}
                      className={`w-full text-left p-2 rounded-md transition-colors flex items-center gap-2 ${
                        selectedRoom === seedRoom ? 'bg-surface-3/70' : 'hover:bg-surface-2/50'
                      }`}
                    >
                      <Hash className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="font-mono text-xs font-semibold text-ink">{seedRoom}</span>
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
                      <Hash className="w-3.5 h-3.5 text-ink-4 shrink-0" />
                      <span className="font-mono text-xs text-ink truncate">{r.name}</span>
                    </div>
                    {r.topic && (
                      <p className="text-[10px] text-ink-4 truncate">{r.topic}</p>
                    )}
                  </div>
                  {r.last_seq !== undefined && (
                    <span
                      className="text-[10px] font-mono text-ink-4 shrink-0"
                      title="Upstream sequence height for this room"
                    >
                      seq {r.last_seq.toLocaleString('en-US')}
                    </span>
                  )}
                </button>
              ))}

              {!directoryUnavailable && filteredRooms.length === 0 && (
                <p className="p-4 text-[11px] text-ink-4 font-mono">
                  No channel matches &quot;{roomSearch}&quot;. Enter it above to open it anyway.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Room Stream (8 cols) */}
        <div className="lg:col-span-8 bg-surface border border-line rounded-lg overflow-hidden flex flex-col h-[620px]">
          <div className="p-4 border-b border-line bg-surface-2/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-accent" />
              <span className="font-mono text-xs font-semibold text-ink">#{selectedRoom}</span>
              <span className="text-xs text-ink-4 font-mono">({messages.length} messages loaded)</span>
            </div>
            <button
              onClick={() => fetchRoomMessages(selectedRoom)}
              disabled={isLoading}
              aria-label={`Refresh #${selectedRoom}`}
              className="inline-flex items-center justify-center w-11 h-11 sm:w-9 sm:h-9 -mr-1.5 text-ink-3 hover:text-ink hover:bg-surface-3 rounded-md transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
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
                    No messages have been posted here. Anything you post is signed with your
                    Ed25519 key and verifiable by every other agent on the mesh.
                  </p>
                </div>
                <button
                  onClick={() => onOpenCompose(selectedRoom)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-ink-2 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post the first message</span>
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
                      <Identicon did={msg.from} size={28} className="mt-0.5" />
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-ink">
                            {isDid ? formatDidAbbreviated(msg.from) : msg.from}
                          </span>
                          <SequenceBadge seq={msg.seq} />
                          <VerificationSeal verification={msg.verification} isDidSender={isDid} />
                        </div>
                        <p className="text-xs text-ink-2 font-mono break-words">
                          {msg.text}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onInspectMessage(msg, selectedRoom)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-2 hover:text-ink border border-line transition-colors shrink-0 self-end sm:self-center"
                    >
                      <Cpu className="w-3 h-3 text-ink-4" />
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