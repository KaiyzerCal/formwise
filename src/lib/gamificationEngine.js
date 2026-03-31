import { supabase } from '@/api/supabaseClient';
import toast from 'react-hot-toast';

export const POINT_VALUES = {
  SESSION_COMPLETE: 100, PERSONAL_BEST: 50, PERFECT_REP: 10,
  ZERO_FAULT_SET: 75,   STREAK_DAY: 25,    EXERCISE_MASTERY: 150, ELITE_MASTERY: 200,
};

export const LEVEL_THRESHOLDS = [
  0,500,1200,2100,3200,4500,6000,7700,9600,11700,14000,
  16500,19200,22100,25200,28500,32000,35700,39600,43700,
  48000,52500,57200,62100,67200,72500,78000,83700,89600,95700,
  102000,108500,115200,122100,129200,136500,144000,151700,159600,167700,
  176000,184500,193200,202100,211200,220500,230000,239700,249600,259700,
];
export const MAX_LEVEL = 50;

export function calculateLevel(xp) {
  for (let l = MAX_LEVEL; l >= 1; l--) if (xp >= LEVEL_THRESHOLDS[l-1]) return l;
  return 1;
}
export function getXPToNextLevel(xp, level) {
  if (level >= MAX_LEVEL) return 0;
  return Math.max(0, LEVEL_THRESHOLDS[level] - xp);
}
export function getLevelProgress(xp, level) {
  if (level >= MAX_LEVEL) return 100;
  const cur  = LEVEL_THRESHOLDS[level-1];
  const next = LEVEL_THRESHOLDS[level];
  return Math.min(100, Math.max(0, Math.round(((xp - cur) / (next - cur)) * 100)));
}

export async function awardPoints(points, reason = 'Session Complete') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { data: profile } = await supabase.from('user_profiles').select('xp_total,level').eq('user_id', user.id).single();
    const currentXP    = profile?.xp_total ?? 0;
    const currentLevel = profile?.level ?? 1;
    const newXP        = currentXP + points;
    const newLevel     = calculateLevel(newXP);

    await supabase.from('user_profiles').upsert({ user_id: user.id, xp_total: newXP, level: newLevel }, { onConflict: 'user_id' });

    if (newLevel > currentLevel) {
      toast(`🎉 LEVEL ${newLevel} REACHED!`, { duration: 4000, style: { background: '#0c0c0c', border: '1px solid rgba(201,162,39,0.5)', color: '#C9A84C', fontFamily:"'DM Mono',monospace", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em' } });
    }
    return { xp: newXP, level: newLevel, pointsEarned: points };
  } catch (e) { console.error('awardPoints error:', e); return null; }
}

export async function awardSessionPoints(session) {
  let total = POINT_VALUES.SESSION_COMPLETE;
  if (session.mastery_avg >= 95) total += POINT_VALUES.PERFECT_REP * (session.reps_detected || 1);
  if ((session.reps_detected || 0) >= 10 && !session.top_faults?.length) total += POINT_VALUES.ZERO_FAULT_SET;
  return awardPoints(total, 'Session Complete');
}

export async function getLeaderboard(limit = 100) {
  try {
    const { data, error } = await supabase.from('user_profiles').select('user_id,xp_total,level,total_sessions,current_streak,email').order('xp_total', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []).map((p, i) => ({
      rank: i+1, email: p.email ?? `user-${p.user_id?.slice(0,8)}`,
      level: p.level||1, xp: p.xp_total||0, sessions: p.total_sessions||0, streak: p.current_streak||0,
    }));
  } catch { return []; }
}

export async function getUserRank(userId) {
  try {
    const lb = await getLeaderboard(500);
    const r  = lb.findIndex(u => u.user_id === userId);
    return r >= 0 ? r+1 : null;
  } catch { return null; }
}
