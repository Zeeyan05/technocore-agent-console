'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TechnocoreClient } from '@/lib/client';
import { verifyMessage } from '@/lib/crypto/verify';
import type { Identity } from '@/lib/identity';
import type { TechnocoreMessage, VerificationBreakdown } from '@/types/technocore';

export interface VerifiedMessage extends TechnocoreMessage {
  readonly verification: VerificationBreakdown;
  readonly isUnread: boolean;
}

export function useMailbox(
  client: TechnocoreClient,
  identity: Identity | null,
  customRoom?: string
) {
  const activeRoom = customRoom || identity?.mailboxRoom || 'lobby';
  const [messages, setMessages] = useState<VerifiedMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSeq, setLastSeq] = useState<number>(0);
  const [readSeqs, setReadSeqs] = useState<Set<number>>(() => new Set());

  const lastSeqRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef<boolean>(true);

  // Mark a message as read
  const markAsRead = useCallback((seq: number) => {
    setReadSeqs((prev) => {
      if (prev.has(seq)) return prev;
      const next = new Set(prev);
      next.add(seq);
      return next;
    });
    setMessages((prev) =>
      prev.map((m) => (m.seq === seq ? { ...m, isUnread: false } : m))
    );
  }, []);

  // Mark all messages as read
  const markAllAsRead = useCallback(() => {
    setReadSeqs((prev) => {
      const next = new Set(prev);
      messages.forEach((m) => next.add(m.seq));
      return next;
    });
    setMessages((prev) => prev.map((m) => ({ ...m, isUnread: false })));
  }, [messages]);

  // Initial fetch and continuous long-polling loop
  useEffect(() => {
    mountedRef.current = true;
    lastSeqRef.current = 0;
    setMessages([]);
    setIsLoading(true);
    setError(null);

    let isActive = true;

    async function pollLoop() {
      while (isActive && mountedRef.current) {
        try {
          const controller = new AbortController();
          abortControllerRef.current = controller;

          setIsPolling(true);
          const currentSince = lastSeqRef.current > 0 ? lastSeqRef.current : undefined;

          const response = await client.readRoom(activeRoom, {
            since: currentSince,
            limit: 50,
            wait: currentSince !== undefined ? 5 : undefined,
            signal: controller.signal,
          });

          if (!mountedRef.current || !isActive) break;

          if (response.messages && response.messages.length > 0) {
            // Verify each new message offline
            const verifiedItems: VerifiedMessage[] = await Promise.all(
              response.messages.map(async (msg) => {
                const breakdown = await verifyMessage(activeRoom, msg);
                return {
                  ...msg,
                  verification: breakdown,
                  isUnread: !readSeqs.has(msg.seq),
                };
              })
            );

            setMessages((prev) => {
              const existingMap = new Map(prev.map((m) => [m.seq, m]));
              verifiedItems.forEach((vm) => existingMap.set(vm.seq, vm));
              const combined = Array.from(existingMap.values()).sort((a, b) => b.seq - a.seq);
              return combined;
            });

            const maxSeq = Math.max(...response.messages.map((m) => m.seq));
            if (maxSeq > lastSeqRef.current) {
              lastSeqRef.current = maxSeq;
              setLastSeq(maxSeq);
            }
          } else if (response.last_seq > lastSeqRef.current) {
            lastSeqRef.current = response.last_seq;
            setLastSeq(response.last_seq);
          }

          setIsLoading(false);
          setError(null);
        } catch (err: unknown) {
          if (!mountedRef.current || !isActive) break;
          if ((err as Error)?.name !== 'AbortError') {
            setError((err as Error)?.message || String(err));
            // Backoff briefly on error before retrying
            await new Promise((r) => setTimeout(r, 4000));
          }
        } finally {
          setIsPolling(false);
        }

        // Brief delay between non-waiting loops
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    pollLoop();

    return () => {
      isActive = false;
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [client, activeRoom]);

  // Send message helper
  const sendMessage = useCallback(
    async (text: string, recipientRoom?: string) => {
      if (!identity) throw new Error('Identity not connected');
      const target = recipientRoom || activeRoom;
      return client.sendSignedMessage(target, identity, text);
    },
    [client, identity, activeRoom]
  );

  const unreadCount = messages.filter((m) => m.isUnread).length;

  return {
    activeRoom,
    messages,
    isLoading,
    isPolling,
    error,
    lastSeq,
    unreadCount,
    markAsRead,
    markAllAsRead,
    sendMessage,
  };
}
