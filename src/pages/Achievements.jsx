import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { COLORS, FONT, FONT_LINK } from '@/components/bioneer/ui/DesignTokens';
import { base44 } from '@/api/base44Client';
import { ACHIEVEMENTS } from '@/lib/achievements';
import XPProgressCard from '@/components/bioneer/gamification/XPProgressCard';
import LeaderboardPanel from '@/components/bioneer/gamification/LeaderboardPanel';

export default function Achievements() {
  const [earned, setEarned] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(user => {
        if (!user) return [];
        return base44.entities.UserAchievement.filter({ created_by: user.email });
      })
      .then(data => setEarned(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const earnedIds = new Set(earned.map(a => a.achievement_id));

  return (
    <div className="h-full overflow-y-auto" style={{ background: COLORS.bg, fontFamily: FONT.mono }}>
      <link href={FONT_LINK} rel="stylesheet" />

      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center justify-between flex-shrink-0"
        style={{ borderColor: COLORS.border }}>
        <h1 className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: COLORS.gold }}>
          Achievements
        </h1>
        <span className="text-[9px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary }}>
          {earnedIds.size} / {ACHIEVEMENTS.length}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* XP Progress + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2">
            <XPProgressCard />
          </div>
          <StatsCard earned={earned} />
        </div>

        {/* Achievements Section */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: COLORS.gold, borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-xs font-bold tracking-[0.15em] uppercase mb-3"
                style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
                Earned Badges ({earnedIds.size})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ACHIEVEMENTS.map((a, idx) => {
                  const isEarned = earnedIds.has(a.id);
                  const earnedRecord = earned.find(e => e.achievement_id === a.id);
                  return (
                    <motion.div key={a.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="rounded-lg border p-4 flex items-center gap-4"
                      style={{
                        background: isEarned ? 'rgba(201,162,39,0.06)' : COLORS.surface,
                        borderColor: isEarned ? COLORS.goldBorder : COLORS.border,
                        opacity: isEarned ? 1 : 0.45,
                      }}>
                      <span className="text-3xl flex-shrink-0" style={{ filter: isEarned ? 'none' : 'grayscale(1)' }}>
                        {a.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold tracking-[0.08em]"
                          style={{ color: isEarned ? COLORS.gold : COLORS.textSecondary }}>
                          {a.title}
                        </p>
                        <p className="text-[9px] mt-0.5 leading-relaxed" style={{ color: COLORS.textTertiary }}>
                          {a.desc}
                        </p>
                        {isEarned && earnedRecord?.earned_at && (
                          <p className="text-[8px] mt-1" style={{ color: COLORS.textMuted }}>
                            {new Date(earnedRecord.earned_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {isEarned && (
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS.gold }} />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Leaderboard */}
            <div>
              <h2 className="text-xs font-bold tracking-[0.15em] uppercase mb-3"
                style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
                Global Rankings
              </h2>
              <LeaderboardPanel />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatsCard({ earned }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border p-4 space-y-3"
      style={{
        background: COLORS.surface,
        borderColor: COLORS.border,
      }}
    >
      <h3 className="text-[10px] font-bold tracking-[0.1em] uppercase"
        style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
        Stats
      </h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[9px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>Achievements</p>
          <p className="text-sm font-bold" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>{earned.length}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[9px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>Completion</p>
          <p className="text-sm font-bold" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
            {Math.round((earned.length / ACHIEVEMENTS.length) * 100)}%
          </p>
        </div>
      </div>
    </motion.div>
  );
}