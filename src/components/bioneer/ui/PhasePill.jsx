import React from "react";
import { COLORS, FONT } from "./DesignTokens";

export default function PhasePill({ phase, active, onClick }) {
  const isActive = active;
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-full text-[9px] tracking-[0.12em] uppercase border transition-colors"
      style={{
        fontFamily: FONT.mono,
        background: isActive ? COLORS.goldDim : 'transparent',
        borderColor: isActive ? COLORS.goldBorder : COLORS.border,
        color: isActive ? COLORS.gold : COLORS.textTertiary,
      }}
    >
      {phase}
    </button>
  );
}