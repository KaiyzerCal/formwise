import { supabase } from '@/api/supabaseClient';

const XP_PER_SESSION = 50;
const XP_PER_LEVEL   = 500;

export function calculateStreak(lastSessionDate) {
  if (!lastSessionDate) return 0;
  const last  = new Date(lastSessionDate); last.setHours(0,0,0,0);
  const today = new Date();               today.setHours(0,0,0,0);
  const diff  = Math.floor((today - last) / 86400000);
  return diff > 1 ? 0 : 1;
}

export async function recordSession() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    let { data: profile, error } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single();
    if (error && error.code !== 'PGRST116') throw error;

    if (!profile) {
      const { data: np } = await supabase.from('user_profiles')
        .insert({ user_id: user.id, total_sessions: 0, current_streak: 0, longest_streak: 0, xp_total: 0, level: 1 })
        .select().single();
      profile = np;
    }

    const newStreak     = Math.max(profile.current_streak || 0, calculateStreak(profile.last_session_date)) + 1;
    const longestStreak = Math.max(profile.longest_streak || 0, newStreak);
    const newXP         = (profile.xp_total || 0) + XP_PER_SESSION;
    const newLevel      = Math.floor(newXP / XP_PER_LEVEL) + 1;

    await supabase.from('user_profiles').update({ total_sessions: (profile.total_sessions || 0) + 1, current_streak: newStreak, longest_streak: longestStreak, last_session_date: new Date().toISOString(), xp_total: newXP, level: newLevel }).eq('user_id', user.id);

    return { newStreak, xpGained: XP_PER_SESSION, newLevel, streakMilestone: newStreak % 7 === 0 };
  } catch (e) { console.error('recordSession error:', e); return null; }
}

export async function getUserEngagement(userEmail) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single();
    if (!profile) return { streak: 0, xp: 0, level: 1, totalSessions: 0, longestStreak: 0 };
    return {
      streak:           profile.current_streak || 0,
      xp:               profile.xp_total || 0,
      level:            profile.level || 1,
      totalSessions:    profile.total_sessions || 0,
      longestStreak:    profile.longest_streak || 0,
      lastSessionDate:  profile.last_session_date,
      pushEnabled:      profile.push_notifications_enabled,
      notificationTime: profile.preferred_notification_time,
    };
  } catch { return null; }
}

export function isStreakAtRisk(lastSessionDate) {
  if (!lastSessionDate) return false;
  return (Date.now() - new Date(lastSessionDate).getTime()) / 3600000 > 23;
}
