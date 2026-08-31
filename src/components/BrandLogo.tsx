'use client';

import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export function BrandLogo({ size = 32, className = '' }: BrandLogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-lg bg-[#0c0e14] border border-white/10 shadow-sm shrink-0 transition-transform hover:scale-105 ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
      }}
    >
      <svg
        width={size * 0.65}
        height={size * 0.65}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-cyan-400"
      >
        {/* Geometric Shield & Key Node Vector */}
        <path
          d="M12 2L4 5.5V11C4 16.5 7.5 21.2 12 22.5C16.5 21.2 20 16.5 20 11V5.5L12 2Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="9.5" r="2.5" stroke="#10b981" strokeWidth="1.5" />
        <path
          d="M12 12V16.5M10.5 15H13.5"
          stroke="#10b981"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
