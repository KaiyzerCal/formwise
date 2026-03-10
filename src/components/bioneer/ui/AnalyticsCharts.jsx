import React from "react";
import { COLORS, FONT, scoreColor, faultColor } from "./DesignTokens";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, ReferenceLine, Tooltip, Cell } from "recharts";

export default function AnalyticsCharts({ romTrend, repScores, faultFreq, insights }) {
  const avgRepScore = Math.round(repScores.reduce((a, b) => a + b, 0) / repScores.length);
  const repData = repScores.map((s, i) => ({ rep: `R${i + 1}`, score: s }));

  return (
    <div className="space-y-3">
      {/* Row 1: ROM + Rep Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* ROM Trend */}
        <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[9px] tracking-[0.15em] uppercase" style={{ color: COLORS.textTertiary }}>Range of Motion Trend</h3>
            <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: `${COLORS.correct}20`, color: COLORS.correct }}>+12.4% over 8 sessions</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={romTrend}>
              <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
              <XAxis dataKey="session" tick={{ fill: COLORS.textTertiary, fontSize: 9 }} axisLine={{ stroke: COLORS.border }} />
              <YAxis domain={[85, 115]} tick={{ fill: COLORS.textTertiary, fontSize: 9 }} axisLine={{ stroke: COLORS.border }} />
              <Tooltip contentStyle={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 10, fontFamily: FONT.mono }} />
              <Line type="monotone" dataKey="rom" stroke={COLORS.gold} strokeWidth={2} dot={{ r: 3, fill: COLORS.gold }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Rep Quality */}
        <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[9px] tracking-[0.15em] uppercase" style={{ color: COLORS.textTertiary }}>Rep Quality This Session</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={repData}>
              <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
              <XAxis dataKey="rep" tick={{ fill: COLORS.textTertiary, fontSize: 9 }} axisLine={{ stroke: COLORS.border }} />
              <YAxis domain={[50, 100]} tick={{ fill: COLORS.textTertiary, fontSize: 9 }} axisLine={{ stroke: COLORS.border }} />
              <ReferenceLine y={avgRepScore} stroke={COLORS.textTertiary} strokeDasharray="6 3" strokeWidth={1} />
              <Bar dataKey="score" radius={[3, 3, 0, 0]}>
                {repData.map((d, i) => (
                  <Cell key={i} fill={scoreColor(d.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Fault Frequency + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Fault Frequency */}
        <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
          <h3 className="text-[9px] tracking-[0.15em] uppercase mb-3" style={{ color: COLORS.textTertiary }}>Fault Frequency</h3>
          <div className="space-y-2.5">
            {faultFreq.map(f => (
              <div key={f.fault} className="flex items-center gap-3">
                <span className="text-[10px] w-28 truncate" style={{ color: COLORS.textSecondary }}>{f.fault}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${f.pct}%`, background: faultColor(f.pct) }} />
                </div>
                <span className="text-[10px] w-8 text-right font-bold" style={{ color: faultColor(f.pct) }}>{f.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
          <h3 className="text-[9px] tracking-[0.15em] uppercase mb-3" style={{ color: COLORS.textTertiary }}>AI Session Insights</h3>
          <div className="space-y-2.5">
            {insights.map((ins, i) => {
              const dotColor = ins.type === 'improvement' ? COLORS.correct : ins.type === 'warning' ? COLORS.warning : COLORS.fault;
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: dotColor }} />
                  <span className="text-[10px] leading-relaxed" style={{ color: COLORS.textSecondary }}>{ins.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}