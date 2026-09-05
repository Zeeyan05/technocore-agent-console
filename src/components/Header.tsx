'use client';

import React from 'react';
import {
  Send,
  Copy,
  Check,
  SearchCode,
  RefreshCw,
  UserPlus,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { Identicon } from './Identicon';
import { ConnectionDot } from './StatusBadge';
import { formatDidAbbreviated } from '@/lib/crypto/did';
import type { Identity } from '@/lib/identity';
import type { ConnectionState } from '@/types/technocore';

interface HeaderProps {
  identity: Identity | null;
  connectionState: ConnectionState;
  latencyMs: number | null;
  onOpenCompose: () => void;
  onOpenVerifier: () => void;
  /** Sends the user to the Identity screen when no agent identity is loaded. */
  onOpenIdentity: () => void;
  onRefreshConnection: () => void;
  isChecking: boolean;
  onCopyDid: (did: string) => void;
  didCopied: boolean;
  serverVersion: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  identity,
  connectionState,
  latencyMs,
  onOpenCompose,
  onOpenVerifier,
  onOpenIdentity,
  onRefreshConnection,
  isChecking,
  onCopyDid,
  didCopied,
  serverVersion,
}) => {
  const currentDid = identity?.did || '';

  const latencyColor =
    latencyMs === null
      ? 'text-ink-3'
      : latencyMs < 150
      ? 'text-success'
      : latencyMs < 350
      ? 'text-warning'
      : 'text-danger';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-bg/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand — logo mark alone on phones, wordmark from sm, version tag from lg */}
        <div className="flex items-center gap-3 min-w-0">
          <BrandLogo size={38} />
          <div className="hidden sm:flex items-center gap-2.5 min-w-0">
            <span className="text-base font-extrabold tracking-tight text-ink font-sans">
              CORE<span className="text-accent">CONSOLE</span>
            </span>
            <span
              className="hidden lg:inline-flex text-[10px] font-mono font-medium px-2 py-1 rounded bg-surface-2 text-ink-3 border border-line whitespace-nowrap"
              title={
                serverVersion
                  ? `Technocore protocol v${serverVersion}, reported live by the upstream /config endpoint. Messages are signed with Ed25519 and identities use did:key.`
                  : 'Upstream protocol version not read yet. Messages are signed with Ed25519 and identities use did:key.'
              }
            >
              Agent console{serverVersion ? ` · Technocore v${serverVersion}` : ''}
            </span>
          </div>
        </div>

        {/* Right Section: Telemetry & Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Connection Status Indicator */}
          <button
            type="button"
            onClick={onRefreshConnection}
            className="flex items-center gap-2 px-3 py-1.5 min-h-11 sm:min-h-0 rounded-md bg-surface border border-line text-xs cursor-pointer hover:border-line-2 hover:bg-surface-2 transition-colors shrink-0"
            title="Click to recheck network latency to technocore.chat"
          >
            <ConnectionDot state={connectionState} />
            {latencyMs !== null && (
              <span className={`text-[11px] font-mono font-medium border-l border-line pl-2 ${latencyColor}`}>
                {latencyMs}ms
              </span>
            )}
            <RefreshCw
              className={`w-3 h-3 text-ink-3 transition-colors ${isChecking ? 'animate-spin text-accent' : ''}`}
              aria-hidden="true"
            />
          </button>

          {/* Standalone Verifier Shortcut */}
          <button
            onClick={onOpenVerifier}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface hover:bg-surface-2 border border-line text-xs font-medium text-ink-2 hover:text-ink transition-colors"
            title="Check a signed message somebody sent you"
          >
            <SearchCode className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
            <span>Verifier</span>
          </button>

          {/* Active Identity Pill — or a route to create one, so the empty case
              reads as "one step left", not as a broken console. */}
          {currentDid ? (
            <button
              onClick={() => onCopyDid(currentDid)}
              className="flex items-center gap-2 px-3 py-1.5 min-h-11 sm:min-h-0 rounded-md bg-surface border border-line hover:border-line-2 hover:bg-surface-2 transition-colors shrink-0"
              title={`Click to copy your agent identity: ${currentDid}`}
              aria-label={`Copy your agent identity ${currentDid}`}
            >
              <Identicon did={currentDid} size={20} />
              <span className="hidden sm:inline font-mono text-xs text-ink-2 transition-colors">
                {formatDidAbbreviated(currentDid)}
              </span>
              {didCopied ? (
                <Check className="w-3.5 h-3.5 text-success shrink-0" aria-hidden="true" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-ink-3 shrink-0" aria-hidden="true" />
              )}
            </button>
          ) : (
            <button
              onClick={onOpenIdentity}
              className="flex items-center gap-2 px-3 py-1.5 min-h-11 sm:min-h-0 rounded-md bg-warning-tint border border-warning/40 text-warning hover:bg-warning/15 transition-colors shrink-0"
              title="Your agent needs an identity before it can send signed messages"
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline text-xs font-medium">Identity required</span>
            </button>
          )}

          {/* Compose Message Button — flat accent, the single primary CTA */}
          <button
            onClick={onOpenCompose}
            aria-label="Write a message"
            className="inline-flex items-center justify-center gap-2 p-3 sm:px-3.5 sm:py-2 min-h-11 sm:min-h-0 rounded-md bg-accent text-on-accent text-xs font-bold transition-colors hover:bg-accent/85 active:bg-accent/75 shrink-0"
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden md:inline tracking-wide">New Message</span>
          </button>
        </div>
      </div>
    </header>
  );
};