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
        className={`relative flex items-center justify-center rounded-lg bg-surface border border-line text-accent shrink-0 ${className}`}
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
      className={`relative rounded-lg overflow-hidden border border-line flex items-center justify-center bg-bg shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
      }}
    >
      <Image
        src="/brand-logo.png"
        alt="CoreConsole Logo"
        width={size}
        height={size}
        className="object-cover w-full h-full"
        onError={() => setImgError(true)}
        priority
      />
    </div>
  );
}
