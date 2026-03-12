import React from 'react';
import { COLORS, FONT, faultColor } from '../ui/DesignTokens';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import InsufficientDataCard from './InsufficientDataCard';

const TREND_META = {
  improving:  { Icon: TrendingDown, color: '#22C55E', label: '↓ improving' },
  worsening:  { Icon: TrendingUp,   color: '#EF4444', label: '↑ worsening' },
  recurring:  { Icon: Minus,        color: '#EAB308', label: '— recurring' },
};

export default function FaultIntelligencePanel({ faultData }) {
  if (!faultData || faultData.insufficient || !faultData.data.length) {
    return (
      <InsufficientDataCard
        title="Fault Intelligence"
        message="Complete at least 2 sessions to see recurring fault patterns."
      />
    );
  }

  const { data, faultTrends } = faultData;
  const hasTrends = Object.keys(faultTrends).length > 0;

  return (
    <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[9px] tracking-[0.15em] uppercase" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          Fault Intelligence
        </h3>
        {hasTrends && (
          <span className="text-[9px] tracking-[0.08em]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            {data.length} faults detected
          </span>
        )}
      </div>
      <div className="space-y-3">
        {data.map(f => {
          const trend  = faultTrends[f.fault];
          const tMeta  = TREND_META[trend];
          const barClr = faultColor(f.pct);
          return (
            <div key={f.fault}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] flex-1 truncate" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
                  {f.fault}
                </span>
                <span className="text-[9px] font-bold" style={{ color: barClr, fontFamily: FONT.mono }}>
                  {f.pct}%
                </span>
                {tMeta && (
                  <span className="text-[8px] tracking-[0.06em] px-1.5 py-0.5 rounded"
                    style={{ background: `${tMeta.color}15`, color: tMeta.color, fontFamily: FONT.mono }}>
                    {tMeta.label}
                  </span>
                )}
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${f.pct}%`, background: barClr }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}