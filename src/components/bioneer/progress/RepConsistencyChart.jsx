import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { COLORS, FONT } from "../ui/DesignTokens";

export default function RepConsistencyChart({ sessions }) {
  const chartData = sessions
    .filter(s => s.reps && s.reps.length > 0)
    .map((session) => {
      const repScores = session.reps.map(r => r.score).filter(s => s != null && !isNaN(s));
      const consistency =
        repScores.length > 0
          ? Math.round((Math.max(...repScores) - Math.min(...repScores)) / Math.max(...repScores) * 100)
          : 0;

      return {
        date: new Date(session.started_at || 0).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        consistency: 100 - consistency,
        fullDate: session.started_at,
      };
    });

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
        <h3 className="text-xs font-bold tracking-[0.1em] uppercase mb-3" style={{ color: COLORS.textPrimary, fontFamily: FONT.mono }}>
          Rep Consistency
        </h3>
        <div className="h-32 flex items-center justify-center text-[10px]" style={{ color: COLORS.textTertiary }}>
          No rep data available
        </div>
      </div>
    );
  }

  const avgConsistency = Math.round(chartData.reduce((sum, d) => sum + d.consistency, 0) / chartData.length);

  return (
    <div className="rounded-xl border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <div className="mb-4">
        <h3 className="text-xs font-bold tracking-[0.1em] uppercase mb-1" style={{ color: COLORS.textPrimary, fontFamily: FONT.mono }}>
          Rep Consistency
        </h3>
        <div>
          <span className="text-lg font-bold" style={{ color: COLORS.correct, fontFamily: FONT.mono }}>
            {avgConsistency}%
          </span>
          <span className="text-[10px]" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
            {" "}average
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: COLORS.textTertiary }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: COLORS.textTertiary }} />
          <Tooltip
            contentStyle={{ background: COLORS.surfaceHover, border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}
            labelStyle={{ color: COLORS.textPrimary }}
            formatter={(value) => `${value}%`}
          />
          <Line
            type="monotone"
            dataKey="consistency"
            stroke={COLORS.correct}
            strokeWidth={2}
            dot={{ fill: COLORS.correct, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}