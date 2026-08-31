'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export function BrandLogo({ size = 36, className = '' }: BrandLogoProps) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 via-slate-900 to-purple-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.3)] ${className}`}
        style={{ width: size, height: size }}
      >
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 32 32" fill="none">
          <path
            d="M16 4L6 8.5V15.5C6 22 10.5 27.5 16 29C21.5 27.5 26 22 26 15.5V8.5L16 4Z"
            fill="#090a0f"
            stroke="#00f2fe"
            strokeWidth="2.2"
          />
          <path d="M11 16L14.5 19.5L21 13" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-xl overflow-hidden border border-cyan-500/40 shadow-[0_0_18px_rgba(0,242,254,0.35)] flex items-center justify-center bg-[#07080c] shrink-0 transition-transform hover:scale-105 ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
      }}
    >
      <Image
        src="/brand-logo.png"
        alt="Technocore Logo"
        width={size}
        height={size}
        className="object-cover w-full h-full"
        onError={() => setImgError(true)}
        priority
      />
    </div>
  );
}
