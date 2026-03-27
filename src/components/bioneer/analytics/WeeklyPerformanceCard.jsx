import React, { useMemo } from 'react';
import { COLORS, FONT, scoreColor } from '../ui/DesignTokens';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getAllSessions } from '../data/unifiedSessionStore';

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

export default function WeeklyPerformanceCard() {
  const data = useMemo(() => {
    const sessions = getAllSessions();
    if (!sessions.length) return null;

    const now = new Date();
    const thisWeekStart = startOfWeek(now);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const thisWeek = sessions.filter(s => s.started_at && new Date(s.started_at) >= thisWeekStart);
    const lastWeek = sessions.filter(s => {
      if (!s.started_at) return false;
      const d = new Date(s.started_at);
      return d >= lastWeekStart && d < thisWeekStart;
    });

    if (!thisWeek.length) return null;

    const avgScore = (arr) => {
      const valid = arr.filter(s => s.average_form_score > 0);
      return valid.length ? Math.round(valid.reduce((s, r) => s + r.average_form_score, 0) / valid.length) : 0;
    };

    const thisAvg = avgScore(thisWeek);
    const lastAvg = avgScore(lastWeek);
    const scoreDelta = lastAvg ? thisAvg - lastAvg : null;

    const totalReps = thisWeek.reduce((s, r) => s + (r.reps_detected || r.rep_count || 0), 0);

    // Most improved movement this week vs all-time
    const movScores = {};
    thisWeek.forEach(s => {
      const m = s.movement_id || s.exercise_id;
      if (!m) return;
      if (!movScores[m]) movScores[m] = [];
      movScores[m].push(s.average_form_score || 0);
    });

    const allScores = {};
    sessions.forEach(s => {
      const m = s.movement_id || s.exercise_id;
      if (!m) return;
      if (!allScores[m]) allScores[m] = [];
      allScores[m].push(s.average_form_score || 0);
    });

    let mostImproved = null;
    let bestDelta = -Infinity;
    Object.entries(movScores).forEach(([m, scores]) => {
      const weekAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const allAvg = (allScores[m] || []).reduce((a, b) => a + b, 0) / (allScores[m]?.length || 1);
      const delta = weekAvg - allAvg;
      if (delta > bestDelta) { bestDelta = delta; mostImproved = m; }
    });

    // Primary focus area (most faults this week)
    const faultCounts = {};
    thisWeek.forEach(s => {
      (s.top_faults || []).forEach(f => { faultCounts[f] = (faultCounts[f] || 0) + 1; });
    });
    const primaryFocus = Object.entries(faultCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return { sessionsCount: thisWeek.length, totalReps, thisAvg, scoreDelta, mostImproved, primaryFocus };
  }, []);

  if (!data) return null;

  const { sessionsCount, totalReps, thisAvg, scoreDelta, mostImproved, primaryFocus } = data;

  const DeltaIcon = scoreDelta === null ? Minus : scoreDelta > 0 ? TrendingUp : scoreDelta < 0 ? TrendingDown : Minus;
  const deltaColor = scoreDelta === null ? COLORS.textTertiary : scoreDelta > 0 ? COLORS.correct : scoreDelta < 0 ? COLORS.fault : COLORS.textTertiary;

  return (
    <div className="rounded-lg border relative overflow-hidden"
      style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      {/* Gold left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: COLORS.gold }} />

      <div className="pl-5 pr-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[9px] tracking-[0.2em] uppercase font-bold"
            style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
            This Week
          </h3>
          <span className="text-[8px] tracking-[0.1em] uppercase"
            style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            7-day summary
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Sessions */}
          <div>
            <p className="text-[8px] tracking-[0.12em] uppercase mb-1" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>Sessions</p>
            <p className="text-2xl font-bold" style={{ color: COLORS.textPrimary, fontFamily: FONT.mono }}>{sessionsCount}</p>
          </div>

          {/* Total reps */}
          <div>
            <p className="text-[8px] tracking-[0.12em] uppercase mb-1" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>Total Reps</p>
            <p className="text-2xl font-bold" style={{ color: COLORS.textPrimary, fontFamily: FONT.mono }}>{totalReps}</p>
          </div>

          {/* Avg score with delta */}
          <div>
            <p className="text-[8px] tracking-[0.12em] uppercase mb-1" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>Avg Form</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold" style={{ color: scoreColor(thisAvg), fontFamily: FONT.mono }}>{thisAvg}</p>
              {scoreDelta !== null && (
                <div className="flex items-center gap-0.5 mb-1">
                  <DeltaIcon size={11} style={{ color: deltaColor }} />
                  <span className="text-[9px] font-bold" style={{ color: deltaColor, fontFamily: FONT.mono }}>
                    {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Most improved */}
          <div>
            <p className="text-[8px] tracking-[0.12em] uppercase mb-1" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>Most Improved</p>
            <p className="text-[11px] font-bold leading-tight" style={{ color: COLORS.correct, fontFamily: FONT.mono }}>
              {mostImproved ? mostImproved.replace(/_/g, ' ').toUpperCase() : '—'}
            </p>
          </div>
        </div>

        {primaryFocus && (
          <div className="mt-3 pt-3 border-t flex items-center gap-2" style={{ borderColor: COLORS.border }}>
            <span className="text-[8px] tracking-[0.12em] uppercase" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
              Focus Area:
            </span>
            <span className="text-[9px] font-bold tracking-[0.08em]" style={{ color: COLORS.warning, fontFamily: FONT.mono }}>
              {primaryFocus.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}