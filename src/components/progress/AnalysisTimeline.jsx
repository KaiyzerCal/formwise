/**
 * AnalysisTimeline — Chronological list of past analyses
 */
import React from 'react';
import { motion } from 'framer-motion';
import { COLORS, FONT, scoreColor } from '@/components/bioneer/ui/DesignTokens';

export default function AnalysisTimeline({ sessions }) {
  // Show most recent first, limit to 20
  const timeline = [...sessions].reverse().slice(0, 20);

  return (
    <div className="space-y-3">
      <p className="text-[8px] tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.textTertiary }}>
        Analysis History
      </p>
      <div className="space-y-2">
        {timeline.map((s, i) => {
          const score = Math.round(s.average_form_score || 0);
          const name = s.movement_name || s.exercise_id || 'Session';
          const date = s.started_at ? new Date(s.started_at) : null;
          const faults = (s.top_faults || []).slice(0, 2);
          return (
            <motion.div
              key={s.session_id || i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg border"
              style={{ background: COLORS.surface, borderColor: COLORS.border }}
            >
              {/* Score dot */}
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: scoreColor(score) }} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold truncate" style={{ color: COLORS.textPrimary }}>
                    {name}
                  </span>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: scoreColor(score) }}>
                    {score}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {date && (
                    <span className="text-[8px]" style={{ color: COLORS.textTertiary }}>
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {faults.length > 0 && (
                    <span className="text-[8px]" style={{ color: COLORS.textTertiary }}>
                      · {faults.map(f => f.replace(/_/g, ' ')).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}