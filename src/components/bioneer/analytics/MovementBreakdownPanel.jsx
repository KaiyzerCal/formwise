import React from 'react';
import { COLORS, FONT, scoreColor } from '../ui/DesignTokens';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import InsufficientDataCard from './InsufficientDataCard';

export default function MovementBreakdownPanel({ breakdownData }) {
  if (!breakdownData || breakdownData.insufficient || !breakdownData.data.length) {
    return (
      <InsufficientDataCard
        title="Movement Breakdown"
        message="No movement data recorded yet."
      />
    );
  }

  const { data, mostImproved, lowestScoring } = breakdownData;

  return (
    <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <h3 className="text-[9px] tracking-[0.15em] uppercase mb-3" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
        Movement Breakdown
      </h3>

      {/* Movement rows */}
      <div className="space-y-2.5 mb-4">
        {data.map(m => (
          <div key={m.id} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] truncate" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
                  {m.name}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-[9px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                    {m.sessions} sess · {m.totalReps} reps
                  </span>
                  {m.avgScore != null && (
                    <span className="text-[10px] font-bold w-6 text-right" style={{ color: scoreColor(m.avgScore), fontFamily: FONT.mono }}>
                      {m.avgScore}
                    </span>
                  )}
                </div>
              </div>
              {m.avgScore != null && (
                <div className="h-1 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
                  <div className="h-full rounded-full"
                    style={{ width: `${m.avgScore}%`, background: scoreColor(m.avgScore) }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Highlights */}
      <div className="space-y-2 border-t pt-3" style={{ borderColor: COLORS.border }}>
        {mostImproved && mostImproved.improvement > 0 && (
          <div className="flex items-start gap-2">
            <TrendingUp size={11} className="mt-0.5 flex-shrink-0" style={{ color: COLORS.correct }} />
            <span className="text-[10px] leading-relaxed" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
              Most improved: <span style={{ color: COLORS.textSecondary }}>{mostImproved.name}</span>{' '}
              (+{Math.round(mostImproved.improvement)} pts)
            </span>
          </div>
        )}
        {lowestScoring && (
          <div className="flex items-start gap-2">
            <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" style={{ color: COLORS.warning }} />
            <span className="text-[10px] leading-relaxed" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
              Needs focus: <span style={{ color: COLORS.textSecondary }}>{lowestScoring.name}</span>{' '}
              (avg {lowestScoring.avgScore})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}