'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export function BrandLogo({ size = 38, className = '' }: BrandLogoProps) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-lg bg-[#0e111a] border border-cyan-500/30 text-cyan-400 shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L4 5.5V11C4 16.5 7.5 21.2 12 22.5C16.5 21.2 20 16.5 20 11V5.5L12 2Z" />
          <path d="M9 12L11 14L15 10" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-lg overflow-hidden border border-cyan-500/40 shadow-[0_0_12px_rgba(0,242,254,0.25)] flex items-center justify-center bg-[#07080c] shrink-0 transition-transform hover:scale-105 ${className}`}
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
