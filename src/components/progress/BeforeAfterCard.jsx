/**
 * BeforeAfterCard — Visual comparison of first vs latest session
 */
import React from 'react';
import { COLORS, FONT, scoreColor } from '@/components/bioneer/ui/DesignTokens';
import { ArrowRight, TrendingUp } from 'lucide-react';

export default function BeforeAfterCard({ sessions }) {
  if (sessions.length < 2) return null;

  const first = sessions[0];
  const latest = sessions[sessions.length - 1];
  const firstScore = Math.round(first.average_form_score || 0);
  const latestScore = Math.round(latest.average_form_score || 0);
  const delta = latestScore - firstScore;

  return (
    <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[8px] tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.textTertiary }}>
          Before → After
        </p>
        {delta !== 0 && (
          <span className="text-[9px] font-bold flex items-center gap-1" style={{ color: delta > 0 ? COLORS.correct : COLORS.fault }}>
            <TrendingUp size={10} /> {delta > 0 ? '+' : ''}{delta} pts
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Before */}
        <div className="flex-1 text-center py-3 rounded-lg border" style={{ borderColor: COLORS.border }}>
          <div className="text-2xl font-bold" style={{ color: scoreColor(firstScore) }}>{firstScore}</div>
          <p className="text-[7px] tracking-[0.1em] uppercase mt-1" style={{ color: COLORS.textTertiary }}>
            First Session
          </p>
          <p className="text-[7px] mt-0.5" style={{ color: COLORS.textMuted }}>
            {first.started_at ? new Date(first.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
          </p>
        </div>

        <ArrowRight size={16} style={{ color: COLORS.textTertiary }} className="flex-shrink-0" />

        {/* After */}
        <div className="flex-1 text-center py-3 rounded-lg border" style={{ borderColor: COLORS.goldBorder, background: COLORS.goldDim }}>
          <div className="text-2xl font-bold" style={{ color: scoreColor(latestScore) }}>{latestScore}</div>
          <p className="text-[7px] tracking-[0.1em] uppercase mt-1" style={{ color: COLORS.gold }}>
            Latest Session
          </p>
          <p className="text-[7px] mt-0.5" style={{ color: COLORS.textTertiary }}>
            {latest.started_at ? new Date(latest.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
          </p>
        </div>
      </div>
    </div>
  );
}