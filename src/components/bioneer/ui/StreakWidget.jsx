import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Zap } from 'lucide-react';
import { COLORS, FONT } from './DesignTokens';
import { getUserEngagement, isStreakAtRisk } from '@/lib/retentionEngine';

export default function StreakWidget() {
  const [engagement, setEngagement] = useState(null);
  const [streakAtRisk, setStreakAtRisk] = useState(false);

  useEffect(() => {
    const fetchEngagement = async () => {
      const user = await (async () => {
        try {
          const { base44 } = await import('@/api/base44Client');
          return await base44.auth.me();
        } catch {
          return null;
        }
      })();

      if (user) {
        const data = await getUserEngagement(user.email);
        setEngagement(data);
        if (data?.lastSessionDate) {
          setStreakAtRisk(isStreakAtRisk(data.lastSessionDate));
        }
      }
    };

    fetchEngagement();
  }, []);

  if (!engagement) return null;

  return (
    <div
      className="p-4 rounded-lg border space-y-3"
      style={{
        background: COLORS.surface,
        borderColor: streakAtRisk ? COLORS.fault : COLORS.border,
      }}
    >
      {/* Streak Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame
            size={18}
            style={{ color: streakAtRisk ? COLORS.fault : COLORS.gold }}
          />
          <div>
            <div
              className="text-xs font-bold tracking-wide uppercase"
              style={{ color: COLORS.textSecondary }}
            >
              Streak
            </div>
            <div
              className="text-2xl font-bold"
              style={{
                color: streakAtRisk ? COLORS.fault : COLORS.gold,
                fontFamily: FONT.heading,
              }}
            >
              {engagement.streak}
            </div>
          </div>
        </div>

        {/* Level Section */}
        <div className="text-right">
          <div
            className="text-xs font-bold tracking-wide uppercase"
            style={{ color: COLORS.textSecondary }}
          >
            Level
          </div>
          <div
            className="text-2xl font-bold"
            style={{ color: COLORS.gold, fontFamily: FONT.heading }}
          >
            {engagement.level}
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div>
        <div
          className="text-xs font-bold mb-1"
          style={{ color: COLORS.textSecondary }}
        >
          XP: {engagement.xp % 500} / 500
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: COLORS.border }}
        >
          <div
            className="h-full"
            style={{
              width: `${((engagement.xp % 500) / 500) * 100}%`,
              background: COLORS.gold,
            }}
          />
        </div>
      </div>

      {/* Streak Warning */}
      {streakAtRisk && (
        <div
          className="text-xs p-2 rounded flex items-center gap-2"
          style={{ background: `${COLORS.fault}20` }}
        >
          <Zap size={14} style={{ color: COLORS.fault }} />
          <span style={{ color: COLORS.fault }}>
            Come back soon to keep your streak alive
          </span>
        </div>
      )}

      {/* Personal Record */}
      <div
        className="flex items-center gap-2 text-xs"
        style={{ color: COLORS.textSecondary }}
      >
        <Trophy size={14} />
        <span>Best streak: {engagement.longestStreak} days</span>
      </div>
    </div>
  );
}