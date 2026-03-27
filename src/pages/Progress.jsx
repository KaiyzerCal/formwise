import React, { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { COLORS, FONT } from "../components/bioneer/ui/DesignTokens";
import { getAllSessions } from "../components/bioneer/data/unifiedSessionStore";
import FormScoreTrendChart from "../components/bioneer/progress/FormScoreTrendChart";
import RepConsistencyChart from "../components/bioneer/progress/RepConsistencyChart";
import ProgressSummaryCards from "../components/bioneer/progress/ProgressSummaryCards";

export default function Progress() {
  const sessions = useMemo(() => getAllSessions().sort((a, b) => (a.started_at || 0) - (b.started_at || 0)), []);

  const isEmpty = sessions.length === 0;

  if (isEmpty) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader />
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: COLORS.goldDim, border: `1px solid ${COLORS.goldBorder}` }}
          >
            <TrendingUp size={28} style={{ color: COLORS.gold }} />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
              No Sessions Yet
            </p>
            <p className="text-[10px] leading-relaxed max-w-xs" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
              Complete sessions to see your progress over time
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ fontFamily: FONT.mono }}>
      <PageHeader />
      <div className="p-4 lg:p-6 space-y-4">
        <ProgressSummaryCards sessions={sessions} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <FormScoreTrendChart sessions={sessions} />
          <RepConsistencyChart sessions={sessions} />
        </div>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="px-5 py-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: COLORS.border }}>
      <h1 className="text-xs tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
        Progress
      </h1>
      <span className="text-[9px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
        Long-term trends
      </span>
    </div>
  );
}