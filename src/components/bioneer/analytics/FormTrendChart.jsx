import React from 'react';
import { COLORS, FONT, scoreColor } from '../ui/DesignTokens';
import {
  ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-lg border px-3 py-2 text-[10px] space-y-1"
      style={{ background: '#0e0e0e', borderColor: COLORS.border, fontFamily: FONT.mono }}>
      <div style={{ color: COLORS.textTertiary }}>{d?.label}</div>
      <div style={{ color: scoreColor(d?.score ?? 0) }}>Session avg: <strong>{d?.score}</strong></div>
      {d?.movingAvg != null && <div style={{ color: COLORS.gold }}>5-session avg: {Math.round(d.movingAvg)}</div>}
      {d?.movement && <div style={{ color: COLORS.textTertiary }} className="truncate max-w-[140px]">{d.movement}</div>}
    </div>
  );
};

// Compute 5-session moving average
function withMovingAvg(data) {
  return data.map((d, i, arr) => {
    const window = arr.slice(Math.max(0, i - 4), i + 1);
    const avg = window.reduce((s, x) => s + (x.score || 0), 0) / window.length;
    return { ...d, movingAvg: Math.round(avg * 10) / 10 };
  });
}

const ZERO_DATA = [
  { label: 'S1', score: 0 }, { label: 'S2', score: 0 },
  { label: 'S3', score: 0 }, { label: 'S4', score: 0 },
  { label: 'S5', score: 0 },
];

export default function FormTrendChart({ trendData }) {
  const isEmpty   = !trendData || trendData.isEmpty;
  const hasData   = trendData && !trendData.insufficient && trendData.data?.length >= 2;

  const rawData = hasData ? trendData.data.slice(-20) : ZERO_DATA;
  const data    = hasData ? withMovingAvg(rawData) : rawData;

  const trend      = hasData ? trendData.trend : 0;
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
        <span className="text-[9px] px-2 py-0.5 rounded"
          style={{ background: `${trendColor}20`, color: trendColor, fontFamily: FONT.mono }}>
          {trendLabel}
        </span>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={170}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fill: COLORS.textTertiary, fontSize: 9, fontFamily: FONT.mono }}
              axisLine={{ stroke: COLORS.border }} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: COLORS.textTertiary, fontSize: 9, fontFamily: FONT.mono }}
              axisLine={{ stroke: COLORS.border }} tickLine={false} />
            {hasData && <Tooltip content={<CustomTooltip />} />}

            {/* Reference lines */}
            <ReferenceLine y={70} stroke={COLORS.warning} strokeDasharray="3 3" strokeWidth={1}
              label={{ value: 'DEVELOPING', position: 'right', fill: COLORS.warning, fontSize: 7, fontFamily: FONT.mono }} />
            <ReferenceLine y={85} stroke={COLORS.correct} strokeDasharray="3 3" strokeWidth={1}
              label={{ value: 'STRONG', position: 'right', fill: COLORS.correct, fontSize: 7, fontFamily: FONT.mono }} />

            {/* Individual rep dots (low opacity) — rendered as scatter would require rep data, use line dots */}
            <Line
              type="monotone"
              dataKey="score"
              stroke={hasData ? 'rgba(201,162,39,0.5)' : COLORS.border}
              strokeWidth={hasData ? 1.5 : 1}
              strokeDasharray={hasData ? undefined : '4 4'}
              dot={hasData ? { r: 4, fill: COLORS.gold, fillOpacity: 0.45, strokeWidth: 0 } : false}
              activeDot={hasData ? { r: 5, fill: COLORS.gold } : false}
              name="Session avg"
            />

            {/* 5-session moving average in bright gold */}
            {hasData && (
              <Line
                type="monotone"
                dataKey="movingAvg"
                stroke={COLORS.gold}
                strokeWidth={2}
                dot={false}
                activeDot={false}
                name="5-session avg"
              />
            )}
          </ComposedChart>
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