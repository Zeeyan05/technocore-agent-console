'use client';

import React, { useMemo } from 'react';

interface IdenticonProps {
  did: string;
  size?: number;
  className?: string;
}

export const Identicon: React.FC<IdenticonProps> = ({ did, size = 28, className = '' }) => {
  const { color1, color2, angle, points } = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < did.length; i++) {
      hash = (hash << 5) - hash + did.charCodeAt(i);
      hash |= 0;
    }

    const hue1 = Math.abs(hash) % 360;
    const hue2 = (hue1 + 75) % 360;
    const color1 = `hsl(${hue1}, 75%, 55%)`;
    const color2 = `hsl(${hue2}, 85%, 45%)`;
    const angle = Math.abs(hash >> 4) % 360;

    // Deterministic geometric shapes inside
    const p1 = (Math.abs(hash >> 2) % 40) + 10;
    const p2 = (Math.abs(hash >> 6) % 40) + 10;
    const p3 = (Math.abs(hash >> 8) % 40) + 10;

    return { color1, color2, angle, points: [p1, p2, p3] };
  }, [did]);

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden border border-slate-700/60 shadow-sm ${className}`}
      style={{ width: size, height: size }}
      title={did}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <defs>
          <linearGradient id={`grad-${did}`} x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform={`rotate(${angle})`}>
            <stop offset="0%" stopColor={color1} />
            <stop offset="100%" stopColor={color2} />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#grad-${did})`} />
        <circle cx={points[0]} cy={points[1]} r="24" fill="#090a0f" fillOpacity="0.3" />
        <rect x={points[1]} y={points[2]} width="32" height="32" rx="6" fill="#ffffff" fillOpacity="0.25" />
      </svg>
    </div>
  );
};
