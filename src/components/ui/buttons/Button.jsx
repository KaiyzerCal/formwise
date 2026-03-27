/**
 * Unified Button System — Steve Jobs design principles
 * Eliminates scattered button styles across the app
 */
import React from 'react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
import { SPACING, TRANSITIONS } from '@/lib/spacingSystem';

export function PrimaryButton({ children, icon: Icon, className = '', ...props }) {
  return (
    <button
      className={`px-4 py-3 rounded-lg font-bold text-[10px] tracking-[0.12em] uppercase transition-all ${className}`}
      style={{
        background: COLORS.gold,
        color: COLORS.bg,
        fontFamily: FONT.mono,
        transitionDuration: TRANSITIONS.fast,
      }}
      {...props}
    >
      <span className="flex items-center justify-center gap-2">
        {Icon && <Icon size={14} />}
        {children}
      </span>
    </button>
  );
}

export function SecondaryButton({ children, icon: Icon, className = '', ...props }) {
  return (
    <button
      className={`px-4 py-2.5 rounded-lg font-bold text-[9px] tracking-[0.12em] uppercase border transition-all ${className}`}
      style={{
        borderColor: COLORS.goldBorder,
        color: COLORS.gold,
        background: COLORS.goldDim,
        fontFamily: FONT.mono,
        transitionDuration: TRANSITIONS.fast,
      }}
      {...props}
    >
      <span className="flex items-center justify-center gap-2">
        {Icon && <Icon size={12} />}
        {children}
      </span>
    </button>
  );
}

export function TertiaryButton({ children, icon: Icon, className = '', ...props }) {
  return (
    <button
      className={`px-3 py-2 rounded text-[9px] tracking-[0.1em] uppercase border transition-all ${className}`}
      style={{
        borderColor: COLORS.border,
        color: COLORS.textSecondary,
        fontFamily: FONT.mono,
        transitionDuration: TRANSITIONS.fast,
      }}
      {...props}
    >
      <span className="flex items-center justify-center gap-1.5">
        {Icon && <Icon size={11} />}
        {children}
      </span>
    </button>
  );
}

export function DangerButton({ children, icon: Icon, className = '', ...props }) {
  return (
    <button
      className={`px-4 py-2.5 rounded-lg font-bold text-[9px] tracking-[0.12em] uppercase border transition-all ${className}`}
      style={{
        borderColor: 'rgba(239,68,68,0.3)',
        color: '#EF4444',
        background: 'rgba(239,68,68,0.08)',
        fontFamily: FONT.mono,
        transitionDuration: TRANSITIONS.fast,
      }}
      {...props}
    >
      <span className="flex items-center justify-center gap-2">
        {Icon && <Icon size={12} />}
        {children}
      </span>
    </button>
  );
}

export function IconButton({ icon: Icon, className = '', title, ...props }) {
  return (
    <button
      title={title}
      className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${className}`}
      style={{ color: COLORS.textSecondary }}
      {...props}
    >
      <Icon size={16} strokeWidth={1.5} />
    </button>
  );
}

export default PrimaryButton;