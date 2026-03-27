/**
 * CoachingHub — The new home experience
 * 
 * PHILOSOPHY: Performance Coaching OS
 * - Daily engagement loop (score, focus, action)
 * - Emotional design (celebration of progress)
 * - Single focus per screen
 * - Video-first data presentation
 * 
 * STRUCTURE:
 * 1. Performance Score (40% of screen) — dominant visual
 * 2. Today's Focus (action card) — one issue to fix
 * 3. Primary CTA (full-width button) — Start Session
 * 4. Micro Progress (tiny trend) — last 3 sessions
 * 5. Coach Insight (one sentence) — actionable coaching
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllSessions } from '@/components/bioneer/data/unifiedSessionStore';
import { COLORS, FONT, scoreColor } from '@/components/bioneer/ui/DesignTokens';
import { Play, TrendingUp, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CoachingHub() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Get all sessions for stats
  const sessions = useMemo(() => getAllSessions(), []);
  
  // Calculate current performance score
  const currentScore = useMemo(() => {
    if (!sessions.length) return null;
    const recent = sessions.slice(0, 10);
    const avg = Math.round(
      recent.reduce((sum, s) => sum + (s.average_form_score || 0), 0) / recent.length
    );
    return Math.max(0, Math.min(100, avg));
  }, [sessions]);

  // Calculate score change (last session vs average of 3 before)
  const scoreChange = useMemo(() => {
    if (sessions.length < 2) return null;
    const last = sessions[0]?.average_form_score || 0;
    const prev = sessions.slice(1, 4).reduce((sum, s) => sum + (s.average_form_score || 0), 0) / Math.min(3, sessions.slice(1, 4).length);
    return Math.round(last - prev);
  }, [sessions]);

  // Get today's focus (most common fault from last 3 sessions)
  const todaysFocus = useMemo(() => {
    if (!sessions.length) return null;
    const recent = sessions.slice(0, 3);
    const faultCounts = {};
    recent.forEach(s => {
      (s.top_faults || []).forEach(f => {
        faultCounts[f] = (faultCounts[f] || 0) + 1;
      });
    });
    if (!Object.keys(faultCounts).length) return null;
    const topFault = Object.entries(faultCounts).sort((a, b) => b[1] - a[1])[0][0];
    return topFault.replace(/_/g, ' ');
  }, [sessions]);

  // Get last 3 sessions for trend
  const recentSessions = useMemo(() => {
    return sessions.slice(0, 3).reverse();
  }, [sessions]);

  // Calculate trend direction
  const trend = useMemo(() => {
    if (recentSessions.length < 2) return null;
    const first = recentSessions[0]?.average_form_score || 0;
    const last = recentSessions[recentSessions.length - 1]?.average_form_score || 0;
    return last > first ? 'up' : last < first ? 'down' : 'flat';
  }, [recentSessions]);

  // Coaching insight (smart message)
  const coachInsight = useMemo(() => {
    if (!sessions.length) return "Start your first session to unlock coaching insights";
    if (scoreChange === null) return "Keep training — patterns emerge after a few sessions";
    if (scoreChange > 5) return `Your control is improving — stay consistent`;
    if (scoreChange < -5) return `Small dip today — review your ${todaysFocus || 'form'} next time`;
    return `You're finding consistency — trust the process`;
  }, [sessions, scoreChange, todaysFocus]);

  const handleStartSession = () => navigate('/FormCheck');
  const handleViewSessions = () => navigate('/FormCheck?phase=history');
  const handleLogout = async () => {
    await base44.auth.logout();
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ background: COLORS.bg }}>
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-slate-800 border-t-slate-400 rounded-full animate-spin mx-auto" />
          <p className="text-xs" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>Loading dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-screen overflow-y-auto flex flex-col"
      style={{ background: COLORS.bg, fontFamily: FONT.mono, color: COLORS.textPrimary }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: COLORS.border }}>
        <div>
          <h1 className="text-sm font-bold tracking-[0.2em] uppercase" style={{ color: COLORS.gold }}>
            Coaching Hub
          </h1>
          <p className="text-[9px] tracking-[0.1em] mt-1" style={{ color: COLORS.textTertiary }}>
            {user?.full_name || 'Athlete'}
          </p>
        </div>
        {user && (
          <button
            onClick={handleLogout}
            className="p-2 rounded hover:opacity-70 transition"
            title="Logout"
          >
            <LogOut size={16} style={{ color: COLORS.textSecondary }} />
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col px-6 py-8 space-y-8 overflow-y-auto">

        {/* SECTION 1: Performance Score (40% of screen) */}
        <div className="flex flex-col items-center space-y-4 py-8">
          {currentScore !== null ? (
            <>
              {/* Score ring animation */}
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke={COLORS.border}
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke={scoreColor(currentScore)}
                    strokeWidth="8"
                    strokeDasharray={`${(currentScore / 100) * 339} 339`}
                    strokeLinecap="round"
                    style={{
                      transition: 'stroke-dasharray 0.8s ease-out',
                      filter: `drop-shadow(0 0 12px ${scoreColor(currentScore)})`
                    }}
                  />
                </svg>
                <div className="text-center z-10">
                  <div className="text-3xl font-bold" style={{ color: scoreColor(currentScore) }}>
                    {currentScore}%
                  </div>
                  <div className="text-[10px] tracking-[0.1em] uppercase mt-1" style={{ color: COLORS.textSecondary }}>
                    Today
                  </div>
                </div>
              </div>

              {/* Score change */}
              {scoreChange !== null && (
                <div className="flex items-center gap-2">
                  <TrendingUp
                    size={14}
                    style={{ color: scoreChange > 0 ? COLORS.correct : COLORS.fault }}
                  />
                  <span className="text-xs font-bold" style={{ color: scoreChange > 0 ? COLORS.correct : COLORS.fault }}>
                    {scoreChange > 0 ? '+' : ''}{scoreChange}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center space-y-2">
              <div className="text-xl font-bold" style={{ color: COLORS.textSecondary }}>
                --
              </div>
              <p className="text-[10px]" style={{ color: COLORS.textTertiary }}>
                No sessions yet
              </p>
            </div>
          )}
        </div>

        {/* SECTION 2: Today's Focus */}
        {todaysFocus && (
          <div className="space-y-2">
            <p className="text-[9px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary }}>
              Today's Focus
            </p>
            <div
              className="px-6 py-4 rounded-lg border"
              style={{ background: COLORS.surface, borderColor: COLORS.borderLight }}
            >
              <h2 className="text-sm font-bold capitalize" style={{ color: COLORS.textPrimary }}>
                {todaysFocus}
              </h2>
              <p className="text-[9px] mt-2" style={{ color: COLORS.textSecondary }}>
                Fix this issue in your next session
              </p>
            </div>
          </div>
        )}

        {/* SECTION 3: Primary CTA */}
        <button
          onClick={handleStartSession}
          className="w-full py-4 rounded-lg font-bold tracking-[0.1em] uppercase text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
          style={{
            background: COLORS.gold,
            color: COLORS.bg,
            boxShadow: `0 0 20px ${COLORS.gold}40`,
          }}
        >
          <Play size={18} />
          Start Session
        </button>

        {/* SECTION 4: Micro Progress */}
        {recentSessions.length > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary }}>
              Recent Sessions
            </p>
            <div className="flex items-center gap-3">
              {recentSessions.map((session, i) => (
                <div
                  key={i}
                  className="flex-1 px-3 py-2 rounded border text-center"
                  style={{
                    background: COLORS.surface,
                    borderColor: COLORS.borderLight,
                  }}
                >
                  <div className="text-xs font-bold" style={{ color: scoreColor(session.average_form_score || 0) }}>
                    {Math.round(session.average_form_score || 0)}
                  </div>
                  <div className="text-[8px] mt-1" style={{ color: COLORS.textTertiary }}>
                    {new Date(session.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
            {trend === 'up' && (
              <p className="text-[9px]" style={{ color: COLORS.correct }}>
                ↑ Trending up
              </p>
            )}
            {trend === 'down' && (
              <p className="text-[9px]" style={{ color: COLORS.fault }}>
                ↓ Trending down
              </p>
            )}
          </div>
        )}

        {/* SECTION 5: Coach Insight */}
        <div
          className="px-4 py-3 rounded-lg border"
          style={{ background: `${COLORS.goldDim}`, borderColor: COLORS.goldBorder }}
        >
          <p className="text-[10px] leading-relaxed italic" style={{ color: COLORS.gold }}>
            "{coachInsight}"
          </p>
        </div>

        {/* Footer: View all sessions */}
        {sessions.length > 0 && (
          <div className="pt-4 border-t" style={{ borderColor: COLORS.border }}>
            <button
              onClick={handleViewSessions}
              className="w-full py-2 text-[9px] tracking-[0.1em] uppercase font-bold rounded transition-colors"
              style={{
                color: COLORS.gold,
                background: 'transparent',
                borderBottom: `1px solid ${COLORS.gold}`,
              }}
            >
              View All Sessions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}