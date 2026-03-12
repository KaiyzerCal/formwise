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

import OverviewCards           from "../components/bioneer/analytics/OverviewCards";
import FormTrendChart          from "../components/bioneer/analytics/FormTrendChart";
import FaultIntelligencePanel  from "../components/bioneer/analytics/FaultIntelligencePanel";
import MovementBreakdownPanel  from "../components/bioneer/analytics/MovementBreakdownPanel";
import RiskSignalPanel         from "../components/bioneer/analytics/RiskSignalPanel";
import RecentInsightsPanel     from "../components/bioneer/analytics/RecentInsightsPanel";

export default function Analytics() {
  // Use a refresh key so data recomputes each time the page mounts
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => { setTick(t => t + 1); }, []);

  const overview  = useMemo(() => getAnalyticsOverview(),     [tick]);
  const trend     = useMemo(() => getFormScoreTrend(),        [tick]);
  const faults    = useMemo(() => getFaultFrequencyData(),    [tick]);
  const breakdown = useMemo(() => getMovementBreakdown(),     [tick]);
  const risk      = useMemo(() => getRiskSignalSummary(),     [tick]);
  const insights  = useMemo(() => getRecentInsights(),        [tick]);

  return (
    <div className="h-full overflow-y-auto" style={{ fontFamily: FONT.mono }}>
      <PageHeader isEmpty={overview.isEmpty} />
      <div className="p-4 lg:p-6 space-y-4">
        <OverviewCards overview={overview} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <FormTrendChart trendData={trend} />
          <FaultIntelligencePanel faultData={faults} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <MovementBreakdownPanel breakdownData={breakdown} />
          <RiskSignalPanel riskData={risk} />
        </div>
        <RecentInsightsPanel insightData={insights} />
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