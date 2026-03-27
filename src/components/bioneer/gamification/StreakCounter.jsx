import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { COLORS, FONT } from '../ui/DesignTokens';
import { Flame } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function StreakCounter() {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStreak() {
      try {
        const user = await base44.auth.me();
        if (!user) return;

        let profile = await base44.entities.UserProfile.filter({ created_by: user.email });
        profile = profile?.[0];
        
        setStreak(profile?.current_streak || 0);
      } catch (error) {
        console.error('Failed to load streak:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStreak();
  }, []);

  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border"
      style={{
        background: streak > 0 ? 'rgba(201,162,39,0.1)' : COLORS.surface,
        borderColor: streak > 0 ? COLORS.goldBorder : COLORS.border,
      }}
    >
      {streak > 0 && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
        >
          <Flame size={16} style={{ color: '#FF6B35' }} />
        </motion.div>
      )}
      <div>
        <p className="text-[9px] font-bold tracking-[0.1em] uppercase"
          style={{ color: streak > 0 ? COLORS.gold : COLORS.textSecondary, fontFamily: FONT.mono }}>
          {streak > 0 ? `${streak} Day Streak` : 'Start a streak'}
        </p>
      </div>
    </motion.div>
  );
}