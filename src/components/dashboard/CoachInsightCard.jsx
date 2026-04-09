import React from 'react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';

export default function CoachInsightCard({ message }) {
  return (
    <div
      className="px-4 py-3 rounded-lg border"
      style={{ background: COLORS.goldDim, borderColor: COLORS.goldBorder, fontFamily: FONT.mono }}
    >
      <p className="text-[8px] tracking-[0.12em] uppercase font-bold mb-1" style={{ color: COLORS.textTertiary }}>
        Coach Insight
      </p>
      <p className="text-[10px] leading-relaxed italic" style={{ color: COLORS.gold }}>
        "{message}"
      </p>
    </div>
  );
}