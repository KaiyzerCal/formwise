/**
 * VoiceCoachingBanner — Onboarding banner for voice coaching
 * Shows once on first LiveSession visit, lets user acknowledge or disable.
 */
import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { COLORS, FONT } from './DesignTokens';

export default function VoiceCoachingBanner({ onGotIt, onDisable }) {
  return (
    <div
      className="w-full px-4 py-3 flex items-center justify-between gap-3"
      style={{
        background: COLORS.goldDim,
        borderBottom: `1px solid ${COLORS.goldBorder}`,
        fontFamily: FONT.mono,
      }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Volume2 size={16} style={{ color: COLORS.gold, flexShrink: 0 }} />
        <p className="text-[10px] leading-tight" style={{ color: COLORS.gold }}>
          Voice coaching is <strong>ACTIVE</strong>. Real-time corrections will be called out.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onGotIt}
          className="px-3 py-1.5 rounded text-[9px] font-bold tracking-[0.1em] uppercase transition-colors"
          style={{ background: COLORS.gold, color: COLORS.bg }}
        >
          Got it
        </button>
        <button
          onClick={onDisable}
          className="px-3 py-1.5 rounded text-[9px] font-bold tracking-[0.1em] uppercase transition-colors flex items-center gap-1"
          style={{ background: 'transparent', color: COLORS.textSecondary, border: `1px solid ${COLORS.border}` }}
        >
          <VolumeX size={12} />
          Disable
        </button>
      </div>
    </div>
  );
}