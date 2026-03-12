import React from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { Activity, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function AnalyticsEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" style={{ fontFamily: FONT.mono }}>
      <div className="w-16 h-16 rounded-full border flex items-center justify-center mb-5"
        style={{ borderColor: COLORS.border, background: COLORS.surface }}>
        <Activity size={24} strokeWidth={1.5} style={{ color: COLORS.textTertiary }} />
      </div>
      <h2 className="text-sm font-bold tracking-[0.15em] uppercase mb-2"
        style={{ color: COLORS.textPrimary, fontFamily: FONT.heading }}>
        No sessions yet
      </h2>
      <p className="text-[11px] leading-relaxed max-w-xs mb-6"
        style={{ color: COLORS.textTertiary }}>
        Complete 2–3 live sessions to unlock trend charts, fault intelligence, and movement analysis.
      </p>
      <Link to={createPageUrl('LiveSession')}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[10px] tracking-[0.15em] uppercase transition-colors"
        style={{ borderColor: COLORS.goldBorder, color: COLORS.gold, background: COLORS.goldDim }}>
        Start a session
        <ArrowRight size={12} />
      </Link>
    </div>
  );
}