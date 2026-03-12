import React from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { BarChart2 } from 'lucide-react';

export default function InsufficientDataCard({ title, message }) {
  return (
    <div className="rounded-lg border p-4 flex flex-col items-center justify-center gap-2 min-h-[120px]"
      style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      {title && (
        <p className="text-[9px] tracking-[0.15em] uppercase self-start mb-1" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          {title}
        </p>
      )}
      <BarChart2 size={18} strokeWidth={1.5} style={{ color: COLORS.textTertiary }} />
      <p className="text-[10px] text-center leading-relaxed max-w-[180px]"
        style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
        {message || 'Not enough data yet — complete more sessions to unlock this view.'}
      </p>
    </div>
  );
}