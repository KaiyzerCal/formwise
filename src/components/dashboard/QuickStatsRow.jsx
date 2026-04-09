import React from 'react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';

export default function QuickStatsRow({ sessions, streak, level }) {
  const stats = [
    { label: 'Sessions', value: sessions },
    { label: 'Streak', value: `${streak}d` },
    { label: 'Level', value: level },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(s => (
        <div
          key={s.label}
          className="text-center py-3 rounded-lg border"
          style={{ background: COLORS.surface, borderColor: COLORS.border, fontFamily: FONT.mono }}
        >
          <div className="text-lg font-bold" style={{ color: COLORS.gold }}>{s.value}</div>
          <div className="text-[7px] tracking-[0.15em] uppercase mt-0.5" style={{ color: COLORS.textTertiary }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}