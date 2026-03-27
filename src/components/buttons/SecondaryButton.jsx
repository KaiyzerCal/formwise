import React from 'react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';

export default function SecondaryButton({ children, onClick, disabled, className = '', style = {}, ...props }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2.5 rounded border text-xs tracking-[0.1em] uppercase transition-all hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        borderColor: COLORS.border,
        color: COLORS.textSecondary,
        fontFamily: FONT.mono,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}