/**
 * Unified Spacer — consistent rhythm using SPACING system
 */
import React from 'react';
import { SPACING } from '@/lib/spacingSystem';

export function Spacer({ size = 'md', direction = 'vertical' }) {
  const height = direction === 'vertical' ? SPACING[size] : '0';
  const width = direction === 'horizontal' ? SPACING[size] : '0';

  return (
    <div
      style={{
        width,
        height,
        flexShrink: 0,
      }}
    />
  );
}

export default Spacer;