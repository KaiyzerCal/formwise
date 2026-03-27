/**
 * ProgressionPanel.jsx
 * Shows form score trend, best session, consistency rating, and primary fault focus
 * for a selected movement.
 */
import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { COLORS, FONT, scoreColor } from "../ui/DesignTokens";
import { getAllSessions } from "../data/unifiedSessionStore";
import { getConsistencyRating } from "../learning/ConsistencyAnalyzer";
import { analyzeConsistency } from "../learning/ConsistencyAnalyzer";

export default function ProgressionPanel({ movement }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!movement) return;
    const sessions = getAllSessions()
      .filter(s => (s.movement_id || s.exercise_id) === movement)
      .sort((a, b) => (a.started_at || 0) - (b.started_at || 0))
      .slice(-10);

    if (!sessions.length) { setData(null); return; }

    const chartData = sessions.map((s, i) => ({
      label: `S${i + 1}`,
      score: s.average_form_score ?? 0,
      date: s.started_at ? new Date(s.started_at).toLocaleDateString() : '',
    }));

    const best = sessions.reduce((b, s) => ((s.average_form_score ?? 0) > (b.average_form_score ?? 0) ? s : b), sessions[0]);

    // Derive consistency from rep summaries if available
    const allReps = sessions.flatMap(s => s.rep_summaries ?? []).map(r => ({
      formScore: r.form_score ?? 0,
      repDuration: r.duration ?? 1,
      kneeAngleMin: 90,
      kneeAngleMax: 160,
      stabilityVariance: 0,
    }));

    const consistency = allReps.length >= 2
      ? analyzeConsistency({ allMetrics: allReps, avgFormScore: 0 })
      : null;
    const consistencyRating = consistency ? getConsistencyRating(consistency.consistencyScore) : null;

    // Primary fault
    const faultCounts = {};
    sessions.forEach(s => {
      (s.top_faults ?? []).forEach(f => { faultCounts[f] = (faultCounts[f] || 0) + 1; });
    });
    const primaryFault = Object.entries(faultCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    setData({ chartData, best, consistencyRating, primaryFault });
  }, [movement]);

  if (!data) {
    return (
      <div className="rounded-lg border p-5" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
        <span className="text-[9px] tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          PROGRESSION
        </span>
        <p className="text-[10px] mt-3" style={{ color: COLORS.textMuted, fontFamily: FONT.mono }}>
          No sessions for this movement yet.
        </p>
      </div>
    );
  }

  const { chartData, best, consistencyRating, primaryFault } = data;

  return (
    <div className="rounded-lg border p-5 space-y-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <span className="text-[9px] tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
        PROGRESSION · {movement.replace(/_/g, ' ').toUpperCase()}
      </span>

      {/* Line chart */}
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={COLORS.border} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: COLORS.textTertiary, fontSize: 9, fontFamily: FONT.mono }} axisLine={false} tickLine={false} />
          <YAxis domain={[50, 100]} tick={{ fill: COLORS.textTertiary, fontSize: 9, fontFamily: FONT.mono }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontFamily: FONT.mono, fontSize: 10 }}
            labelStyle={{ color: COLORS.textTertiary }}
            itemStyle={{ color: COLORS.gold }}
            formatter={(v) => [v, 'Form Score']}
          />
          <Line type="monotone" dataKey="score" stroke={COLORS.gold} strokeWidth={1.5} dot={{ fill: COLORS.gold, r: 2 }} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Best session */}
        <div className="rounded border p-3" style={{ background: COLORS.bg, borderColor: COLORS.border }}>
          <span className="text-[8px] tracking-[0.1em] uppercase block mb-1" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>BEST SESSION</span>
          <span className="text-lg font-bold" style={{ color: scoreColor(best.average_form_score ?? 0), fontFamily: FONT.heading }}>
            {best.average_form_score ?? 0}
          </span>
          {best.started_at && (
            <span className="text-[8px] block mt-0.5" style={{ color: COLORS.textMuted, fontFamily: FONT.mono }}>
              {new Date(best.started_at).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Consistency */}
        <div className="rounded border p-3" style={{ background: COLORS.bg, borderColor: COLORS.border }}>
          <span className="text-[8px] tracking-[0.1em] uppercase block mb-1" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>CONSISTENCY</span>
          {consistencyRating ? (
            <span className="text-xs font-bold" style={{ color: consistencyRating.color, fontFamily: FONT.heading }}>
              {consistencyRating.label}
            </span>
          ) : (
            <span className="text-[9px]" style={{ color: COLORS.textMuted, fontFamily: FONT.mono }}>N/A</span>
          )}
        </div>

        {/* Primary fault */}
        <div className="rounded border p-3" style={{ background: COLORS.bg, borderColor: COLORS.border }}>
          <span className="text-[8px] tracking-[0.1em] uppercase block mb-1" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>PRIMARY FAULT</span>
          <span className="text-[9px] font-bold" style={{ color: primaryFault ? COLORS.fault : COLORS.correct, fontFamily: FONT.mono }}>
            {primaryFault ? primaryFault.replace(/_/g, ' ') : 'None'}
          </span>
        </div>
      </div>
    </div>
  );
}