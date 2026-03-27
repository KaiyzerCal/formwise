/**
 * Unified Badge System — tags, labels, statuses
 */
import React from 'react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';

export function Badge({ children, variant = 'default', className = '', style = {} }) {
  const variants = {
    default: {
      background: COLORS.goldDim,
      borderColor: COLORS.goldBorder,
      color: COLORS.gold,
    },
    success: {
      background: 'rgba(34,197,94,0.1)',
      borderColor: 'rgba(34,197,94,0.3)',
      color: '#22C55E',
    },
    warning: {
      background: 'rgba(245,158,11,0.1)',
      borderColor: 'rgba(245,158,11,0.3)',
      color: '#F59E0B',
    },
    error: {
      background: 'rgba(239,68,68,0.1)',
      borderColor: 'rgba(239,68,68,0.3)',
      color: '#EF4444',
    },
    neutral: {
      background: 'transparent',
      borderColor: COLORS.border,
      color: COLORS.textSecondary,
    },
  };

  const v = variants[variant] || variants.default;

  return (
    <span
      className={`px-2 py-1 rounded-full text-[8px] font-bold tracking-[0.1em] uppercase border ${className}`}
      style={{
        ...v,
        fontFamily: FONT.mono,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export default Badge;