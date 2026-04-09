/**
 * Dashboard — Command Center
 * ONE primary action. Latest analysis. Today's workout. Streak + level. Progress snapshot.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllSessions } from '@/components/bioneer/data/unifiedSessionStore';
import { COLORS, FONT, scoreColor } from '@/components/bioneer/ui/DesignTokens';
import { Play, TrendingUp, Target, Flame, ChevronRight, LogOut, Dumbbell, Award } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ScoreRingLarge from '@/components/dashboard/ScoreRingLarge';
import NextActionCard from '@/components/dashboard/NextActionCard';
import QuickStatsRow from '@/components/dashboard/QuickStatsRow';
import RecentSessionStrip from '@/components/dashboard/RecentSessionStrip';
import CoachInsightCard from '@/components/dashboard/CoachInsightCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.auth.me().catch(() => null),
      base44.entities.UserProfile.filter({}).catch(() => []),
    ]).then(([u, profiles]) => {
      setUser(u);
      if (profiles?.length > 0) setProfile(profiles[0]);
      setLoading(false);
    });
  }, []);

  const sessions = useMemo(() => getAllSessions(), []);

  const currentScore = useMemo(() => {
    if (!sessions.length) return null;
    const recent = sessions.slice(0, 10);
    return Math.round(recent.reduce((sum, s) => sum + (s.average_form_score || 0), 0) / recent.length);
  }, [sessions]);

  const scoreChange = useMemo(() => {
    if (sessions.length < 2) return null;
    const last = sessions[0]?.average_form_score || 0;
    const prevSlice = sessions.slice(1, 4);
    const prev = prevSlice.reduce((sum, s) => sum + (s.average_form_score || 0), 0) / prevSlice.length;
    return Math.round(last - prev);
  }, [sessions]);

  const todaysFocus = useMemo(() => {
    if (!sessions.length) return null;
    const faultCounts = {};
    sessions.slice(0, 3).forEach(s => {
      (s.top_faults || []).forEach(f => { faultCounts[f] = (faultCounts[f] || 0) + 1; });
    });
    if (!Object.keys(faultCounts).length) return null;
    return Object.entries(faultCounts).sort((a, b) => b[1] - a[1])[0][0].replace(/_/g, ' ');
  }, [sessions]);

  const coachInsight = useMemo(() => {
    if (!sessions.length) return "Start your first analysis to unlock personalized coaching.";
    if (scoreChange === null) return "Keep training — patterns emerge after a few sessions.";
    if (scoreChange > 5) return "Your control is improving — stay consistent.";
    if (scoreChange < -5) return `Small dip today — focus on ${todaysFocus || 'form'} next session.`;
    return "You're building consistency — trust the process.";
  }, [sessions, scoreChange, todaysFocus]);

  const handleLogout = () => base44.auth.logout();

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center" style={{ background: COLORS.bg }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: COLORS.border, borderTopColor: COLORS.gold }} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-full" style={{ background: COLORS.bg, fontFamily: FONT.mono, color: COLORS.textPrimary }}>
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: COLORS.border }}>
        <div>
          <h1 className="text-sm font-bold tracking-[0.2em] uppercase" style={{ color: COLORS.gold }}>
            Command Center
          </h1>
          <p className="text-[9px] tracking-[0.1em] mt-0.5" style={{ color: COLORS.textTertiary }}>
            {user?.full_name || 'Athlete'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {profile && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded border" style={{ borderColor: COLORS.goldBorder, background: COLORS.goldDim }}>
              <Flame size={12} style={{ color: COLORS.gold }} />
              <span className="text-[9px] font-bold" style={{ color: COLORS.gold }}>
                {profile.current_streak || 0}
              </span>
            </div>
          )}
          {user && (
            <button onClick={handleLogout} className="p-2 rounded hover:opacity-70 transition" title="Logout">
              <LogOut size={14} style={{ color: COLORS.textTertiary }} />
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Performance Score */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center py-6"
        >
          <ScoreRingLarge score={currentScore} change={scoreChange} />
        </motion.div>

        {/* Quick Stats */}
        <QuickStatsRow
          sessions={sessions.length}
          streak={profile?.current_streak || 0}
          level={profile?.level || 1}
        />

        {/* Next Action Engine — THE primary CTA */}
        <NextActionCard
          hasSession={sessions.length > 0}
          todaysFocus={todaysFocus}
          onAnalyze={() => navigate('/analyze')}
          onTrain={() => navigate('/train')}
        />

        {/* Recent Sessions */}
        {sessions.length > 0 && (
          <RecentSessionStrip sessions={sessions.slice(0, 5)} />
        )}

        {/* Coach Insight */}
        <CoachInsightCard message={coachInsight} />
      </div>
    </div>
  );
}