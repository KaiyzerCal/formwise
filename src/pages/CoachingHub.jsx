/**
 * CoachingHub — The home experience
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllSessions } from '@/components/bioneer/data/unifiedSessionStore';
import { COLORS, FONT, scoreColor } from '@/components/bioneer/ui/DesignTokens';
import { Play, TrendingUp, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProperFormDemo from '@/pages/ProperFormDemo';
import OnboardingFlow from '@/components/bioneer/onboarding/OnboardingFlow';
import AxisDailyMessage from '@/components/bioneer/coaching/AxisDailyMessage';
import AxisWeeklyReport from '@/components/bioneer/coaching/AxisWeeklyReport';
import { checkAxisIntervention } from '@/components/bioneer/coaching/AxisIntervention';
import { getUserEngagement, isStreakAtRisk } from '@/lib/retentionEngine';

export default function CoachingHub() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [engagement, setEngagement] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [streakRisk, setStreakRisk] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const eng = await getUserEngagement();
        setEngagement(eng);

        // Check if user needs onboarding
        const onboarded = localStorage.getItem('bioneer_onboarded');
        const sessions = getAllSessions();
        if (onboarded !== 'true' && sessions.length === 0) {
          setShowOnboarding(true);
        }

        // Check streak risk & AXIS intervention
        if (eng?.lastSessionDate) {
          const atRisk = isStreakAtRisk(eng.lastSessionDate);
          setStreakRisk(atRisk);
          if (atRisk) {
            checkAxisIntervention(eng.lastSessionDate, eng.streak);
          }
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const sessions = useMemo(() => getAllSessions(), []);

  const currentScore = useMemo(() => {
    if (!sessions.length) return null;
    const recent = sessions.slice(0, 10);
    return Math.max(0, Math.min(100, Math.round(recent.reduce((sum, s) => sum + (s.average_form_score || 0), 0) / recent.length)));
  }, [sessions]);

  const scoreChange = useMemo(() => {
    if (sessions.length < 2) return null;
    const last = sessions[0]?.average_form_score || 0;
    const prev = sessions.slice(1, 4).reduce((sum, s) => sum + (s.average_form_score || 0), 0) / Math.min(3, sessions.slice(1, 4).length);
    return Math.round(last - prev);
  }, [sessions]);

  const todaysFocus = useMemo(() => {
    if (!sessions.length) return null;
    const faultCounts = {};
    sessions.slice(0, 3).forEach(s => (s.top_faults || []).forEach(f => { faultCounts[f] = (faultCounts[f] || 0) + 1; }));
    if (!Object.keys(faultCounts).length) return null;
    return Object.entries(faultCounts).sort((a, b) => b[1] - a[1])[0][0].replace(/_/g, ' ');
  }, [sessions]);

  const recentSessions = useMemo(() => sessions.slice(0, 3).reverse(), [sessions]);

  const trend = useMemo(() => {
    if (recentSessions.length < 2) return null;
    const first = recentSessions[0]?.average_form_score || 0;
    const last = recentSessions[recentSessions.length - 1]?.average_form_score || 0;
    return last > first ? 'up' : last < first ? 'down' : 'flat';
  }, [recentSessions]);

  const coachInsight = useMemo(() => {
    if (!sessions.length) return "Start your first session to unlock coaching insights";
    if (scoreChange === null) return "Keep training — patterns emerge after a few sessions";
    if (scoreChange > 5) return `Your control is improving — stay consistent`;
    if (scoreChange < -5) return `Small dip today — review your ${todaysFocus || 'form'} next time`;
    return `You're finding consistency — trust the process`;
  }, [sessions, scoreChange, todaysFocus]);

  // Live ticker stats
  const tickerText = useMemo(() => {
    const total = sessions.length;
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekSessions = sessions.filter(s => s.started_at && new Date(s.started_at) >= weekAgo);
    const peakThisWeek = weekSessions.length
      ? Math.max(...weekSessions.map(s => s.highest_form_score || s.average_form_score || 0))
      : 0;
    const streak = engagement?.streak || 0;
    return `${total} sessions analyzed · ${Math.round(peakThisWeek)} peak score this week · ${streak} day streak`;
  }, [sessions, engagement]);

  const handleStartSession = () => navigate('/FormCheck');
  const handleViewSessions = () => navigate('/FormCheck?phase=history');
  const handleLogout = async () => { await base44.auth.logout(); };

  if (showOnboarding) return <OnboardingFlow />;

  if (loading) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center" style={{ background: COLORS.bg }}>
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-slate-800 border-t-slate-400 rounded-full animate-spin mx-auto" />
          <p className="text-xs" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>Loading dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full flex flex-col" style={{ background: COLORS.bg, fontFamily: FONT.mono, color: COLORS.textPrimary }}>
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: COLORS.border }}>
        <div>
          <h1 className="text-sm font-bold tracking-[0.2em] uppercase" style={{ color: COLORS.gold }}>BIONEER</h1>
          <p className="text-[8px] tracking-[0.15em] mt-0.5 uppercase" style={{ color: COLORS.textTertiary }}>MOVEMENT INTELLIGENCE</p>
        </div>
        {user && (
          <button onClick={handleLogout} className="p-2 rounded hover:opacity-70 transition" title="Logout">
            <LogOut size={16} style={{ color: COLORS.textSecondary }} />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col px-6 py-6 space-y-6">

        {/* Weekly Report (Monday only) */}
        <AxisWeeklyReport streak={engagement?.streak} />

        {/* AXIS Daily Message */}
        <AxisDailyMessage userName={user?.full_name} streak={engagement?.streak} />

        {/* Performance Score */}
        <div className="flex flex-col items-center space-y-4 py-6">
          {currentScore !== null ? (
            <>
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke={COLORS.border} strokeWidth="8" />
                  <circle cx="60" cy="60" r="54" fill="none" stroke={scoreColor(currentScore)} strokeWidth="8"
                    strokeDasharray={`${(currentScore / 100) * 339} 339`} strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.8s ease-out', filter: `drop-shadow(0 0 12px ${scoreColor(currentScore)})` }} />
                </svg>
                <div className="text-center z-10">
                  <div className="text-3xl font-bold" style={{ color: scoreColor(currentScore) }}>{currentScore}%</div>
                  <div className="text-[10px] tracking-[0.1em] uppercase mt-1" style={{ color: COLORS.textSecondary }}>Today</div>
                </div>
              </div>
              {scoreChange !== null && (
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} style={{ color: scoreChange > 0 ? COLORS.correct : COLORS.fault }} />
                  <span className="text-xs font-bold" style={{ color: scoreChange > 0 ? COLORS.correct : COLORS.fault }}>
                    {scoreChange > 0 ? '+' : ''}{scoreChange}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-full max-w-xs mx-auto rounded-lg overflow-hidden border" style={{ borderColor: COLORS.border }}>
                <ProperFormDemo embedded />
              </div>
              <p className="text-[10px] leading-relaxed px-4" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
                BIONEER is ready. Select an exercise to begin real-time biomechanical analysis.
              </p>
            </div>
          )}
        </div>

        {/* Today's Focus */}
        {todaysFocus && (
          <div className="space-y-2">
            <p className="text-[9px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary }}>Today's Focus</p>
            <div className="px-6 py-4 rounded-lg border" style={{ background: COLORS.surface, borderColor: COLORS.borderLight }}>
              <h2 className="text-sm font-bold capitalize" style={{ color: COLORS.textPrimary }}>{todaysFocus}</h2>
              <p className="text-[9px] mt-2" style={{ color: COLORS.textSecondary }}>Fix this issue in your next session</p>
            </div>
          </div>
        )}

        {/* Primary CTA — with streak-at-risk pulse */}
        <button onClick={handleStartSession}
          className="w-full py-4 rounded-lg font-bold tracking-[0.1em] uppercase text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
          style={{
            background: COLORS.gold, color: COLORS.bg,
            boxShadow: streakRisk ? `0 0 0 2px ${COLORS.warning}, 0 0 20px ${COLORS.warning}40` : `0 0 20px ${COLORS.gold}40`,
            animation: streakRisk ? 'pulse 2s infinite' : 'none',
          }}>
          <Play size={18} />
          Start Session
        </button>

        {/* Live ticker */}
        <div className="text-center">
          <p className="text-[9px] tracking-[0.05em]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            {tickerText}
          </p>
        </div>

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary }}>Recent Sessions</p>
            <div className="flex items-center gap-3">
              {recentSessions.map((session, i) => (
                <div key={i} className="flex-1 px-3 py-2 rounded border text-center" style={{ background: COLORS.surface, borderColor: COLORS.borderLight }}>
                  <div className="text-xs font-bold" style={{ color: scoreColor(session.average_form_score || 0) }}>
                    {Math.round(session.average_form_score || 0)}
                  </div>
                  <div className="text-[8px] mt-1" style={{ color: COLORS.textTertiary }}>
                    {new Date(session.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
            {trend === 'up' && <p className="text-[9px]" style={{ color: COLORS.correct }}>↑ Trending up</p>}
            {trend === 'down' && <p className="text-[9px]" style={{ color: COLORS.fault }}>↓ Trending down</p>}
          </div>
        )}

        {/* AXIS Insight */}
        <div className="px-4 py-3 rounded-lg border" style={{ background: COLORS.goldDim, borderColor: COLORS.goldBorder }}>
          <p className="text-[9px] tracking-[0.1em] uppercase mb-1" style={{ color: COLORS.textTertiary }}>AXIS INSIGHT</p>
          <p className="text-[10px] leading-relaxed italic" style={{ color: COLORS.gold }}>"{coachInsight}"</p>
        </div>

        {/* View all sessions */}
        {sessions.length > 0 && (
          <div className="pt-4 border-t" style={{ borderColor: COLORS.border }}>
            <button onClick={handleViewSessions}
              className="w-full py-2 text-[9px] tracking-[0.1em] uppercase font-bold rounded transition-colors"
              style={{ color: COLORS.gold, background: 'transparent', borderBottom: `1px solid ${COLORS.gold}` }}>
              View All Sessions
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 2px ${COLORS.warning}, 0 0 20px ${COLORS.warning}40; }
          50% { box-shadow: 0 0 0 4px ${COLORS.warning}, 0 0 30px ${COLORS.warning}60; }
        }
      `}</style>
    </div>
  );
}