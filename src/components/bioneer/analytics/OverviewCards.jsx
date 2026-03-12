import React from 'react';
import { COLORS, FONT, scoreColor } from '../ui/DesignTokens';
import { Target, Repeat, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import ScoreRing from '../ui/ScoreRing';

function StatBlock({ label, icon: Icon, color, children }) {
  return (
    <div className="rounded-lg border p-4 flex flex-col gap-2" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={12} strokeWidth={1.5} style={{ color: color ?? COLORS.textTertiary }} />}
        <span className="text-[9px] tracking-[0.15em] uppercase" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

const DIR_META = {
  improving: { Icon: TrendingUp,   color: '#22C55E', label: 'Improving'  },
  declining: { Icon: TrendingDown, color: '#EF4444', label: 'Declining'  },
  stable:    { Icon: Minus,        color: '#EAB308', label: 'Stable'     },
};

export default function OverviewCards({ overview }) {
  if (!overview) return null;

  const { avgFormScore, sessionCount, totalReps, totalTime, improvementDir, topFault, mostTrainedMovement } = overview;
  const dirMeta = improvementDir ? DIR_META[improvementDir] : null;
  const mm = Math.floor((totalTime ?? 0) / 60);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Form Score Ring */}
      <StatBlock label="Avg Form Score" icon={Target} color={COLORS.gold}>
        <div className="flex items-center gap-3">
          <ScoreRing score={avgFormScore ?? 0} size={52} strokeWidth={3} fontSize={17} />
          {dirMeta && (
            <div className="flex items-center gap-1">
              <dirMeta.Icon size={13} style={{ color: dirMeta.color }} />
              <span className="text-[9px] tracking-[0.08em]" style={{ color: dirMeta.color, fontFamily: FONT.mono }}>
                {dirMeta.label}
              </span>
            </div>
          )}
        </div>
      </StatBlock>

      {/* Sessions / Reps */}
      <StatBlock label="Volume" icon={Repeat}>
        <div>
          <span className="text-xl font-bold" style={{ color: COLORS.textPrimary, fontFamily: FONT.heading }}>
            {totalReps}
          </span>
          <span className="text-[10px] ml-1" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>reps</span>
        </div>
        <span className="text-[9px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          {sessionCount} sessions · {mm}m training
        </span>
      </StatBlock>

      {/* Most Trained */}
      <StatBlock label="Most Trained" icon={Calendar} color={COLORS.gold}>
        {mostTrainedMovement ? (
          <span className="text-xs font-bold leading-tight"
            style={{ color: COLORS.textPrimary, fontFamily: FONT.heading }}>
            {mostTrainedMovement}
          </span>
        ) : (
          <span className="text-[10px]" style={{ color: COLORS.textTertiary }}>—</span>
        )}
      </StatBlock>

      {/* Top Fault */}
      <StatBlock label="Top Fault" color="#EF4444">
        {topFault ? (
          <span className="text-[11px] font-bold leading-tight"
            style={{ color: '#EF4444', fontFamily: FONT.mono }}>
            {topFault}
          </span>
        ) : (
          <span className="text-[10px]" style={{ color: COLORS.correct }}>No recurring faults</span>
        )}
      </StatBlock>
    </div>
  );
}