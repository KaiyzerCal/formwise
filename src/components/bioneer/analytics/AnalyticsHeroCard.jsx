import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { COLORS, FONT, scoreColor } from '@/components/bioneer/ui/DesignTokens';
import { getAllSessions } from '@/components/bioneer/data/unifiedSessionStore';

export default function AnalyticsHeroCard() {
  const stats = useMemo(() => {
    const sessions = getAllSessions();
    if (sessions.length === 0) return null;

    // This week's sessions
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = sessions.filter(s => (s.started_at || s.createdAt) >= oneWeekAgo);
    
    if (thisWeek.length === 0) return null;

    const avgScore = Math.round(
      thisWeek.reduce((sum, s) => sum + (s.average_form_score || 0), 0) / thisWeek.length
    );

    // Overall trend
    const recentSessions = sessions.slice(0, 5);
    const olderSessions = sessions.slice(-5);
    
    const recentAvg = Math.round(
      recentSessions.reduce((sum, s) => sum + (s.average_form_score || 0), 0) / recentSessions.length
    );
    
    const olderAvg = olderSessions.length > 0
      ? Math.round(oldeSessions.reduce((sum, s) => sum + (s.average_form_score || 0), 0) / oldeSessions.length)
      : 0;

    const improvement = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;

    return {
      avgScore,
      sessionCount: thisWeek.length,
      improvement,
      trend: improvement > 0 ? 'up' : improvement < 0 ? 'down' : 'stable',
    };
  }, []);

  if (!stats) return null;

  return (
    <div
      className="p-8 rounded-lg border mb-6"
      style={{
        borderColor: COLORS.goldBorder,
        background: COLORS.goldDim,
      }}
    >
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] tracking-[0.15em] uppercase mb-2" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            This Week's Average
          </p>
          <div className="flex items-baseline gap-2">
            <div className="text-5xl font-bold" style={{ color: scoreColor(stats.avgScore), fontFamily: FONT.heading }}>
              {stats.avgScore}
            </div>
            <p className="text-sm" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
              {stats.sessionCount} {stats.sessionCount === 1 ? 'session' : 'sessions'}
            </p>
          </div>
        </div>
        
        {stats.trend !== 'stable' && (
          <div className="flex items-center gap-2">
            <TrendingUp
              size={20}
              style={{
                color: stats.trend === 'up' ? COLORS.correct : COLORS.warning,
                transform: stats.trend === 'down' ? 'scaleY(-1)' : 'none',
              }}
            />
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: stats.trend === 'up' ? COLORS.correct : COLORS.warning }}>
                {Math.abs(stats.improvement)}%
              </p>
              <p className="text-[9px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                vs last {stats.trend === 'up' ? 'month' : 'month'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}