import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";
import { COLORS, FONT, scoreColor, faultColor } from "../components/bioneer/ui/DesignTokens";
import { MOCK_SESSIONS, MOCK_ROM_TREND, MOCK_FAULT_FREQ, MOCK_INSIGHTS, MOCK_SYMMETRY, MOCK_BODY_HEATMAP } from "../components/bioneer/ui/mockData";
import { getAggregateStats, getScoreTrendData, getAllSessions } from "../components/bioneer/data/sessionStore";
import { TrendingUp, Calendar, Activity, Target } from "lucide-react";
import StatCard from "../components/bioneer/ui/StatCard";
import ScoreRing from "../components/bioneer/ui/ScoreRing";
import AnalyticsCharts from "../components/bioneer/ui/AnalyticsCharts";
import BodyHeatmap from "../components/bioneer/ui/BodyHeatmap";

export default function Analytics() {
  const realStats   = useMemo(() => getAggregateStats(), []);
  const hasRealData = !!realStats;

  // Prefer real data; fall back to mock only when no sessions saved yet
  const mockSessions = MOCK_SESSIONS;
  const avgScore    = hasRealData ? realStats.avgScore   : Math.round(mockSessions.reduce((a, s) => a + s.score, 0) / mockSessions.length);
  const totalReps   = hasRealData ? realStats.totalReps  : mockSessions.reduce((a, s) => a + s.reps, 0);
  const sessionCount = hasRealData ? realStats.sessionCount : mockSessions.length;
  const latestRepScores = hasRealData ? [] : mockSessions[mockSessions.length - 1].repScores;
  const avgRepQ = latestRepScores.length
    ? Math.round(latestRepScores.reduce((a, b) => a + b, 0) / latestRepScores.length)
    : avgScore;

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 space-y-4" style={{ fontFamily: FONT.mono }}>
      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Overall Score" icon={Target} color={COLORS.gold}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <ScoreRing score={avgScore} size={56} strokeWidth={3} fontSize={18} />
            </div>
          </div>
        </StatCard>
        <StatCard label="Avg Rep Quality" icon={Activity} color={scoreColor(avgRepQ)}>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold" style={{ color: scoreColor(avgRepQ), fontFamily: FONT.heading }}>{avgRepQ}%</span>
            <TrendingUp size={14} style={{ color: COLORS.correct }} />
          </div>
        </StatCard>
        <StatCard label="Consistency" icon={Activity}>
          <span className="text-sm font-bold" style={{ color: COLORS.correct, fontFamily: FONT.heading }}>Highly Consistent</span>
        </StatCard>
        <StatCard label="Sessions Tracked" icon={Calendar} color={COLORS.gold}>
          <span className="text-2xl font-bold" style={{ color: COLORS.textPrimary, fontFamily: FONT.heading }}>{sessions.length}</span>
        </StatCard>
      </div>

      {/* Charts row */}
      <AnalyticsCharts
        romTrend={MOCK_ROM_TREND}
        repScores={latestRepScores}
        faultFreq={MOCK_FAULT_FREQ}
        insights={MOCK_INSIGHTS}
        symmetry={MOCK_SYMMETRY}
      />

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
          <h3 className="text-[9px] tracking-[0.15em] uppercase mb-3" style={{ color: COLORS.textTertiary }}>Rep Symmetry</h3>
          <SymmetryMiniChart data={MOCK_SYMMETRY} />
        </div>
        <BodyHeatmap data={MOCK_BODY_HEATMAP} />
      </div>
    </div>
  );
}

function SymmetryMiniChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data}>
        <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
        <XAxis dataKey="rep" tick={{ fill: COLORS.textTertiary, fontSize: 9 }} axisLine={{ stroke: COLORS.border }} />
        <YAxis domain={[60, 100]} tick={{ fill: COLORS.textTertiary, fontSize: 9 }} axisLine={{ stroke: COLORS.border }} />
        <Line type="monotone" dataKey="score" stroke={COLORS.gold} strokeWidth={2} dot={{ r: 3, fill: COLORS.gold }} />
      </LineChart>
    </ResponsiveContainer>
  );
}