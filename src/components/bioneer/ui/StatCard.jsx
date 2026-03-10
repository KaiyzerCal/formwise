import React from "react";
import { COLORS, FONT } from "./DesignTokens";

export default function StatCard({ label, value, icon: Icon, color, children, className = '' }) {
  return (
    <div className={`rounded-lg p-4 border ${className}`} style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] tracking-[0.15em] uppercase" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>{label}</span>
        {Icon && <Icon size={14} strokeWidth={1.5} style={{ color: color || COLORS.gold }} />}
      </div>
      {children || (
        <span className="text-2xl font-bold" style={{ color: color || COLORS.textPrimary, fontFamily: FONT.heading }}>{value}</span>
      )}
    </div>
  );
}