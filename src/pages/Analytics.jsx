import React, { useMemo } from "react";
import { COLORS, FONT } from "../components/bioneer/ui/DesignTokens";
import {
  getAnalyticsOverview,
  getFormScoreTrend,
  getFaultFrequencyData,
  getMovementBreakdown,
  getRiskSignalSummary,
  getRecentInsights,
} from "../components/bioneer/analytics/selectors";

import AnalyticsEmptyState    from "../components/bioneer/analytics/AnalyticsEmptyState";
import OverviewCards           from "../components/bioneer/analytics/OverviewCards";
import FormTrendChart          from "../components/bioneer/analytics/FormTrendChart";
import FaultIntelligencePanel  from "../components/bioneer/analytics/FaultIntelligencePanel";
import MovementBreakdownPanel  from "../components/bioneer/analytics/MovementBreakdownPanel";
import RiskSignalPanel         from "../components/bioneer/analytics/RiskSignalPanel";
import RecentInsightsPanel     from "../components/bioneer/analytics/RecentInsightsPanel";

export default function Analytics() {
  const overview  = useMemo(() => getAnalyticsOverview(),     []);
  const trend     = useMemo(() => getFormScoreTrend(),        []);
  const faults    = useMemo(() => getFaultFrequencyData(),    []);
  const breakdown = useMemo(() => getMovementBreakdown(),     []);
  const risk      = useMemo(() => getRiskSignalSummary(),     []);
  const insights  = useMemo(() => getRecentInsights(),        []);

  // Zero sessions — show the welcome/empty state
  if (!overview) {
    return (
      <div className="h-full flex flex-col" style={{ fontFamily: FONT.mono }}>
        <PageHeader />
        <AnalyticsEmptyState />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ fontFamily: FONT.mono }}>
      <PageHeader />
      <div className="p-4 lg:p-6 space-y-4">

        {/* ── Overview stat cards ────────────────────────────────────────── */}
        <OverviewCards overview={overview} />

        {/* ── Form trend + Fault intelligence ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <FormTrendChart trendData={trend} />
          <FaultIntelligencePanel faultData={faults} />
        </div>

        {/* ── Movement breakdown + Risk signals ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <MovementBreakdownPanel breakdownData={breakdown} />
          <RiskSignalPanel riskData={risk} />
        </div>

        {/* ── Recent insights ────────────────────────────────────────────── */}
        <RecentInsightsPanel insightData={insights} />

      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="px-5 py-4 border-b flex items-center justify-between flex-shrink-0"
      style={{ borderColor: COLORS.border }}>
      <h1 className="text-xs tracking-[0.15em] uppercase font-bold"
        style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
        Intelligence
      </h1>
      <span className="text-[9px] tracking-[0.1em] uppercase"
        style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
        Derived from saved sessions
      </span>
    </div>
  );
}