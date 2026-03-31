import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { COLORS, FONT } from '../ui/DesignTokens';
import { Flame } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

export default function StreakCounter() {
  const [streak, setStreak]   = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('user_profiles').select('current_streak').eq('user_id', user.id).single();
        setStreak(data?.current_streak || 0);
      } catch { /* no profile yet */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return null;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border"
      style={{ background: streak > 0 ? 'rgba(201,162,39,0.1)' : COLORS.surface, borderColor: streak > 0 ? COLORS.goldBorder : COLORS.border }}>
      <Flame size={12} style={{ color: streak > 0 ? COLORS.gold : COLORS.textTertiary }} />
      <span className="text-[9px] font-bold tracking-[0.12em] uppercase" style={{ color: streak > 0 ? COLORS.gold : COLORS.textTertiary, fontFamily: FONT.mono }}>
        {streak} day streak
      </span>
    </motion.div>
  );
}
