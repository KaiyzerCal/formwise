import React from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, FONT, scoreColor } from '@/components/bioneer/ui/DesignTokens';
import { ChevronRight } from 'lucide-react';

export default function RecentSessionStrip({ sessions }) {
  const navigate = useNavigate();
  if (!sessions?.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[8px] tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.textTertiary }}>
          Recent Analyses
        </p>
        <button
          onClick={() => navigate('/progress')}
          className="text-[8px] flex items-center gap-0.5"
          style={{ color: COLORS.gold }}
        >
          View all <ChevronRight size={10} />
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sessions.map((s, i) => {
          const score = Math.round(s.average_form_score || 0);
          return (
            <div
              key={s.session_id || i}
              className="flex-shrink-0 w-16 py-2.5 rounded-lg border text-center"
              style={{ background: COLORS.surface, borderColor: COLORS.border, fontFamily: FONT.mono }}
            >
              <div className="text-sm font-bold" style={{ color: scoreColor(score) }}>
                {score}
              </div>
              <div className="text-[7px] mt-0.5" style={{ color: COLORS.textTertiary }}>
                {s.started_at
                  ? new Date(s.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : '—'
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}