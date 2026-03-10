import React from "react";
import { COLORS, FONT } from "./DesignTokens";

const CAT_COLORS = {
  strength: { bg: 'rgba(201,162,39,0.1)', border: 'rgba(201,162,39,0.3)', text: '#c9a227' },
  calisthenics: { bg: 'rgba(0,229,160,0.1)', border: 'rgba(0,229,160,0.3)', text: '#00e5a0' },
  athletic: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', text: '#3b82f6' },
  rotational: { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)', text: '#a855f7' },
  locomotion: { bg: 'rgba(14,165,233,0.1)', border: 'rgba(14,165,233,0.3)', text: '#0ea5e9' },
  rehab: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', text: '#22c55e' },
};

export default function MovementCard({ movement, onClick }) {
  const m = movement;
  const cat = CAT_COLORS[m.category] || CAT_COLORS.strength;
  const phases = m.phaseTemplate || [];
  const faultCount = (m.faultRules || []).length;
  const joints = (m.visibilityJoints || []).slice(0, 4).map(j => j.replace('l_','').replace('r_',''));
  const uniqueJoints = [...new Set(joints)].map(j => j.charAt(0).toUpperCase() + j.slice(1));

  return (
    <button
      onClick={onClick}
      className="text-left rounded-lg border p-4 transition-colors group"
      style={{ background: COLORS.surface, borderColor: COLORS.border }}
      onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.goldBorder}
      onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>{m.displayName}</h3>
        <span className="text-[8px] tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border" style={{ background: cat.bg, borderColor: cat.border, color: cat.text }}>
          {m.category}
        </span>
      </div>
      <p className="text-[10px] mb-2" style={{ color: COLORS.textTertiary }}>
        {phases.map(p => p.replace(/_/g, ' ')).join(' · ')}
      </p>
      <div className="flex items-center gap-3">
        <span className="text-[9px]" style={{ color: COLORS.textMuted }}>
          {uniqueJoints.join(' · ')}
        </span>
        <span className="text-[9px] ml-auto" style={{ color: COLORS.textMuted }}>
          {faultCount} fault rules
        </span>
      </div>
    </button>
  );
}