import React from "react";
import { COLORS, FONT } from "./DesignTokens";

const REGION_MAP = {
  shoulder_l: { x: 72, y: 68 },
  shoulder_r: { x: 128, y: 68 },
  hip_l: { x: 82, y: 145 },
  hip_r: { x: 118, y: 145 },
  knee_l: { x: 80, y: 195 },
  knee_r: { x: 120, y: 195 },
  ankle_l: { x: 78, y: 245 },
  ankle_r: { x: 122, y: 245 },
  lower_back: { x: 100, y: 125 },
};

const SEV_COLOR = { red: COLORS.fault, amber: COLORS.warning, green: COLORS.correct };

export default function BodyHeatmap({ data }) {
  return (
    <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <h3 className="text-[9px] tracking-[0.15em] uppercase mb-3" style={{ color: COLORS.textTertiary }}>Body Fault Heatmap</h3>
      <div className="flex items-start gap-4">
        <svg viewBox="0 0 200 280" className="w-32 h-auto flex-shrink-0">
          {/* Body outline */}
          <ellipse cx="100" cy="30" rx="18" ry="22" fill="none" stroke={COLORS.border} strokeWidth="1.5" />
          <line x1="100" y1="52" x2="100" y2="145" stroke={COLORS.border} strokeWidth="1.5" />
          <line x1="100" y1="70" x2="68" y2="115" stroke={COLORS.border} strokeWidth="1.5" />
          <line x1="100" y1="70" x2="132" y2="115" stroke={COLORS.border} strokeWidth="1.5" />
          <line x1="100" y1="145" x2="80" y2="210" stroke={COLORS.border} strokeWidth="1.5" />
          <line x1="100" y1="145" x2="120" y2="210" stroke={COLORS.border} strokeWidth="1.5" />
          <line x1="80" y1="210" x2="78" y2="260" stroke={COLORS.border} strokeWidth="1.5" />
          <line x1="120" y1="210" x2="122" y2="260" stroke={COLORS.border} strokeWidth="1.5" />

          {/* Heatmap dots */}
          {data.map(d => {
            const pos = REGION_MAP[d.region];
            if (!pos) return null;
            return (
              <g key={d.region}>
                <circle cx={pos.x} cy={pos.y} r={10 + d.pct * 0.15} fill={SEV_COLOR[d.severity]} opacity={0.25} />
                <circle cx={pos.x} cy={pos.y} r={5} fill={SEV_COLOR[d.severity]} opacity={0.8} />
              </g>
            );
          })}
        </svg>

        <div className="flex-1 space-y-1.5">
          {data.slice(0, 6).map(d => (
            <div key={d.region} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: SEV_COLOR[d.severity] }} />
              <span className="text-[10px] flex-1" style={{ color: COLORS.textSecondary }}>{d.joint}</span>
              <span className="text-[10px] font-bold" style={{ color: SEV_COLOR[d.severity] }}>{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}