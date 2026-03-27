import React from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { Zap } from 'lucide-react';

const DOT_COLOR = {
  improvement: '#22C55E',
  warning:     '#EAB308',
  fault:       '#EF4444',
  neutral:     COLORS.textTertiary,
};

export default function RecentInsightsPanel({ insightData }) {
  const isEmpty   = !insightData || insightData.isEmpty;
  const hasInsights = insightData?.insights?.length > 0;

  return (
    <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <h3 className="text-[9px] tracking-[0.15em] uppercase mb-3" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
        Session Insights
      </h3>

      {hasInsights ? (
        <div className="space-y-3">
          {insightData.insights.map((ins, i) => (
            ins.type === 'ai' ? (
              <div key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex-shrink-0 text-[11px]" style={{ color: COLORS.gold }}>✦</span>
                <p className="flex-1 text-[10px] leading-relaxed" style={{ color: COLORS.textPrimary, fontFamily: FONT.mono }}>
                  {ins.text}
                </p>
                <span className="text-[8px] tracking-[0.12em] uppercase flex-shrink-0 mt-0.5"
                  style={{ color: COLORS.gold, fontFamily: FONT.mono }}>GEMINI</span>
              </div>
            ) : (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: DOT_COLOR[ins.type] ?? DOT_COLOR.neutral }} />
                <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
                  {ins.text}
                </p>
              </div>
            )
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: `${COLORS.gold}15`, border: `1px solid ${COLORS.goldBorder}` }}>
            <Zap size={14} style={{ color: COLORS.gold }} />
          </div>
          <div className="text-center space-y-1">
            <p className="text-[10px] font-medium tracking-[0.08em]"
              style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
              {isEmpty ? 'No sessions logged yet' : 'Complete more sessions to unlock insights'}
            </p>
            <p className="text-[9px]" style={{ color: COLORS.textMuted, fontFamily: FONT.mono }}>
              {isEmpty ? 'Complete your first session to unlock pattern detection' : 'Trend analysis activates after a few sessions'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}