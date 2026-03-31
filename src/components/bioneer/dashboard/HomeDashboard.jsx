import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Flame, Trophy, Zap, Activity, ArrowRight, Play, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getAllSessions } from '../data/unifiedSessionStore';
import { COLORS, FONT } from '../ui/DesignTokens';
import { PremiumCard, StatCard, PrimaryButton, EmptyState } from '../ui/PremiumComponents';

export default function HomeDashboard({ onStartSession, onViewHistory }) {
  const [userProfile, setUserProfile]   = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const user = await base44.auth.me();
        if (user) {
          const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
          setUserProfile(profiles?.[0] || null);
          setRecentSessions(getAllSessions().slice(0, 3));
        }
      } catch (e) { console.error('Dashboard load error:', e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const streak        = userProfile?.current_streak || 0;
  const level         = userProfile?.level || 1;
  const progressPct   = ((level % 10) / 10) * 100;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: COLORS.gold, borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible"
      className="p-4 space-y-4 overflow-y-auto h-full" style={{ fontFamily: FONT.mono }}>

      {/* Level / XP bar */}
      <motion.div variants={itemVariants} className="p-4 rounded-lg border"
        style={{ background: COLORS.surface, borderColor: COLORS.goldBorder }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: COLORS.gold }} />
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: COLORS.gold }}>LEVEL {level}</span>
          </div>
          <span className="text-[9px]" style={{ color: COLORS.textTertiary }}>{(userProfile?.xp_total || 0).toLocaleString()} XP</span>
        </div>
        <div className="w-full h-1.5 rounded-full" style={{ background: COLORS.border }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ background: COLORS.gold, width: `${progressPct}%` }} />
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2">
        {[
          { icon: Flame,   label: 'Streak',   value: `${streak}d` },
          { icon: Trophy,  label: 'Sessions', value: userProfile?.total_sessions || 0 },
          { icon: Activity,label: 'Best',     value: recentSessions.length ? `${Math.max(...recentSessions.map(s => s.average_form_score || 0))}` : '—' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="p-3 rounded-lg border text-center"
            style={{ background: COLORS.surface, borderColor: COLORS.border }}>
            <Icon size={12} style={{ color: COLORS.gold, margin: '0 auto 4px' }} />
            <div className="text-sm font-bold" style={{ color: COLORS.textPrimary }}>{value}</div>
            <div className="text-[8px] uppercase tracking-[0.1em]" style={{ color: COLORS.textTertiary }}>{label}</div>
          </div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.button variants={itemVariants} onClick={onStartSession}
        className="w-full py-3 rounded-lg border flex items-center justify-center gap-2"
        style={{ background: COLORS.goldDim, borderColor: COLORS.goldBorder }}>
        <Play size={14} style={{ color: COLORS.gold }} />
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: COLORS.gold }}>START SESSION</span>
      </motion.button>

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-[0.12em] font-bold" style={{ color: COLORS.textSecondary }}>Recent</span>
            <button onClick={onViewHistory} className="flex items-center gap-1" style={{ color: COLORS.gold }}>
              <span className="text-[9px] uppercase tracking-[0.1em]">View All</span>
              <ArrowRight size={10} />
            </button>
          </div>
          {recentSessions.map(s => (
            <div key={s.session_id} className="flex items-center gap-3 p-3 rounded-lg border"
              style={{ background: COLORS.surface, borderColor: COLORS.border }}>
              <Clock size={12} style={{ color: COLORS.textTertiary }} />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold truncate" style={{ color: COLORS.textPrimary }}>{s.movement_name || s.exercise_id || 'Session'}</div>
                <div className="text-[9px]" style={{ color: COLORS.textTertiary }}>{s.started_at ? new Date(s.started_at).toLocaleDateString() : '—'}</div>
              </div>
              <div className="text-xs font-bold" style={{ color: COLORS.gold }}>{Math.round(s.average_form_score || 0)}</div>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}