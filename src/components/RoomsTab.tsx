'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  Cpu,
  Layers,
  Search,
  RefreshCw,
  Hash,
  Sparkles,
} from 'lucide-react';
import { Identicon } from './Identicon';
import { VerificationSeal, SequenceBadge } from './StatusBadge';
import { formatDidAbbreviated } from '@/lib/crypto/did';
import { verifyMessage } from '@/lib/crypto/verify';
import type { TechnocoreClient } from '@/lib/client';
import type { Identity } from '@/lib/identity';
import type { RoomInfo, TechnocoreMessage } from '@/types/technocore';
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
  const [roomSearch, setRoomSearch] = useState<string>('');

  const lastSeqRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  const fetchRoomMessages = useCallback(async (roomName: string) => {
    setIsLoading(true);
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
          const maxSeq = Math.max(...res.messages.map((m) => m.seq));
          lastSeqRef.current = maxSeq;
        }
      } else {
        if (isMountedRef.current) setMessages([]);
      }
    } catch {
      if (isMountedRef.current) setMessages([]);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    isMountedRef.current = true;
    lastSeqRef.current = 0;
    fetchRoomMessages(selectedRoom);

    return () => {
      isMountedRef.current = false;
    };
  }, [selectedRoom, fetchRoomMessages]);

  const handleCustomRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customRoomInput.trim()) {
      setSelectedRoom(customRoomInput.trim().toLowerCase());
      setCustomRoomInput('');
    }
  };

  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(roomSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#11131b] border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">Mesh Channels</h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                #{selectedRoom}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Operate and broadcast signed communications across public or private mesh rooms
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenCompose(selectedRoom)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-md transition-colors self-start sm:self-auto"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Post to #{selectedRoom}</span>
        </button>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Room Browser & Pinned (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Custom Room Input */}
          <form
            onSubmit={handleCustomRoomSubmit}
            className="p-3 bg-[#11131b] border border-slate-800 rounded-xl flex items-center gap-2"
          >
            <Hash className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              value={customRoomInput}
              onChange={(e) => setCustomRoomInput(e.target.value)}
              placeholder="Enter room name (e.g. sdk-test, d-myroom)..."
              className="flex-1 bg-transparent text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 font-medium"
            >
              Go
            </button>
          </form>

          {/* Room Directory List */}
          <div className="bg-[#11131b] border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[560px]">
            <div className="p-3 border-b border-slate-800 bg-[#0d0f17] flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                placeholder="Filter public channels..."
                className="w-full bg-transparent text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-850">
              {['lobby', 'sdk-test', 'events'].map((seedRoom) => (
                <div
                  key={seedRoom}
                  onClick={() => setSelectedRoom(seedRoom)}
                  className={`p-3 cursor-pointer transition-colors flex items-center justify-between ${
                    selectedRoom === seedRoom ? 'bg-slate-800/80 border-l-2 border-emerald-400' : 'hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono text-xs font-semibold text-slate-200">{seedRoom}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Core channel</span>
                </div>
              ))}

              {filteredRooms.map((r) => (
                <div
                  key={r.room}
                  onClick={() => setSelectedRoom(r.room)}
                  className={`p-3 cursor-pointer transition-colors flex items-center justify-between ${
                    selectedRoom === r.room ? 'bg-slate-800/80 border-l-2 border-emerald-400' : 'hover:bg-slate-900/40'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono text-xs text-slate-200 truncate">{r.name}</span>
                    </div>
                    {r.topic && (
                      <p className="text-[10px] text-slate-500 truncate">{r.topic}</p>
                    )}
                  </div>
                  {r.note_count !== undefined && (
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {r.note_count} msgs
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Room Stream & Message Inspector (8 cols) */}
        <div className="lg:col-span-8 bg-[#11131b] border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[620px]">
          <div className="p-4 border-b border-slate-800 bg-[#0d0f17] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-xs font-bold text-white">#{selectedRoom}</span>
              <span className="text-xs text-slate-500 font-mono">({messages.length} messages loaded)</span>
            </div>
            <button
              onClick={() => fetchRoomMessages(selectedRoom)}
              className="p-1 text-slate-400 hover:text-slate-200 rounded"
              title="Refresh room"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-850 p-2">
            {messages.length === 0 ? (
              <div className="p-16 text-center text-slate-500 text-xs font-mono">
                No messages in #{selectedRoom}. Post a signed message to initiate room activity.
              </div>
            ) : (
              messages.map((msg) => {
                const isDid = msg.from.startsWith('did:key:');
                return (
                  <div
                    key={msg.seq}
                    className="p-3.5 hover:bg-slate-900/50 rounded-lg transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <Identicon did={msg.from} size={28} className="mt-0.5" />
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-slate-200">
                            {isDid ? formatDidAbbreviated(msg.from) : msg.from}
                          </span>
                          <SequenceBadge seq={msg.seq} />
                          <VerificationSeal verification={msg.verification} isDidSender={isDid} />
                        </div>
                        <p className="text-xs text-slate-300 font-mono break-words">
                          {msg.text}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onInspectMessage(msg, selectedRoom)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-400 border border-slate-700 transition-colors shrink-0 self-end sm:self-center"
                    >
                      <Cpu className="w-3 h-3" />
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
