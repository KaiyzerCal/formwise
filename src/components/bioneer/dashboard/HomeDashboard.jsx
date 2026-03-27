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
import { SPACING, MOTION } from '@/lib/spacingSystem';
import { LogoMark } from '../ui/LogoMark';
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
      {/* Header Section — Premium, minimal */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="border-b"
        style={{
          borderColor: COLORS.border,
          padding: SPACING.xl,
        }}
      >
        {/* Logo + Tagline */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.md,
            marginBottom: SPACING.lg,
          }}
        >
          <LogoMark size={40} color={COLORS.gold} />
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: '700',
                letterSpacing: '0.15em',
                color: COLORS.gold,
                margin: 0,
                textTransform: 'uppercase',
              }}
            >
              BIONEER
            </h1>
            <p
              style={{
                fontSize: '10px',
                color: COLORS.textTertiary,
                letterSpacing: '0.08em',
                margin: `${SPACING.xs} 0 0 0`,
                textTransform: 'uppercase',
              }}
            >
              Form Coaching System
            </p>
          </div>
        </motion.div>

        {/* Primary CTA — Dominant, large, confident */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <PrimaryButton onClick={onStartSession} icon={Play}>
            Start Workout
          </PrimaryButton>
        </motion.div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: SPACING.xl }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl"
          style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xl }}
        >
          {/* Key Metrics Row — Visual Hierarchy */}
          <motion.div
            variants={itemVariants}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: SPACING.md,
            }}
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
            <PremiumCard className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: COLORS.textTertiary }}>
                  Progress to Level {nextLevel}
                </span>
                <span className="text-sm font-bold" style={{ color: COLORS.gold }}>
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
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
            <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
              <h3
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  color: COLORS.textTertiary,
                  textTransform: 'uppercase',
                  margin: 0,
                }}
              >
                Recent Activity
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
                {recentSessions.map((session, idx) => (
                  <motion.div
                    key={session.session_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * (idx + 1) }}
                  >
                    <PremiumCard onClick={() => {}} highlight={false}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: COLORS.textPrimary,
                              marginBottom: SPACING.xs,
                            }}
                          >
                            {session.movement_name || 'Session'}
                          </div>
                          <div style={{ fontSize: '10px', color: COLORS.textTertiary }}>
                            {new Date(session.started_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <motion.div
                            style={{
                              fontSize: '20px',
                              fontWeight: '700',
                              color: session.average_form_score >= 80 ? COLORS.correct : COLORS.warning,
                              fontFamily: FONT.mono,
                            }}
                          >
                            {Math.round(session.average_form_score)}
                          </motion.div>
                          <div style={{ fontSize: '8px', color: COLORS.textTertiary, marginTop: SPACING.xs }}>
                            FORM
                          </div>
                        </div>
                      </div>
                    </PremiumCard>
                  </motion.div>
                ))}
              </div>
              <Link
                to="/SessionHistory"
                className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.1em] uppercase transition-all hover:translate-x-1"
                style={{ color: COLORS.gold }}
              >
                View all sessions <ArrowRight size={14} />
              </Link>
            </motion.div>
          )}

          {/* Quick Links */}
          <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
            <h3
              style={{
                fontSize: '10px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                color: COLORS.textTertiary,
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              Explore
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: SPACING.md,
              }}
            >
              <Link to="/Analytics" style={{ textDecoration: 'none' }}>
                <PremiumCard onClick={() => {}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
                    <Zap size={20} color={COLORS.gold} strokeWidth={1.5} />
                    <div style={{ fontSize: '13px', fontWeight: '600', color: COLORS.textPrimary }}>
                      Analytics
                    </div>
                    <div style={{ fontSize: '10px', color: COLORS.textTertiary, lineHeight: '1.4' }}>
                      Performance trends
                    </div>
                  </div>
                </PremiumCard>
              </Link>

              <Link to="/Progress" style={{ textDecoration: 'none' }}>
                <PremiumCard onClick={() => {}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
                    <Trophy size={20} color={COLORS.gold} strokeWidth={1.5} />
                    <div style={{ fontSize: '13px', fontWeight: '600', color: COLORS.textPrimary }}>
                      Progress
                    </div>
                    <div style={{ fontSize: '10px', color: COLORS.textTertiary, lineHeight: '1.4' }}>
                      Track improvements
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