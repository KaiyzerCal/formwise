import React from 'react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
import { SPACING } from '@/lib/spacingSystem';

export default function PrimaryButton({ children, onClick, disabled, className = '', style = {}, ...props }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded font-semibold text-sm tracking-[0.1em] uppercase transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${className}`}
      style={{
        background: COLORS.gold,
        color: COLORS.bg,
        fontFamily: FONT.mono,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}