import React from 'react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';

export default function TextButton({ children, onClick, disabled, className = '', style = {}, ...props }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-xs tracking-[0.1em] uppercase transition-colors hover:text-gold disabled:opacity-50 ${className}`}
      style={{
        color: COLORS.textSecondary,
        fontFamily: FONT.mono,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}