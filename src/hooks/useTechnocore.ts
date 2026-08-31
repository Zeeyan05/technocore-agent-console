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
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    const start = performance.now();
    try {
      const roomList = await client.listRooms();
      const end = performance.now();

      setRooms(roomList);
      setLatencyMs(Math.round(end - start));
      setConnectionState('connected');
      setErrorReason(null);
      setLastChecked(new Date());
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
    isChecking,
    checkConnection,
  };
}
