/**
 * Unified Card System — premium surfaces with consistent spacing
 */
import React from 'react';
import { COLORS } from '@/components/bioneer/ui/DesignTokens';

export function Card({ children, className = '', style = {} }) {
  return (
    <div
      className={`rounded-lg border overflow-hidden ${className}`}
      style={{
        background: COLORS.surface,
        borderColor: COLORS.border,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', style = {} }) {
  return (
    <div
      className={`px-4 py-3 border-b ${className}`}
      style={{
        borderColor: COLORS.border,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardBody({ children, className = '', style = {} }) {
  return (
    <div className={`px-4 py-3 space-y-3 ${className}`} style={style}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', style = {} }) {
  return (
    <div
      className={`px-4 py-3 border-t flex items-center gap-2 ${className}`}
      style={{
        borderColor: COLORS.border,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default Card;