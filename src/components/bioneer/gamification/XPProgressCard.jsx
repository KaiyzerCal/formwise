import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { COLORS, FONT } from '../ui/DesignTokens';
import { base44 } from '@/api/base44Client';
import { calculateLevel, getLevelProgress, getXPToNextLevel, MAX_LEVEL } from '@/lib/gamificationEngine';
import { Zap } from 'lucide-react';

export default function XPProgressCard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const user = await base44.auth.me();
        if (!user) return;

        let profile = await base44.entities.UserProfile.filter({ created_by: user.email });
        profile = profile?.[0];
        
        setProfile(profile || { level: 1, xp_total: 0 });
      } catch (error) {
        console.error('Failed to load profile:', error);
        setProfile({ level: 1, xp_total: 0 });
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-4 h-4 rounded-full border-2 animate-spin"
          style={{ borderColor: COLORS.gold, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const currentXP = profile.xp_total || 0;
  const currentLevel = profile.level || 1;
  const progress = getLevelProgress(currentXP, currentLevel);
  const xpToNext = getXPToNextLevel(currentXP, currentLevel);
  const isMaxLevel = currentLevel >= MAX_LEVEL;

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={14} style={{ color: COLORS.gold }} />
          <p className="text-[10px] font-bold tracking-[0.1em] uppercase"
            style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
            XP Progress
          </p>
        </div>
        <p className="text-xs font-bold"
          style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
          Level {currentLevel}{currentLevel >= MAX_LEVEL && ' (MAX)'}
        </p>
      </div>

      {/* XP Bar */}
      <div className="space-y-2">
        <div className="h-3 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(to right, ${COLORS.gold}, ${COLORS.correct})` }}
          />
        </div>
        <div className="flex items-center justify-between text-[8px]"
          style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          <span>{currentXP.toLocaleString()} XP</span>
          <span>{progress}%</span>
          {!isMaxLevel && <span>{xpToNext.toLocaleString()} to next</span>}
        </div>
      </div>

      {/* Level Milestone */}
      {!isMaxLevel && (
        <div className="px-2 py-1.5 rounded text-[9px] text-center font-bold tracking-[0.08em] uppercase"
          style={{
            background: COLORS.goldDim,
            border: `1px solid ${COLORS.goldBorder}`,
            color: COLORS.gold,
            fontFamily: FONT.mono,
          }}>
          Level {currentLevel + 1} coming soon
        </div>
      )}
    </motion.div>
  );
}