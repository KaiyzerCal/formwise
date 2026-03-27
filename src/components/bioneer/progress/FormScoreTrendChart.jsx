import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { COLORS, FONT } from "../ui/DesignTokens";

export default function FormScoreTrendChart({ sessions }) {
  const chartData = sessions.map((session, idx) => ({
    date: new Date(session.started_at || 0).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: Math.round(session.movement_score ?? session.form_score_overall ?? 0),
    fullDate: session.started_at,
  }));

  const avgScore = Math.round(chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length);
  const maxScore = Math.max(...chartData.map(d => d.score));

  return (
    <div className="rounded-xl border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <div className="mb-4">
        <h3 className="text-xs font-bold tracking-[0.1em] uppercase mb-1" style={{ color: COLORS.textPrimary, fontFamily: FONT.mono }}>
          Form Score Trend
        </h3>
        <div className="flex items-baseline gap-3">
          <div>
            <span className="text-lg font-bold" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
              {avgScore}
            </span>
            <span className="text-[10px]" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
              {" "}avg
            </span>
          </div>
          <div>
            <span className="text-sm" style={{ color: COLORS.correct, fontFamily: FONT.mono }}>
              {maxScore}
            </span>
            <span className="text-[10px]" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
              {" "}peak
            </span>
          </div>
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
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke={COLORS.gold}
            strokeWidth={2}
            dot={{ fill: COLORS.gold, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}