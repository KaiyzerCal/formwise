import React from 'react';
import { COLORS, FONT, scoreColor } from '../ui/DesignTokens';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import InsufficientDataCard from './InsufficientDataCard';

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

export default function FormTrendChart({ trendData }) {
  if (!trendData || trendData.insufficient) {
    return (
      <InsufficientDataCard
        title="Form Score Trend"
        message="Complete at least 2 sessions to see your form score trend."
      />
    );
  }

  const { data, trend } = trendData;
  const avg = Math.round(data.reduce((s, d) => s + d.score, 0) / data.length);
  const trendLabel = trend > 3 ? `+${Math.round(trend)} pts` : trend < -3 ? `${Math.round(trend)} pts` : 'Stable';
  const trendColor = trend > 3 ? COLORS.correct : trend < -3 ? COLORS.fault : COLORS.textTertiary;

  return (
    <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[9px] tracking-[0.15em] uppercase" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          Form Score Trend
        </h3>
        <span className="text-[9px] px-2 py-0.5 rounded-full"
          style={{ background: `${trendColor}20`, color: trendColor, fontFamily: FONT.mono }}>
          {trendLabel} overall
        </span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: COLORS.textTertiary, fontSize: 9, fontFamily: FONT.mono }}
            axisLine={{ stroke: COLORS.border }} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: COLORS.textTertiary, fontSize: 9, fontFamily: FONT.mono }}
            axisLine={{ stroke: COLORS.border }} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={avg} stroke={COLORS.border} strokeDasharray="4 3" strokeWidth={1} />
          <Line type="monotone" dataKey="score" stroke={COLORS.gold} strokeWidth={2}
            dot={{ r: 3, fill: COLORS.gold, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: COLORS.gold }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}