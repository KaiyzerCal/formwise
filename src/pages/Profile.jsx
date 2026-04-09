/**
 * Profile — Gamification & Identity
 * Levels, XP, streaks, skill categories, achievements
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { COLORS, FONT, FONT_LINK } from '@/components/bioneer/ui/DesignTokens';
import { base44 } from '@/api/base44Client';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { getAllSessions } from '@/components/bioneer/data/unifiedSessionStore';
import { Settings, Award, Flame, TrendingUp, Star, ChevronRight } from 'lucide-react';
import XPProgressCard from '@/components/bioneer/gamification/XPProgressCard';

const LEVEL_NAMES = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite', 'Pro'];
function getLevelName(level) {
  if (level >= 40) return 'Pro';
  if (level >= 30) return 'Elite';
  if (level >= 20) return 'Advanced';
  if (level >= 10) return 'Intermediate';
  if (level >= 5) return 'Novice';
  return 'Beginner';
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [earned, setEarned] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.auth.me().catch(() => null),
      base44.entities.UserProfile.filter({}).catch(() => []),
      base44.entities.UserAchievement.filter({}).catch(() => []),
    ]).then(([u, profiles, achievements]) => {
      setUser(u);
      if (profiles?.length) setProfile(profiles[0]);
      setEarned(achievements || []);
      setLoading(false);
    });
  }, []);

  const sessions = useMemo(() => getAllSessions(), []);
  const earnedIds = new Set(earned.map(a => a.achievement_id));
  const level = profile?.level || 1;
  const levelName = getLevelName(level);

  // Skill categories from sessions
  const skillCategories = useMemo(() => {
    const cats = {};
    sessions.forEach(s => {
      const cat = s.category || 'general';
      if (!cats[cat]) cats[cat] = { count: 0, totalScore: 0 };
      cats[cat].count++;
      cats[cat].totalScore += s.average_form_score || 0;
    });
    return Object.entries(cats).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      sessions: data.count,
      avgScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
    })).sort((a, b) => b.sessions - a.sessions);
  }, [sessions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: COLORS.bg }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: COLORS.border, borderTopColor: COLORS.gold }} />
      </div>
    );
  }

  return (
    <div className="min-h-full" style={{ background: COLORS.bg, fontFamily: FONT.mono, color: COLORS.textPrimary }}>
      <link href={FONT_LINK} rel="stylesheet" />

      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: COLORS.border }}>
        <h1 className="text-xs tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.gold }}>Profile</h1>
        <button onClick={() => navigate('/Settings')} className="p-2 rounded hover:bg-white/5 transition">
          <Settings size={16} style={{ color: COLORS.textSecondary }} />
        </button>
      </div>

      <div className="px-5 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Identity Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border p-5 text-center"
          style={{ background: COLORS.surface, borderColor: COLORS.goldBorder }}
        >
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3" style={{ background: COLORS.goldDim, border: `2px solid ${COLORS.gold}` }}>
            <span className="text-2xl font-bold" style={{ color: COLORS.gold }}>
              {(user?.full_name || 'A')[0].toUpperCase()}
            </span>
          </div>
          <h2 className="text-sm font-bold" style={{ color: COLORS.textPrimary }}>
            {user?.full_name || 'Athlete'}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded text-[8px] font-bold tracking-[0.1em] uppercase"
              style={{ background: COLORS.goldDim, color: COLORS.gold, border: `1px solid ${COLORS.goldBorder}` }}>
              {levelName}
            </span>
            <span className="text-[9px]" style={{ color: COLORS.textTertiary }}>Level {level}</span>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { icon: Flame, label: 'Streak', value: `${profile?.current_streak || 0}d` },
              { icon: Star, label: 'XP', value: profile?.xp_total || 0 },
              { icon: Award, label: 'Badges', value: earnedIds.size },
            ].map(s => (
              <div key={s.label} className="py-2">
                <s.icon size={14} style={{ color: COLORS.gold }} className="mx-auto mb-1" />
                <div className="text-sm font-bold" style={{ color: COLORS.textPrimary }}>{s.value}</div>
                <div className="text-[7px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary }}>{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* XP Progress */}
        <XPProgressCard />

        {/* Skill Categories */}
        {skillCategories.length > 0 && (
          <div className="space-y-3">
            <p className="text-[8px] tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.textTertiary }}>
              Skill Categories
            </p>
            {skillCategories.map(cat => (
              <div key={cat.name} className="px-4 py-3 rounded-lg border flex items-center justify-between"
                style={{ background: COLORS.surface, borderColor: COLORS.border }}>
                <div>
                  <p className="text-[10px] font-bold capitalize" style={{ color: COLORS.textPrimary }}>{cat.name}</p>
                  <p className="text-[8px] mt-0.5" style={{ color: COLORS.textTertiary }}>{cat.sessions} sessions</p>
                </div>
                <span className="text-sm font-bold" style={{ color: COLORS.gold }}>{cat.avgScore}</span>
              </div>
            ))}
          </div>
        )}

        {/* Achievements Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[8px] tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.textTertiary }}>
              Achievements ({earnedIds.size}/{ACHIEVEMENTS.length})
            </p>
            <button onClick={() => navigate('/Achievements')} className="text-[8px] flex items-center gap-0.5" style={{ color: COLORS.gold }}>
              View all <ChevronRight size={10} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ACHIEVEMENTS.slice(0, 4).map(a => {
              const isEarned = earnedIds.has(a.id);
              return (
                <div key={a.id} className="rounded-lg border p-3 flex items-center gap-2"
                  style={{ background: isEarned ? 'rgba(201,162,39,0.06)' : COLORS.surface, borderColor: isEarned ? COLORS.goldBorder : COLORS.border, opacity: isEarned ? 1 : 0.4 }}>
                  <span className="text-lg">{a.emoji}</span>
                  <p className="text-[8px] font-bold" style={{ color: isEarned ? COLORS.gold : COLORS.textTertiary }}>{a.title}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}