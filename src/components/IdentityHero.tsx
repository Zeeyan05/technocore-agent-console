'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import type { ConnectionState } from '@/types/technocore';
import { AgentIdentityMark } from './AgentIdentityMark';
import { GlowSurface } from './Surface';
import { StatusIndicator } from './StatusBadge';
import { TechnicalValue } from './DataField';

interface IdentityHeroProps {
  did: string;
  /** The kicker above the name. Defaults to the wording the product uses. */
  eyebrow?: string;
  title?: string;
  /**
   * Heading level for the name. The hero is the page title on Overview, but sits
   * under one on Identity, so the level has to follow the page rather than be
   * fixed here.
   */
  titleAs?: 'h1' | 'h2';
  /** Small pill beside the kicker, e.g. the active-identity state. */
  badge?: React.ReactNode;
  description?: string;
  /**
   * Omit on screens that are not about the connection — the right-hand column
   * then carries only what that screen can actually speak to.
   */
  connectionState?: ConnectionState;
  latencyMs?: number | null;
  isPolling?: boolean;
  pulseKey?: number;
  /** True once a keypair is loaded and the browser can sign. */
  signingReady: boolean;
  onCopyText: (text: string, label: string) => void;
  copiedKey: string | null;
  /** Buttons under the identity block. */
  actions?: React.ReactNode;
  /** Extra content in the right-hand column, e.g. the mailbox line. */
  aside?: React.ReactNode;
  className?: string;
}

/**
 * The agent, presented as an entity rather than a row of fields. One composition
 * shared by Overview and Identity so the same agent is introduced the same way in
 * both places.
 *
 * The identity mark leads, the DID is present but demoted to a mono line, and the
 * two live facts — connection and signing readiness — sit together on the right.
 * Nothing here asserts more than the console can prove.
 */
export const IdentityHero: React.FC<IdentityHeroProps> = ({
  did,
  eyebrow = 'Your agent',
  title = 'Your agent',
  titleAs: Title = 'h1',
  badge,
  description,
  connectionState,
  latencyMs,
  isPolling,
  pulseKey,
  signingReady,
  onCopyText,
  copiedKey,
  actions,
  aside,
  className = '',
}) => (
  <GlowSurface variant="identity" className={`overflow-hidden ${className}`}>
    <div className="p-5 sm:p-6 lg:p-7">
      <div className="flex flex-col lg:flex-row lg:items-start gap-5 lg:gap-8">
        <div className="flex items-start gap-4 sm:gap-5 min-w-0 flex-1">
          <AgentIdentityMark
            did={did}
            size={72}
            className="sm:w-[88px] sm:h-[88px]"
            label="Visual fingerprint of your agent identity"
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-identity">
                {eyebrow}
              </p>
              {badge}
            </div>
            <Title className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              {title}
            </Title>
            {description && (
              <p className="mt-1.5 text-[13px] text-ink-3 leading-relaxed max-w-md">{description}</p>
            )}
            <div className="mt-3 max-w-full">
              <TechnicalValue
                value={did}
                name="agent DID"
                copyLabel="hero-did"
                onCopyText={onCopyText}
                copiedKey={copiedKey}
                head={16}
                tail={8}
                tone="accent"
              />
            </div>
          </div>
        </div>

        <div className="lg:w-56 shrink-0 flex flex-col gap-3 lg:border-l lg:border-line lg:pl-6">
          {connectionState && (
            <StatusIndicator
              state={connectionState}
              latencyMs={latencyMs}
              isPolling={isPolling}
              pulseKey={pulseKey}
            />
          )}
          <span
            className={`inline-flex items-center gap-1.5 text-xs ${
              signingReady ? 'text-success' : 'text-warning'
            }`}
          >
            {signingReady ? (
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>{signingReady ? 'Signing ready' : 'No identity loaded'}</span>
          </span>

          {aside}
        </div>
      </div>

      {actions && <div className="mt-5 sm:mt-6 flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </GlowSurface>
);
