import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Zap } from 'lucide-react';
import { COLORS, FONT } from './DesignTokens';
import { getUserEngagement, isStreakAtRisk } from '@/lib/retentionEngine';

export default function StreakWidget() {
  const [engagement, setEngagement]   = useState(null);
  const [streakAtRisk, setStreakAtRisk] = useState(false);

  useEffect(() => {
    getUserEngagement().then(data => {
      setEngagement(data);
      if (data?.lastSessionDate) setStreakAtRisk(isStreakAtRisk(data.lastSessionDate));
    }).catch(() => {});
  }, []);

  if (!engagement) return null;

  return (
    <div className="p-4 rounded-lg border space-y-3"
      style={{ background: COLORS.surface, borderColor: streakAtRisk ? COLORS.fault : COLORS.border }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Flame size={12} style={{ color: streakAtRisk ? COLORS.fault : COLORS.gold }} />
          <span className="text-[9px] font-bold tracking-[0.12em] uppercase"
            style={{ color: streakAtRisk ? COLORS.fault : COLORS.gold, fontFamily: FONT.mono }}>
            {streakAtRisk ? 'Streak at risk!' : `${engagement.streak} day streak`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Zap size={10} style={{ color: COLORS.gold }} />
          <span className="text-[9px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            Lv {engagement.level}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-[9px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
        <div className="flex items-center gap-1">
          <Trophy size={9} style={{ color: COLORS.textTertiary }} />
          <span>{engagement.totalSessions} sessions</span>
        </div>
        <span>·</span>
        <span>{(engagement.xp || 0).toLocaleString()} XP</span>
      </div>
    </div>
  );
}
