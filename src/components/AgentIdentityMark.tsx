'use client';

import React, { useId, useMemo } from 'react';
import { Globe } from 'lucide-react';

/**
 * A deterministic visual fingerprint of a `did:key`.
 *
 * Same identity → same mark, always. A different identity → a different
 * arrangement of nodes, arcs and core glyph. Everything is derived locally from
 * the DID string: no network request, no image asset, no external service, so it
 * renders offline and cannot leak which identities you are looking at.
 *
 * Deliberately *not* an avatar. The visual language is orbital arcs, structured
 * nodes and a geometric core — a key visualised, not a face. Hue is constrained
 * to the brand band (cyan → blue → violet), so no identity can generate a
 * rainbow, and the two tones are always near neighbours in that band.
 */
interface AgentIdentityMarkProps {
  did: string;
  size?: number;
  className?: string;
  /** Announce the mark. Decorative by default: the DID is always beside it. */
  label?: string;
  /** Drop the plate, for use inside a surface that already provides one. */
  bare?: boolean;
}

/**
 * FNV-1a, 32-bit. Cheap and it avalanches: one changed base58 character moves
 * every field below, which is why two DIDs that share a prefix still look
 * unrelated.
 */
function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** xorshift32, so each visual field gets independent bits rather than a slice
 *  of the same hash. */
function makeRng(seed: number): () => number {
  let s = seed >>> 0 || 0x9e3779b9;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s >>> 0;
  };
}

/* Cyan → blue → violet. The whole permitted hue range. */
const HUES = [188, 197, 206, 216, 228, 242, 254, 266] as const;

/* Dash patterns for the two rings. Each one reads as a different arrangement of
   arc segments rather than a solid circle. */
const RING_DASHES = ['26 10', '16 6', '40 14', '9 7', '30 8 12 8', '20 12', '54 22', '13 5 5 5'] as const;

interface MarkGeometry {
  h1: number;
  h2: number;
  rot: number;
  counterRot: number;
  outerDash: string;
  innerDash: string;
  nodes: { x: number; y: number; r: number; alt: boolean }[];
  chord: [number, number];
  core: number;
  coreSize: number;
}

/**
 * Everything the mark draws, derived from the DID. Pure and memoised, so a list
 * of 50 inbox rows costs one hash each and nothing on re-render.
 */
function deriveGeometry(did: string): MarkGeometry {
  const rng = makeRng(fnv1a(did));

  const hueIndex = rng() % HUES.length;
  /* The second tone is always 1–3 steps along the band, so the pair is a pair of
     neighbours and never a clash. */
  const hueStep = 1 + (rng() % 3);
  const h1 = HUES[hueIndex];
  const h2 = HUES[(hueIndex + hueStep) % HUES.length];

  const rot = rng() % 360;
  const counterRot = rng() % 360;
  const outerDash = RING_DASHES[rng() % RING_DASHES.length];
  const innerDash = RING_DASHES[rng() % RING_DASHES.length];

  /* 5–8 nodes on the outer orbit. One bitmask decides which of them take the
     second tone and which are the larger ones — that single value is most of
     what makes two marks tell apart at 20px. */
  const count = 5 + (rng() % 4);
  const mask = rng();
  const nodes = Array.from({ length: count }, (_, i) => {
    const angle = ((i * 360) / count + rot) * (Math.PI / 180);
    const big = ((mask >>> i) & 1) === 1;
    const alt = ((mask >>> (i + 8)) & 1) === 1;
    return {
      x: 32 + Math.cos(angle) * 24,
      y: 32 + Math.sin(angle) * 24,
      r: big ? 3.2 : 2,
      alt,
    };
  });

  /* One chord across the orbit. Structure, not decoration: it makes the mark
     read as a graph of related points rather than a ring of dots. */
  const a = rng() % count;
  const b = (a + 2 + (rng() % Math.max(1, count - 3))) % count;

  return {
    h1,
    h2,
    rot,
    counterRot,
    outerDash,
    innerDash,
    nodes,
    chord: [a, b],
    core: rng() % 4,
    coreSize: 7 + (rng() % 3),
  };
}

/**
 * The centre glyph — the "key" at the middle of the orbit. Four possibilities so
 * the core is not the same shape for every identity even at 20px, where the
 * outer nodes start to merge.
 */
function CoreGlyph({ shape, size, fill }: { shape: number; size: number; fill: string }) {
  const half = size / 2;

  if (shape === 0) {
    return (
      <rect
        x={32 - half}
        y={32 - half}
        width={size}
        height={size}
        rx={1.5}
        transform="rotate(45 32 32)"
        style={{ fill }}
      />
    );
  }

  if (shape === 1) {
    const points = Array.from({ length: 6 }, (_, i) => {
      const a = (i * 60 - 30) * (Math.PI / 180);
      return `${(32 + Math.cos(a) * half).toFixed(2)},${(32 + Math.sin(a) * half).toFixed(2)}`;
    }).join(' ');
    return <polygon points={points} style={{ fill }} />;
  }

  if (shape === 2) {
    return (
      <circle cx="32" cy="32" r={half} fill="none" strokeWidth="2.6" style={{ stroke: fill }} />
    );
  }

  const points = Array.from({ length: 3 }, (_, i) => {
    const a = (i * 120 - 90) * (Math.PI / 180);
    const r = half + 1;
    return `${(32 + Math.cos(a) * r).toFixed(2)},${(32 + Math.sin(a) * r).toFixed(2)}`;
  }).join(' ');
  return <polygon points={points} style={{ fill }} />;
}

export function AgentIdentityMark({
  did,
  size = 40,
  className = '',
  label,
  bare = false,
}: AgentIdentityMarkProps) {
  /* useId, not the DID: a DID in a DOM id would leak the identity into the
     document outline and break if two marks for the same agent are on screen. */
  const uid = useId().replace(/:/g, '');
  const geo = useMemo(() => deriveGeometry(did || 'did:key:unknown'), [did]);

  const [a, b] = geo.chord;
  const from = geo.nodes[a];
  const to = geo.nodes[b];

  /* The two hues are handed to CSS, which owns the lightness — that is how the
     same mark stays legible on a near-black plate and on a white card. */
  const hueVars = {
    '--mk-h1': String(geo.h1),
    '--mk-h2': String(geo.h2),
  } as React.CSSProperties;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`mark shrink-0 ${className}`}
      style={hueVars}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <defs>
        <linearGradient id={`mk-core-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--mk-1)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--mk-2)' }} />
        </linearGradient>
      </defs>

      {!bare && (
        <rect
          x="0.5"
          y="0.5"
          width="63"
          height="63"
          rx="15"
          strokeWidth="1"
          style={{ fill: 'var(--mk-plate)', stroke: 'var(--mk-plate-line)' }}
        />
      )}

      {/* Outer orbit. Rotates only on hover — see `.mark-ring` in globals.css. */}
      <g className="mark-ring">
        <circle
          cx="32"
          cy="32"
          r="24"
          fill="none"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeDasharray={geo.outerDash}
          transform={`rotate(${geo.rot} 32 32)`}
          style={{ stroke: 'var(--mk-1)', opacity: 0.7 }}
        />
      </g>

      {/* Inner orbit, counter-rotated, in the second tone. */}
      <circle
        cx="32"
        cy="32"
        r="17"
        fill="none"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray={geo.innerDash}
        transform={`rotate(${geo.counterRot} 32 32)`}
        style={{ stroke: 'var(--mk-2)', opacity: 0.85 }}
      />

      {/* One chord across the orbit, so the nodes read as a related structure
          rather than a ring of loose dots. */}
      <line
        x1={from.x.toFixed(2)}
        y1={from.y.toFixed(2)}
        x2={to.x.toFixed(2)}
        y2={to.y.toFixed(2)}
        strokeWidth="1"
        style={{ stroke: 'var(--mk-1)', opacity: 0.32 }}
      />

      {geo.nodes.map((node, i) => (
        <circle
          key={i}
          cx={node.x.toFixed(2)}
          cy={node.y.toFixed(2)}
          r={node.r}
          style={{ fill: node.alt ? 'var(--mk-2)' : 'var(--mk-1)' }}
        />
      ))}

      <CoreGlyph shape={geo.core} size={geo.coreSize} fill={`url(#mk-core-${uid})`} />
    </svg>
  );
}

/**
 * The sender, visualised. A `did:key` gets its deterministic identity mark; a
 * self-asserted nickname deliberately does not — drawing a cryptographic mark
 * for a name nobody signed would dress up something unproven.
 *
 * Lives next to the mark rather than inside a screen because Inbox and Rooms
 * both show writers, and both have to make the same distinction the same way.
 */
export const SenderMark: React.FC<{ did: string; isDid: boolean; size: number }> = ({
  did,
  isDid,
  size,
}) =>
  isDid ? (
    <AgentIdentityMark did={did} size={size} />
  ) : (
    <span
      className="inline-flex items-center justify-center rounded-lg bg-surface-2 border border-line text-ink-4 shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Globe style={{ width: Math.round(size * 0.45), height: Math.round(size * 0.45) }} />
    </span>
  );
