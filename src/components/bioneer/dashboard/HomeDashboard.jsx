/**
 * HomeDashboard — Premium home screen with quick access to key features
 * Shows streak, level, quick-start button, and recent activity
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Flame, Trophy, Zap, Activity, ArrowRight, Play } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getAllSessions } from '../data/unifiedSessionStore';
import { COLORS, FONT } from '../ui/DesignTokens';
import { PremiumCard, StatCard, PrimaryButton, EmptyState } from '../ui/PremiumComponents';

export default function HomeDashboard({ onStartSession }) {
  const [userProfile, setUserProfile] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          const profile = await base44.entities.UserProfile.filter({ created_by: user.email });
          setUserProfile(profile[0] || null);
          
          const sessions = getAllSessions().slice(0, 3);
          setRecentSessions(sessions);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const streak = userProfile?.current_streak || 0;
  const level = userProfile?.level || 1;
  const nextLevel = level + 1;
  const progressPercent = ((level % 10) / 10) * 100;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: COLORS.bg, fontFamily: FONT.mono }}>
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="px-6 py-7 border-b space-y-5"
        style={{ borderColor: COLORS.border }}
      >
        <div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold tracking-[0.15em] uppercase"
            style={{ color: COLORS.gold, fontFamily: FONT.heading, letterSpacing: '0.08em' }}
          >
            BIONEER
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-[8px] tracking-[0.08em] uppercase mt-1.5 font-semibold"
            style={{ color: COLORS.textTertiary }}
          >
            Performance training system
          </motion.p>
        </div>

        {/* Primary CTA - Dominant placement */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="pt-1"
        >
          <PrimaryButton onClick={onStartSession} icon={Play}>
            Start Workout
          </PrimaryButton>
        </motion.div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 max-w-4xl"
        >
          {/* Key Metrics Row */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <StatCard
              label="Streak"
              value={`${streak}d`}
              color={COLORS.correct}
              icon={Flame}
              trend={streak > 0 ? { positive: true, text: 'Active' } : undefined}
            />
            <StatCard
              label="Level"
              value={level}
              color={COLORS.gold}
              icon={Trophy}
            />
            <StatCard
              label="Sessions"
              value={recentSessions.length || 0}
              color={COLORS.warning}
              icon={Activity}
            />
          </motion.div>

          {/* Progress to Next Level */}
          <motion.div variants={itemVariants}>
            <PremiumCard className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-semibold tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary }}>
                  Progress to Level {nextLevel}
                </span>
                <span className="text-xs font-bold" style={{ color: COLORS.gold }}>
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/8 overflow-hidden border border-white/5">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: COLORS.gold }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </PremiumCard>
          </motion.div>

          {/* Recent Sessions */}
          {recentSessions.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-3">
              <h3 className="text-[8px] font-semibold tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary }}>
                Recent Activity
              </h3>
              <div className="space-y-2">
                {recentSessions.map((session, idx) => (
                  <motion.div
                    key={session.session_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * (idx + 1) }}
                  >
                    <PremiumCard className="p-4 hover:border-gold/30 cursor-pointer transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="text-xs font-semibold" style={{ color: COLORS.textPrimary }}>
                            {session.movement_name || 'Session'}
                          </div>
                          <div className="text-[8px]" style={{ color: COLORS.textTertiary }}>
                            {new Date(session.started_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <motion.div
                            className="text-lg font-bold"
                            style={{ color: session.average_form_score >= 80 ? COLORS.correct : COLORS.warning }}
                          >
                            {Math.round(session.average_form_score)}
                          </motion.div>
                          <div className="text-[7px]" style={{ color: COLORS.textTertiary }}>
                            Form Score
                          </div>
                        </div>
                      </div>
                    </PremiumCard>
                  </motion.div>
                ))}
              </div>
              <Link
                to="/SessionHistory"
                className="inline-flex items-center gap-2 text-[8px] font-semibold tracking-[0.08em] uppercase transition-all hover:translate-x-1"
                style={{ color: COLORS.gold }}
              >
                View all sessions <ArrowRight size={12} />
              </Link>
            </motion.div>
          )}

          {/* Quick Links */}
          <motion.div variants={itemVariants} className="space-y-3">
            <h3 className="text-[8px] font-semibold tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary }}>
              Explore
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link to="/Analytics">
                <PremiumCard className="h-full p-5 hover:border-gold/30 transition-colors">
                  <div className="space-y-3">
                    <Zap size={20} style={{ color: COLORS.gold }} strokeWidth={1.5} />
                    <div>
                      <div className="text-xs font-semibold" style={{ color: COLORS.textPrimary }}>
                        Analytics
                      </div>
                      <div className="text-[8px] mt-1" style={{ color: COLORS.textTertiary }}>
                        View performance trends
                      </div>
                    </div>
                  </div>
                </PremiumCard>
              </Link>

              <Link to="/Progress">
                <PremiumCard className="h-full p-5 hover:border-gold/30 transition-colors">
                  <div className="space-y-3">
                    <Trophy size={20} style={{ color: COLORS.gold }} strokeWidth={1.5} />
                    <div>
                      <div className="text-xs font-semibold" style={{ color: COLORS.textPrimary }}>
                        Progress
                      </div>
                      <div className="text-[8px] mt-1" style={{ color: COLORS.textTertiary }}>
                        Track improvements
                      </div>
                    </div>
                  </div>
                </PremiumCard>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}