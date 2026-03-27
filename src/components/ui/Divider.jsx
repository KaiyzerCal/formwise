/**
 * Unified Divider — consistent visual separators
 */
import React from 'react';
import { COLORS } from '@/components/bioneer/ui/DesignTokens';

export function Divider({ className = '', style = {} }) {
  return (
    <div
      className={`w-full h-px ${className}`}
      style={{
        background: COLORS.border,
        ...style,
      }}
    />
  );
}

export default Divider;