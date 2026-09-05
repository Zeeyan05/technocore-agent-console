'use client';

import React from 'react';

/**
 * The console's card. §29's answer to "everything is a bordered box": depth comes
 * from a surface step, a 1px top light edge and a shadow, so a border becomes
 * something you add for a reason rather than the default.
 */
type SurfaceVariant = 'plain' | 'outlined' | 'accent' | 'identity';

const VARIANT_CLASS: Record<SurfaceVariant, string> = {
  /* No border at all — grouping is carried by the surface step and the spacing. */
  plain: 'surface-raised',
  /* Kept for dense protocol data, where a hard edge genuinely helps scanning. */
  outlined: 'surface-raised border border-line',
  /* A directional cyan wash: system areas. */
  accent: 'surface-raised wash-accent border border-line',
  /* A directional violet wash: identity areas, and only identity areas. */
  identity: 'surface-raised wash-identity border border-line',
};

interface GlowSurfaceProps extends React.HTMLAttributes<HTMLElement> {
  variant?: SurfaceVariant;
  /** Lift 1px on hover. Only for surfaces that are actually clickable. */
  interactive?: boolean;
  as?: 'div' | 'section' | 'article' | 'aside' | 'li';
  children: React.ReactNode;
}

export const GlowSurface: React.FC<GlowSurfaceProps> = ({
  variant = 'plain',
  interactive = false,
  as = 'div',
  className = '',
  children,
  ...rest
}) => {
  const Tag = as as React.ElementType;

  return (
    <Tag
      className={`relative rounded-xl ${VARIANT_CLASS[variant]} ${
        interactive ? 'surface-lift' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
};

interface SectionHeaderProps {
  title: string;
  description?: string;
  /** Small uppercase kicker above the title. Use sparingly. */
  eyebrow?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}

/**
 * One heading rhythm for every screen. Titles are the display tier — heavier and
 * tighter than body copy — so a screen title never has to compete with a card
 * title for the same visual weight.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  eyebrow,
  icon,
  actions,
  as: Heading = 'h2',
  className = '',
}) => (
  <div className={`flex items-start justify-between gap-4 ${className}`}>
    <div className="min-w-0 flex items-start gap-3">
      {icon && <span className="shrink-0 mt-0.5">{icon}</span>}
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-4 mb-1">
            {eyebrow}
          </p>
        )}
        <Heading className="text-lg sm:text-xl font-bold tracking-tight text-ink">{title}</Heading>
        {description && (
          <p className="mt-1 text-[13px] text-ink-3 leading-relaxed max-w-prose">{description}</p>
        )}
      </div>
    </div>
    {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
  </div>
);

/**
 * The entrance wrapper. Children rise into place one after another, driven by the
 * `--i` custom property and `.anim-stagger` — no JS timers, and the
 * reduced-motion block in globals.css collapses the whole thing to its finished
 * state rather than leaving anything invisible.
 *
 * The index is capped so a fifty-row list never makes anyone wait: past the
 * eighth item everything arrives together.
 */
export const Stagger: React.FC<{
  children: React.ReactNode;
  anim?: 'rise' | 'fade' | 'row';
  className?: string;
  /** Start the sequence later, to follow an element above it. */
  offset?: number;
}> = ({ children, anim = 'rise', className = '', offset = 0 }) => {
  const animClass = anim === 'rise' ? 'anim-rise' : anim === 'fade' ? 'anim-fade' : 'anim-row';

  return (
    <>
      {React.Children.map(children, (child, i) =>
        React.isValidElement(child) ? (
          <div
            className={`${animClass} anim-stagger ${className}`}
            style={{ '--i': Math.min(i + offset, 8) } as React.CSSProperties}
          >
            {child}
          </div>
        ) : (
          child
        ),
      )}
    </>
  );
};
