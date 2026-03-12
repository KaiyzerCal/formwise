import React from 'react';
import { COLORS, FONT, scoreColor } from '../ui/DesignTokens';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border px-3 py-2 text-[10px] space-y-1"
      style={{ background: '#0e0e0e', borderColor: COLORS.border, fontFamily: FONT.mono }}>
      <div style={{ color: COLORS.textTertiary }}>{d.label}</div>
      <div style={{ color: scoreColor(d.score) }}>Score: <strong>{d.score}</strong></div>
      {d.peak && <div style={{ color: COLORS.textTertiary }}>Peak: {d.peak}</div>}
      <div style={{ color: COLORS.textTertiary }} className="truncate max-w-[120px]">{d.movement}</div>
    </div>
  );
};

// Zero-state baseline — flat line at 0 for visual presence
const ZERO_DATA = [
  { label: 'S1', score: 0 }, { label: 'S2', score: 0 },
  { label: 'S3', score: 0 }, { label: 'S4', score: 0 },
  { label: 'S5', score: 0 },
];

export default function FormTrendChart({ trendData }) {
  const isEmpty  = !trendData || trendData.isEmpty;
  const needsMore = trendData?.insufficient && !trendData?.isEmpty; // 1 session
  const hasData  = trendData && !trendData.insufficient && trendData.data?.length >= 2;

  const { data, trend } = hasData ? trendData : { data: ZERO_DATA, trend: 0 };
  const avg       = hasData ? Math.round(data.reduce((s, d) => s + d.score, 0) / data.length) : 0;
  const trendLabel = hasData
    ? (trend > 3 ? `+${Math.round(trend)} pts` : trend < -3 ? `${Math.round(trend)} pts` : 'Stable')
    : 'No data yet';
  const trendColor = hasData
    ? (trend > 3 ? COLORS.correct : trend < -3 ? COLORS.fault : COLORS.textTertiary)
    : COLORS.textMuted;

  return (
    <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[9px] tracking-[0.15em] uppercase" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          Form Score Trend
        </h3>
        <span className="text-[9px] px-2 py-0.5 rounded-full"
          style={{ background: `${trendColor}20`, color: trendColor, fontFamily: FONT.mono }}>
          {trendLabel}
        </span>
      </div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fill: COLORS.textTertiary, fontSize: 9, fontFamily: FONT.mono }}
              axisLine={{ stroke: COLORS.border }} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: COLORS.textTertiary, fontSize: 9, fontFamily: FONT.mono }}
              axisLine={{ stroke: COLORS.border }} tickLine={false} />
            {hasData && <Tooltip content={<CustomTooltip />} />}
            {hasData && <ReferenceLine y={avg} stroke={COLORS.border} strokeDasharray="4 3" strokeWidth={1} />}
            <Line type="monotone" dataKey="score"
              stroke={hasData ? COLORS.gold : COLORS.border}
              strokeWidth={hasData ? 2 : 1}
              strokeDasharray={hasData ? undefined : '4 4'}
              dot={hasData ? { r: 3, fill: COLORS.gold, strokeWidth: 0 } : false}
              activeDot={hasData ? { r: 5, fill: COLORS.gold } : false} />
          </LineChart>
        </ResponsiveContainer>
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-[10px] tracking-[0.1em] uppercase text-center px-4"
              style={{ color: COLORS.textMuted, fontFamily: FONT.mono }}>
              {isEmpty ? 'Complete your first session to track form trends' : 'One more session to unlock trend analysis'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}