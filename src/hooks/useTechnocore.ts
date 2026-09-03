'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TechnocoreClient } from '@/lib/client';
import type { ConnectionState, RoomInfo } from '@/types/technocore';

export function useTechnocore() {
  const [client] = useState(() => new TechnocoreClient());
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      // Liveness is measured on /healthz (fast when warm ~0.2s). /rooms is
      // intentionally NOT the probe: it can take 25-30s cold, which would
      // false-fail the connection state.
      const latency = await client.checkHealth();
      setLatencyMs(latency);
      setConnectionState('connected');
      setErrorReason(null);
      setLastChecked(new Date());

      // Best-effort room list refresh. A failure here must NOT flip the
      // connection state — room listing slowness is not a connectivity fault.
      try {
        const roomList = await client.listRooms();
        setRooms(roomList);
      } catch {
        // keep previously known rooms; rooms surface their own error state
      }

      // Best-effort real protocol version. Same rule: never affects liveness.
      try {
        const cfg = await client.readConfig();
        if (cfg.version) setServerVersion(cfg.version);
      } catch {
        // leave null — the UI omits the version rather than guessing one
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setConnectionState('error');
      setErrorReason(msg);
      setLatencyMs(null);
      setLastChecked(new Date());
    } finally {
      setIsChecking(false);
    }
  }, [client]);

  // Periodic heartbeat / connectivity poll every 30 seconds
  useEffect(() => {
    checkConnection();

    const interval = setInterval(() => {
      checkConnection();
    }, 30000);

    return () => {
      clearInterval(interval);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [checkConnection]);

  return {
    client,
    connectionState,
    latencyMs,
    lastChecked,
    errorReason,
    rooms,
    serverVersion,
    isChecking,
    checkConnection,
  };
}
