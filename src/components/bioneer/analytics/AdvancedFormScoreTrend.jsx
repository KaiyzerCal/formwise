import React, { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { motion } from "framer-motion";
import { getAllSessions } from "../data/unifiedSessionStore";
import { COLORS, FONT } from "../ui/DesignTokens";
import { ChevronDown } from "lucide-react";

const DATE_RANGES = [
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
  { label: "All Time", days: Infinity },
];

export default function AdvancedFormScoreTrend() {
  const [selectedRange, setSelectedRange] = useState(30);
  const [showDropdown, setShowDropdown] = useState(false);

  const trendData = useMemo(() => {
    const sessions = getAllSessions();
    if (!sessions.length) return [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - selectedRange);

    const filtered = sessions
      .filter(s => {
        const sessionDate = new Date(s.started_at || s.created_date);
        return sessionDate >= cutoffDate;
      })
      .sort((a, b) => new Date(a.started_at || a.created_date) - new Date(b.started_at || b.created_date));

    return filtered.map(s => ({
      date: new Date(s.started_at || s.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: Math.round(s.form_score_overall || s.average_form_score || 0),
      movement: s.exercise_id || s.movement_id || 'Unknown',
    }));
  }, [selectedRange]);

  const stats = useMemo(() => {
    if (!trendData.length) return { avg: 0, max: 0, min: 0, trend: 0 };
    const scores = trendData.map(d => d.score);
    const avg = Math.round(scores.reduce((a, b) => a + b) / scores.length);
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const trend = scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0;
    return { avg, max, min, trend };
  }, [trendData]);

  const rangeName = DATE_RANGES.find(r => r.days === selectedRange)?.label || "Last 30 Days";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border p-4 lg:p-5 space-y-4"
      style={{
        background: COLORS.surface,
        borderColor: COLORS.border,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold tracking-[0.15em] uppercase"
            style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
            Form Score Trend
          </h3>
          <p className="text-[9px] mt-1"
            style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            Progress over {rangeName.toLowerCase()}
          </p>
        </div>

        {/* Date Range Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-bold tracking-[0.1em] uppercase transition-all"
            style={{
              background: showDropdown ? COLORS.goldDim : 'transparent',
              borderColor: showDropdown ? COLORS.goldBorder : COLORS.border,
              color: showDropdown ? COLORS.gold : COLORS.textSecondary,
              fontFamily: FONT.mono,
            }}
          >
            {rangeName.split(' ').slice(0, 2).join(' ')}
            <ChevronDown size={12} />
          </button>

          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full right-0 mt-1 rounded-lg border bg-surface z-10 shadow-lg"
              style={{ borderColor: COLORS.border, background: COLORS.surface }}
            >
              {DATE_RANGES.map(range => (
                <button
                  key={range.days}
                  onClick={() => {
                    setSelectedRange(range.days);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-[10px] font-bold tracking-[0.1em] uppercase border-b hover:opacity-80 transition-opacity last:border-b-0"
                  style={{
                    borderColor: COLORS.border,
                    color: selectedRange === range.days ? COLORS.gold : COLORS.textSecondary,
                    fontFamily: FONT.mono,
                  }}
                >
                  {range.label}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Stats */}
      {trendData.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded px-2 py-2" style={{ background: COLORS.goldDim, border: `1px solid ${COLORS.goldBorder}` }}>
            <p className="text-[8px] tracking-[0.1em] uppercase"
              style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>Avg</p>
            <p className="text-sm font-bold mt-0.5"
              style={{ color: COLORS.gold, fontFamily: FONT.mono }}>{stats.avg}</p>
          </div>
          <div className="rounded px-2 py-2" style={{ background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.3)' }}>
            <p className="text-[8px] tracking-[0.1em] uppercase"
              style={{ color: COLORS.correct, fontFamily: FONT.mono }}>Peak</p>
            <p className="text-sm font-bold mt-0.5"
              style={{ color: COLORS.correct, fontFamily: FONT.mono }}>{stats.max}</p>
          </div>
          <div className="rounded px-2 py-2" style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)' }}>
            <p className="text-[8px] tracking-[0.1em] uppercase"
              style={{ color: COLORS.fault, fontFamily: FONT.mono }}>Low</p>
            <p className="text-sm font-bold mt-0.5"
              style={{ color: COLORS.fault, fontFamily: FONT.mono }}>{stats.min}</p>
          </div>
          <div className="rounded px-2 py-2" style={{ background: stats.trend >= 0 ? 'rgba(0,229,160,0.1)' : 'rgba(255,68,68,0.1)', border: stats.trend >= 0 ? '1px solid rgba(0,229,160,0.3)' : '1px solid rgba(255,68,68,0.3)' }}>
            <p className="text-[8px] tracking-[0.1em] uppercase"
              style={{ color: stats.trend >= 0 ? COLORS.correct : COLORS.fault, fontFamily: FONT.mono }}>Trend</p>
            <p className="text-sm font-bold mt-0.5"
              style={{ color: stats.trend >= 0 ? COLORS.correct : COLORS.fault, fontFamily: FONT.mono }}>
              {stats.trend >= 0 ? '+' : ''}{stats.trend}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      {trendData.length > 0 ? (
        <div className="h-64 -mx-4 lg:-mx-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis
                dataKey="date"
                tick={{ fill: COLORS.textTertiary, fontSize: 10 }}
                stroke={COLORS.border}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: COLORS.textTertiary, fontSize: 10 }}
                stroke={COLORS.border}
              />
              <Tooltip
                contentStyle={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                }}
                labelStyle={{ color: COLORS.gold }}
                formatter={(value) => `${value}`}
              />
              <ReferenceLine y={stats.avg} stroke={COLORS.goldDim} strokeDasharray="5 5" label={{ fill: COLORS.gold, fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="score"
                stroke={COLORS.gold}
                dot={{ fill: COLORS.gold, r: 4 }}
                activeDot={{ r: 6 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center"
          style={{ color: COLORS.textTertiary }}>
          <p className="text-xs">No data for selected range</p>
        </div>
      )}
    </motion.div>
  );
}