import React from "react";
import { COLORS, FONT } from "./DesignTokens";
import { getAnatomyData, DIFFICULTY_LABEL, RISK_LABEL } from "../library/anatomyData";

const CAT_COLORS = {
  strength:     { bg: 'rgba(201,162,39,0.1)',  border: 'rgba(201,162,39,0.3)',  text: '#c9a227' },
  calisthenics: { bg: 'rgba(0,229,160,0.1)',   border: 'rgba(0,229,160,0.3)',   text: '#00e5a0' },
  athletic:     { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)',  text: '#3b82f6' },
  rotational:   { bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.3)',  text: '#a855f7' },
  locomotion:   { bg: 'rgba(14,165,233,0.1)',  border: 'rgba(14,165,233,0.3)',  text: '#0ea5e9' },
  rehab:        { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)',   text: '#22c55e' },
};

export default function MovementCard({ movement: m, onClick }) {
  const cat     = CAT_COLORS[m.category] || CAT_COLORS.strength;
  const anatomy = getAnatomyData(m);
  const primary = anatomy?.primary_muscles?.slice(0, 2).map(s => s.replace(/_/g, ' ')).join(' · ') || null;
  const diff    = anatomy ? DIFFICULTY_LABEL[anatomy.difficulty] : null;

  return (
    <button
      onClick={onClick}
      className="text-left rounded-lg border p-4 transition-colors group w-full"
      style={{ background: COLORS.surface, borderColor: COLORS.border }}
      onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.goldBorder}
      onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
    >
      {/* Row 1: name + category */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="text-sm font-medium leading-snug" style={{ color: COLORS.textPrimary, fontFamily: FONT.heading }}>
          {m.displayName}
        </h3>
        <span className="text-[8px] tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border flex-shrink-0"
          style={{ background: cat.bg, borderColor: cat.border, color: cat.text, fontFamily: FONT.mono }}>
          {m.category}
        </span>
      </div>

      {/* Primary muscles if available */}
      {primary && (
        <p className="text-[10px] mb-2 capitalize" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
          {primary}
        </p>
      )}

      {/* Row 2: movement family + difficulty */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[9px] capitalize" style={{ color: COLORS.textMuted, fontFamily: FONT.mono }}>
          {m.movementFamily?.replace(/_/g, ' ')}
        </span>
        {diff && (
          <span className="text-[8px] tracking-[0.08em] uppercase px-1.5 py-0.5 rounded-full ml-auto"
            style={{ color: diff.color, background: `${diff.color}15`, fontFamily: FONT.mono }}>
            {diff.label}
          </span>
        )}
      </div>
    </button>
  );
}