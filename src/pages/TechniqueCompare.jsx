import React from 'react';
import { COLORS, FONT } from '../components/bioneer/ui/DesignTokens';

export default function TechniqueCompare() {
  return (
    <div
      className="h-full w-full flex items-center justify-center"
      style={{ background: COLORS.bg, fontFamily: FONT.mono }}
    >
      <div
        className="max-w-md w-full mx-6 rounded-xl border p-6 text-center"
        style={{ background: COLORS.surface, borderColor: COLORS.border }}
      >
        <h1
          className="text-sm font-bold tracking-[0.18em] uppercase mb-3"
          style={{ color: COLORS.gold }}
        >
          Technique
        </h1>
        <p className="text-[11px] leading-relaxed" style={{ color: COLORS.textSecondary }}>
          Technique comparison is being rebuilt. The app should now load normally.
        </p>
      </div>
    </div>
  );
}