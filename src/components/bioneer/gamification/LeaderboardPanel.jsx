import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { COLORS, FONT } from '../ui/DesignTokens';
import { getLeaderboard, getUserRank } from '@/lib/gamificationEngine';
import { base44 } from '@/api/base44Client';
import { Trophy, Medal } from 'lucide-react';

const MEDAL_COLORS = {
  1: { bg: 'rgba(255,215,0,0.1)', border: 'rgba(255,215,0,0.3)', color: '#FFD700', emoji: '🥇' },
  2: { bg: 'rgba(192,192,192,0.1)', border: 'rgba(192,192,192,0.3)', color: '#C0C0C0', emoji: '🥈' },
  3: { bg: 'rgba(205,127,50,0.1)', border: 'rgba(205,127,50,0.3)', color: '#CD7F32', emoji: '🥉' },
};

export default function LeaderboardPanel() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        const data = await getLeaderboard(10);
        setLeaderboard(data);

        if (user?.email) {
          const rank = await getUserRank(user.email);
          setUserRank(rank);
        }
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const userOnLeaderboard = useMemo(() => {
    return leaderboard.find(u => u.email === currentUser?.email);
  }, [leaderboard, currentUser]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border p-4 lg:p-5 space-y-4"
      style={{
        background: COLORS.surface,
        borderColor: COLORS.border,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={16} style={{ color: COLORS.gold }} />
          <h3 className="text-xs font-bold tracking-[0.15em] uppercase"
            style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
            Leaderboard
          </h3>
        </div>
        {userRank && (
          <span className="text-[9px] font-bold px-2 py-1 rounded"
            style={{
              background: COLORS.goldDim,
              borderColor: COLORS.goldBorder,
              color: COLORS.gold,
              fontFamily: FONT.mono,
            }}>
            Your Rank: #{userRank}
          </span>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{ borderColor: COLORS.gold, borderTopColor: 'transparent' }} />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-8" style={{ color: COLORS.textTertiary }}>
          <p className="text-xs">No leaderboard data yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, idx) => {
            const medal = MEDAL_COLORS[entry.rank];
            const isCurrentUser = entry.email === currentUser?.email;
            const highlight = isCurrentUser ? `1px solid ${COLORS.goldBorder}` : `1px solid ${COLORS.border}`;
            const bgStyle = isCurrentUser ? COLORS.goldDim : COLORS.surface;

            return (
              <motion.div
                key={entry.email}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg border"
                style={{
                  background: medal ? medal.bg : bgStyle,
                  borderColor: medal ? medal.border : (isCurrentUser ? COLORS.goldBorder : COLORS.border),
                }}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-8 flex-shrink-0">
                  {medal ? (
                    <span className="text-lg">{medal.emoji}</span>
                  ) : (
                    <p className="text-sm font-bold"
                      style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
                      #{entry.rank}
                    </p>
                  )}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.1em] uppercase truncate"
                    style={{
                      color: isCurrentUser ? COLORS.gold : COLORS.textPrimary,
                      fontFamily: FONT.mono,
                    }}>
                    {entry.email.split('@')[0]}
                    {isCurrentUser && <span style={{ color: COLORS.gold }}> (YOU)</span>}
                  </p>
                  <p className="text-[8px] mt-0.5" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                    {entry.sessions} sessions · {entry.streak}-day streak
                  </p>
                </div>

                {/* Level + XP */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold"
                    style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
                    Lvl {entry.level}
                  </p>
                  <p className="text-[8px]"
                    style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                    {entry.xp.toLocaleString()} XP
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* User's rank if not on top 10 */}
      {!userOnLeaderboard && userRank && userRank > 10 && currentUser && (
        <div className="pt-2 border-t" style={{ borderColor: COLORS.border }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 rounded-lg border"
            style={{
              background: COLORS.goldDim,
              borderColor: COLORS.goldBorder,
            }}
          >
            <div className="flex items-center justify-center w-8 flex-shrink-0">
              <p className="text-sm font-bold"
                style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
                #{userRank}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold tracking-[0.1em] uppercase"
                style={{
                  color: COLORS.gold,
                  fontFamily: FONT.mono,
                }}>
                {currentUser.email.split('@')[0]} (YOU)
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}