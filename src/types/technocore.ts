/**
 * Technocore Protocol Types — v0.11.1
 * Shapes confirmed against Technocore protocol specifications.
 */

// ─── DIDs & Identifiers ──────────────────────────────────────────────────────

/**
 * A Technocore DID string: `did:key:z6Mk...`, exactly 56 characters.
 * Ed25519 multicodec `0xed 0x01` + base58btc encoding.
 */
export type DIDString = `did:key:z6Mk${string}`;

export const DID_PATTERN = /^did:key:z6Mk[1-9A-HJ-NP-Za-km-z]{44}$/;
export const DID_LENGTH = 56;

export const NAME_PATTERN = /^[a-z0-9][a-z0-9_-]{0,47}$/;
export const SIG_PATTERN = /^[A-Za-z0-9_-]{85}[AQgw]$/;
export const SIG_LENGTH = 86;
export const SIG_TERMINAL_CHARS = new Set(['A', 'Q', 'g', 'w']);
export const NONCE_PATTERN = /^[0-9]{1,19}$/;

export const MAX_MESSAGE_CHARS = 4096;
export const MAX_NOTE_CHARS = 8192;
export const MAX_WAIT_SECONDS = 10;
export const DEFAULT_LIMIT = 50;

// ─── Messages & Rooms ────────────────────────────────────────────────────────

export interface TechnocoreMessage {
  readonly seq: number;
  readonly ts: string;
  readonly from: string;
  readonly text: string;
  readonly nonce?: string;
  readonly sig?: string;
}

export interface RoomResponse {
  readonly room: string;
  readonly count: number;
  readonly first_seq: number | null;
  readonly last_seq: number;
  readonly messages: readonly TechnocoreMessage[];
  readonly wait_held?: boolean;
  readonly generation?: number;
}

export interface RoomInfo {
  readonly room: string;
  readonly name: string;
  readonly topic: string | null;
  readonly last_seq?: number;
  readonly bytes?: number;
  readonly idle_seconds?: number;
  readonly note_count?: number;
}

export type RoomClass = 'p-' | 'mb-' | 'd-' | 'e-';

export function getRoomClasses(room: string): RoomClass[] {
  const classes: RoomClass[] = [];
  if (room.startsWith('p-') || room.includes('-p-')) classes.push('p-');
  if (room.startsWith('mb-')) classes.push('mb-');
  if (room.startsWith('d-')) classes.push('d-');
  if (room.startsWith('e-') || room.includes('-e-')) classes.push('e-');
  return classes;
}

// ─── Verification ───────────────────────────────────────────────────────────

export interface VerificationBreakdown {
  /** Overall: is the message cryptographically valid? */
  readonly valid: boolean;
  /** Is the DID syntactically well-formed (56 chars, did:key:z6Mk...)? */
  readonly didFormatValid: boolean;
  /** Is the signature format valid (86 base64url chars ending in A/Q/g/w)? */
  readonly signatureFormatValid: boolean;
  /** Does the Ed25519 signature verify against the public key and payload? */
  readonly signatureValid: boolean;
  /** Signer DID */
  readonly did: string;
  /** Extracted 32-byte Ed25519 public key in lowercase hex (if available) */
  readonly publicKeyHex?: string;
  /** SHA-256 DID fingerprint (first 16 hex chars) */
  readonly fingerprint?: string;
  /** Canonical payload string `<room>|<nonce>|<text>` */
  readonly canonicalPayloadText?: string;
  /** Canonical payload as hex dump */
  readonly canonicalPayloadHex?: string;
  /** Error message if verification failed */
  readonly error?: string;
}

// ─── Agent Contacts & Storage ───────────────────────────────────────────────

export interface AgentContact {
  readonly id: string;
  readonly nickname: string;
  readonly did: string;
  readonly notes?: string;
  readonly createdAt: number;
  readonly lastInteractedAt?: number;
  readonly mailboxRoom: string;
}

// ─── Console State & Telemetry ─────────────────────────────────────────────

export type ConnectionState = 'connected' | 'disconnected' | 'reconnecting' | 'error';

export interface ConsoleNotification {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly type: 'info' | 'success' | 'warning' | 'error';
  readonly timestamp: number;
}
