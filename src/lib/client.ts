/**
 * Technocore Client (Browser Client-Side Service)
 *
 * Dispatches requests via the local API proxy (/api/proxy) to bypass browser CORS.
 * Signs messages locally in browser using Identity before transmission.
 */

import { parseTechnocoreJson } from './crypto/encode';
import { sweep } from './crypto/sweep';
import { MAX_MESSAGE_CHARS } from '@/types/technocore';
import type { Identity } from './identity';
import type { RoomResponse, RoomInfo, TechnocoreMessage } from '@/types/technocore';

export interface ReadRoomOptions {
  since?: number;
  limit?: number;
  wait?: number;
  signal?: AbortSignal;
}

export interface ClientConfig {
  proxyEndpoint?: string;
}

export class TechnocoreClient {
  readonly proxyEndpoint: string;

  constructor(config: ClientConfig = {}) {
    this.proxyEndpoint = config.proxyEndpoint ?? '/api/proxy';
  }

  /**
   * Fetch list of public active rooms.
   */
  async listRooms(): Promise<RoomInfo[]> {
    const url = `${this.proxyEndpoint}?path=${encodeURIComponent('/rooms')}&format=json`;
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to list rooms (${res.status}): ${errText}`);
    }
    const data = await res.json();
    const rawList = Array.isArray(data)
      ? data
      : data && Array.isArray(data.rooms)
      ? data.rooms
      : [];

    return rawList.map((item: Record<string, unknown>) => {
      const roomName = String(item['room'] ?? item['name'] ?? '');
      return {
        room: roomName,
        name: roomName,
        topic: (item['topic'] as string) ?? null,
        last_seq: typeof item['last_seq'] === 'number' ? item['last_seq'] : undefined,
        bytes: typeof item['bytes'] === 'number' ? item['bytes'] : undefined,
        idle_seconds: typeof item['idle_seconds'] === 'number' ? item['idle_seconds'] : undefined,
        note_count: typeof item['note_count'] === 'number' ? item['note_count'] : undefined,
      };
    });
  }

  /**
   * Read messages from a room with cursor options.
   */
  async readRoom(room: string, options: ReadRoomOptions = {}): Promise<RoomResponse> {
    const params = new URLSearchParams({
      path: `/r/${encodeURIComponent(room)}`,
      format: 'json',
    });

    if (options.since !== undefined) params.set('since', String(options.since));
    if (options.limit !== undefined) params.set('limit', String(options.limit));
    if (options.wait !== undefined) params.set('wait', String(options.wait));

    const url = `${this.proxyEndpoint}?${params.toString()}`;
    const res = await fetch(url, { signal: options.signal });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to read room '${room}' (${res.status}): ${errText}`);
    }

    const rawText = await res.text();
    return parseTechnocoreJson<RoomResponse>(rawText);
  }

  /**
   * Send a cryptographically signed message to a room.
   * Signature and nonce generation are computed locally in the browser.
   */
  async sendSignedMessage(
    room: string,
    identity: Identity,
    text: string
  ): Promise<RoomResponse> {
    const sweptText = sweep(text);
    if (!sweptText) {
      throw new Error('Message text cannot be empty after single-line sweep');
    }
    if (sweptText.length > MAX_MESSAGE_CHARS) {
      throw new Error(`Message exceeds maximum limit of ${MAX_MESSAGE_CHARS} characters`);
    }

    // Step 1: Sign locally in browser
    const signResult = await identity.signMessage(room, sweptText);

    // Step 2: Post signed payload
    const params = new URLSearchParams({
      path: `/r/${encodeURIComponent(room)}`,
      format: 'json',
    });

    const url = `${this.proxyEndpoint}?${params.toString()}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        did: identity.did,
        sig: signResult.sig,
        nonce: signResult.nonce,
        text: signResult.sweptText,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to send signed message (${res.status}): ${errText}`);
    }

    const rawText = await res.text();
    return parseTechnocoreJson<RoomResponse>(rawText);
  }

  /**
   * Send an anonymous message with self-asserted nickname.
   */
  async sendAnonymousMessage(
    room: string,
    nick: string,
    text: string
  ): Promise<RoomResponse> {
    const sweptText = sweep(text);
    if (!sweptText) {
      throw new Error('Message text cannot be empty after single-line sweep');
    }

    const params = new URLSearchParams({
      path: `/r/${encodeURIComponent(room)}`,
      format: 'json',
    });

    const url = `${this.proxyEndpoint}?${params.toString()}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: nick,
        text: sweptText,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to send anonymous message (${res.status}): ${errText}`);
    }

    const rawText = await res.text();
    return parseTechnocoreJson<RoomResponse>(rawText);
  }

  /**
   * Export room raw snapshot JSONL.
   */
  async exportRoom(room: string): Promise<TechnocoreMessage[]> {
    const params = new URLSearchParams({
      path: `/r/${encodeURIComponent(room)}/export`,
    });

    const url = `${this.proxyEndpoint}?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to export room (${res.status}): ${errText}`);
    }

    const rawJsonl = await res.text();
    const messages: TechnocoreMessage[] = [];
    const lines = rawJsonl.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        try {
          messages.push(parseTechnocoreJson<TechnocoreMessage>(trimmed));
        } catch {
          // ignore unparseable lines
        }
      }
    }
    return messages;
  }
}
