import React from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';
import InsufficientDataCard from './InsufficientDataCard';

const DOT_COLOR = {
  improvement: '#22C55E',
  warning:     '#EAB308',
  fault:       '#EF4444',
  neutral:     COLORS.textTertiary,
};

export default function RecentInsightsPanel({ insightData }) {
  if (!insightData || insightData.insufficient || !insightData.insights.length) {
    return (
      <InsufficientDataCard
        title="Session Insights"
        message="Complete your first session to see insights here."
      />
    );
  }

  return (
    <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <h3 className="text-[9px] tracking-[0.15em] uppercase mb-3" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
        Session Insights
      </h3>
      <div className="space-y-3">
        {insightData.insights.map((ins, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
              style={{ background: DOT_COLOR[ins.type] ?? DOT_COLOR.neutral }} />
            <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
              {ins.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}