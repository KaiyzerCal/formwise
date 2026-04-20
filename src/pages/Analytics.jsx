import React, { useMemo, useState, useEffect } from "react";
import { BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import AxisIntelligenceSurface from "../components/bioneer/analytics/AxisIntelligenceSurface";
import { COLORS, FONT, scoreColor } from "../components/bioneer/ui/DesignTokens";
import {
  getAnalyticsOverview,
  getFormScoreTrend,
  getFaultFrequencyData,
  getMovementBreakdown,
  getRiskSignalSummary,
  getRecentInsights,
} from "../components/bioneer/analytics/selectors";

import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import OverviewCards           from "../components/bioneer/analytics/OverviewCards";
import FormTrendChart          from "../components/bioneer/analytics/FormTrendChart";
import FaultIntelligencePanel  from "../components/bioneer/analytics/FaultIntelligencePanel";
import MovementBreakdownPanel  from "../components/bioneer/analytics/MovementBreakdownPanel";
import RiskSignalPanel         from "../components/bioneer/analytics/RiskSignalPanel";
import RecentInsightsPanel     from "../components/bioneer/analytics/RecentInsightsPanel";
import MovementInsightsPanel   from "../components/bioneer/learning/MovementInsightsPanel";
import ProgressionPanel        from "../components/bioneer/analytics/ProgressionPanel";
import WeeklyPerformanceCard   from "../components/bioneer/analytics/WeeklyPerformanceCard";
import MovementMasteryPanel    from "../components/bioneer/analytics/MovementMasteryPanel";
import PersonalRecordsPanel    from "../components/bioneer/analytics/PersonalRecordsPanel";
import AdvancedFormScoreTrend  from "../components/bioneer/analytics/AdvancedFormScoreTrend";
import FaultCategoryBreakdown  from "../components/bioneer/analytics/FaultCategoryBreakdown";
import MuscleGroupProgress     from "../components/bioneer/analytics/MuscleGroupProgress";
import { getAllSessions }       from "../components/bioneer/data/unifiedSessionStore";
import { calculateMovementBaseline } from "../components/bioneer/learning/UserMovementModel";

export default function Analytics() {
  const overview  = useMemo(() => getAnalyticsOverview(),     []);
  const trend     = useMemo(() => getFormScoreTrend(),        []);
  const faults    = useMemo(() => getFaultFrequencyData(),    []);
  const breakdown = useMemo(() => getMovementBreakdown(),     []);
  const risk      = useMemo(() => getRiskSignalSummary(),     []);
  const insights  = useMemo(() => getRecentInsights(),        []);

  // Derive top movement from sessions
  const topMovement = useMemo(() => {
    const sessions = getAllSessions();
    if (!sessions.length) return null;
    const counts = {};
    sessions.forEach(s => {
      const m = s.movement_id || s.exercise_id;
      if (m) counts[m] = (counts[m] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }, []);

  const [selectedMovement, setSelectedMovement] = useState(null);
  const [progressNotifications, setProgressNotifications] = useState([]);
  const [analyticsExpanded, setAnalyticsExpanded] = useState(false);

  useEffect(() => {
    if (topMovement && !selectedMovement) setSelectedMovement(topMovement);
  }, [topMovement]);

  // Step 6: Check baseline improvement for top 3 movements on load
  useEffect(() => {
    async function checkProgress() {
      const sessions = getAllSessions();
      if (!sessions.length) return;

      const counts = {};
      sessions.forEach(s => {
        const m = s.movement_id || s.exercise_id;
        if (m) counts[m] = (counts[m] || 0) + 1;
      });
      const top3 = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);

      const notifications = [];
      for (const movement of top3) {
        try {
          const baseline = await calculateMovementBaseline(movement);
          if (!baseline || baseline.sessionCount < 3) continue;

          // Get last 5 sessions for this movement
          const movSessions = sessions
            .filter(s => (s.movement_id || s.exercise_id) === movement)
            .sort((a, b) => (b.started_at || 0) - (a.started_at || 0))
            .slice(0, 5);

          if (movSessions.length < 2) continue;

          const recentAvg = Math.round(
            movSessions.slice(0, 3).reduce((s, r) => s + (r.average_form_score || 0), 0) / Math.min(3, movSessions.length)
          );
          const olderAvg = Math.round(
            movSessions.slice(-2).reduce((s, r) => s + (r.average_form_score || 0), 0) / 2
          );

          if (olderAvg > 0) {
            const improvePct = Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
            if (improvePct >= 5) {
              notifications.push({
                movement: movement.replace(/_/g, ' ').toUpperCase(),
                improvePct,
              });
            }
          }
        } catch { /* skip */ }
      }
      setProgressNotifications(notifications);
    }
    checkProgress();
  }, []);

  // Available movements from sessions
  const availableMovements = useMemo(() => {
    const sessions = getAllSessions();
    const seen = new Set();
    sessions.forEach(s => {
      const m = s.movement_id || s.exercise_id;
      if (m) seen.add(m);
    });
    return Array.from(seen);
  }, []);

  const navigate = useNavigate();

  if (overview.isEmpty) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader isEmpty={true} />
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: COLORS.goldDim, border: `1px solid ${COLORS.goldBorder}` }}>
            <BarChart3 size={28} style={{ color: COLORS.gold }} />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold tracking-[0.15em] uppercase"
              style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
              Complete Your First Session
            </p>
            <p className="text-[10px] leading-relaxed max-w-xs"
              style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
              To Unlock Intelligence
            </p>
          </div>
          <button onClick={() => navigate(createPageUrl('FormCheck'))}
            className="px-6 py-3 rounded border text-xs font-bold tracking-[0.15em] uppercase"
            style={{ background: COLORS.goldDim, borderColor: COLORS.goldBorder, color: COLORS.gold, fontFamily: FONT.mono }}>
            START SESSION
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ fontFamily: FONT.mono }}>
      <PageHeader isEmpty={overview.isEmpty} />
      <div className="p-4 lg:p-6 space-y-4">

        {/* AXIS Intelligence Surface */}
        <AxisIntelligenceSurface />

        {/* Step 6: Progress notifications */}
        {progressNotifications.map((n, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg border"
            style={{ background: 'rgba(201,168,76,0.08)', borderColor: COLORS.goldBorder }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS.gold }} />
            <span className="text-[11px] font-bold tracking-[0.1em] uppercase"
              style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
              YOUR {n.movement} HAS IMPROVED {n.improvePct}% THIS MONTH
            </span>
          </div>
        ))}

        {/* Collapsible Full Analytics */}
        <button onClick={() => setAnalyticsExpanded(!analyticsExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg border text-[10px] font-bold tracking-[0.12em] uppercase"
          style={{ background: COLORS.surface, borderColor: COLORS.border, color: COLORS.textSecondary, fontFamily: FONT.mono }}>
          Full Analytics
          {analyticsExpanded ? <ChevronUp size={14} style={{ color: COLORS.textTertiary }} /> : <ChevronDown size={14} style={{ color: COLORS.textTertiary }} />}
        </button>

        {analyticsExpanded && (
          <div className="space-y-4">
            <WeeklyPerformanceCard />
            <OverviewCards overview={overview} />
            <AdvancedFormScoreTrend />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <FaultCategoryBreakdown />
              <MuscleGroupProgress />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <FormTrendChart trendData={trend} />
              <FaultIntelligencePanel faultData={faults} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <MovementBreakdownPanel breakdownData={breakdown} />
              <RiskSignalPanel riskData={risk} />
            </div>
            <RecentInsightsPanel insightData={insights} />
            <MovementMasteryPanel />
          </div>
        )}

        {/* Step 3: Progression + Insights sections */}
        {availableMovements.length > 0 && (
          <>
            {/* Movement selector */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-[9px] tracking-[0.15em] uppercase font-bold"
                style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>Movement</span>
              <div className="flex flex-wrap gap-2">
                {availableMovements.map(m => (
                  <button key={m} onClick={() => setSelectedMovement(m)}
                    className="px-3 py-1 rounded text-[9px] tracking-[0.1em] uppercase border"
                    style={{
                      background: selectedMovement === m ? COLORS.goldDim : 'transparent',
                      borderColor: selectedMovement === m ? COLORS.goldBorder : COLORS.border,
                      color: selectedMovement === m ? COLORS.gold : COLORS.textTertiary,
                      fontFamily: FONT.mono,
                    }}>
                    {m.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {selectedMovement && (
              <>
                <ProgressionPanel movement={selectedMovement} />
                <MovementInsightsPanel movement={selectedMovement} />
              </>
            )}
          </>
        )}
        <PersonalRecordsPanel />
      </div>
    </div>
  );
}

function PageHeader({ isEmpty }) {
  return (
    <div className="px-5 py-4 border-b flex items-center justify-between flex-shrink-0"
      style={{ borderColor: COLORS.border }}>
      <h1 className="text-xs tracking-[0.15em] uppercase font-bold"
        style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
        Intelligence
      </h1>
      <span className="text-[9px] tracking-[0.1em] uppercase"
        style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
        {isEmpty ? 'Start a session to populate' : 'Derived from saved sessions'}
      </span>
    </div>
  );
}