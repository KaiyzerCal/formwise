import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { COLORS, FONT } from '../ui/DesignTokens';
import { supabase } from '@/api/supabaseClient';
import { calculateLevel, getLevelProgress, getXPToNextLevel, MAX_LEVEL } from '@/lib/gamificationEngine';
import { Zap } from 'lucide-react';

export default function XPProgressCard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('user_profiles').select('xp_total, level').eq('user_id', user.id).single();
        setProfile(data || { level: 1, xp_total: 0 });
      } catch { setProfile({ level: 1, xp_total: 0 }); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading || !profile) return (
    <div className="flex items-center justify-center py-4">
      <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: COLORS.gold, borderTopColor: 'transparent' }} />
    </div>
  );

  const level    = profile.level || 1;
  const xp       = profile.xp_total || 0;
  const progress = getLevelProgress(xp, level);
  const toNext   = getXPToNextLevel(xp, level);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg border space-y-3"
      style={{ background: COLORS.surface, borderColor: COLORS.goldBorder }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={14} style={{ color: COLORS.gold }} />
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
            LEVEL {level}
          </span>
        </div>
        <span className="text-[9px] tracking-[0.1em]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          {xp.toLocaleString()} XP
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full" style={{ background: COLORS.border }}>
        <motion.div className="h-full rounded-full" style={{ background: COLORS.gold, width: `${progress}%` }}
          initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
      </div>
      {level < MAX_LEVEL && (
        <p className="text-[9px] tracking-[0.08em]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          {toNext.toLocaleString()} XP to Level {level + 1}
        </p>
      )}
    </motion.div>
  );
}
