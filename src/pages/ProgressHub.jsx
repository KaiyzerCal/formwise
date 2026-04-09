/**
 * ProgressHub — Performance Tracking
 * Before/after comparison, analysis history timeline, metrics, consistency
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { COLORS, FONT, scoreColor } from '@/components/bioneer/ui/DesignTokens';
import { getAllSessions } from '@/components/bioneer/data/unifiedSessionStore';
import { TrendingUp, Clock, BarChart3, ChevronRight, ArrowLeft } from 'lucide-react';
import FormScoreTrendChart from '@/components/bioneer/progress/FormScoreTrendChart';
import RepConsistencyChart from '@/components/bioneer/progress/RepConsistencyChart';
import ProgressSummaryCards from '@/components/bioneer/progress/ProgressSummaryCards';
import AnalysisTimeline from '@/components/progress/AnalysisTimeline';
import BeforeAfterCard from '@/components/progress/BeforeAfterCard';

export default function ProgressHub() {
  const navigate = useNavigate();
  const sessions = useMemo(
    () => getAllSessions().sort((a, b) => new Date(a.started_at || 0) - new Date(b.started_at || 0)),
    []
  );

  if (sessions.length === 0) {
    return (
      <div className="min-h-full flex flex-col" style={{ background: COLORS.bg, fontFamily: FONT.mono }}>
        <Header navigate={navigate} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: COLORS.goldDim, border: `1px solid ${COLORS.goldBorder}` }}>
            <TrendingUp size={24} style={{ color: COLORS.gold }} />
          </div>
          <p className="text-xs font-bold tracking-[0.12em] uppercase" style={{ color: COLORS.textSecondary }}>
            No Data Yet
          </p>
          <p className="text-[9px] max-w-xs" style={{ color: COLORS.textTertiary }}>
            Complete analyses to track your progress over time
          </p>
          <button
            onClick={() => navigate('/analyze')}
            className="px-5 py-2.5 rounded-lg text-[9px] font-bold tracking-[0.1em] uppercase"
            style={{ background: COLORS.goldDim, color: COLORS.gold, border: `1px solid ${COLORS.goldBorder}` }}
          >
            Start First Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full" style={{ background: COLORS.bg, fontFamily: FONT.mono, color: COLORS.textPrimary }}>
      <Header navigate={navigate} />
      <div className="px-5 py-5 space-y-5 max-w-4xl mx-auto">
        {/* Summary Cards */}
        <ProgressSummaryCards sessions={sessions} />

        {/* Before/After Comparison */}
        {sessions.length >= 2 && <BeforeAfterCard sessions={sessions} />}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <FormScoreTrendChart sessions={sessions} />
          <RepConsistencyChart sessions={sessions} />
        </div>

        {/* Analysis History Timeline */}
        <AnalysisTimeline sessions={sessions} />
      </div>
    </div>
  );
}

function Header({ navigate }) {
  return (
    <div className="px-5 py-3 border-b flex items-center gap-3" style={{ borderColor: COLORS.border }}>
      <button onClick={() => navigate('/')} className="p-1">
        <ArrowLeft size={16} style={{ color: COLORS.textSecondary }} />
      </button>
      <h1 className="text-xs tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
        Progress
      </h1>
    </div>
  );
}