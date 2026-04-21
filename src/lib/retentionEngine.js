import { base44 } from '@/api/base44Client';
import { getAllSessions } from '@/components/bioneer/data/unifiedSessionStore';

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
    const authed = await base44.auth.isAuthenticated();
    if (!authed) return null;

    const profiles = await base44.entities.UserProfile.list();
    let profile = profiles?.[0];

    if (!profile) {
      profile = await base44.entities.UserProfile.create({
        total_sessions: 0, current_streak: 0, longest_streak: 0, xp_total: 0, level: 1,
      });
    }

    const newStreak     = Math.max(profile.current_streak || 0, calculateStreak(profile.last_session_date)) + 1;
    const longestStreak = Math.max(profile.longest_streak || 0, newStreak);
    const newXP         = (profile.xp_total || 0) + XP_PER_SESSION;
    const newLevel      = Math.floor(newXP / XP_PER_LEVEL) + 1;

    await base44.entities.UserProfile.update(profile.id, {
      total_sessions: (profile.total_sessions || 0) + 1,
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_session_date: new Date().toISOString(),
      xp_total: newXP,
      level: newLevel,
    });

    return { newStreak, xpGained: XP_PER_SESSION, newLevel, streakMilestone: newStreak % 7 === 0 };
  } catch (e) { console.error('recordSession error:', e); return null; }
}

export async function getUserEngagement() {
  try {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) return null;
    const profiles = await base44.entities.UserProfile.list();
    const profile = profiles?.[0];
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

/**
 * getMovementReviewHistory — returns score history for a given exercise
 * Used by AXIS Replay for continuity line
 */
export function getMovementReviewHistory(exerciseId) {
  const sessions = getAllSessions()
    .filter(s => (s.movement_id || s.exercise_id) === exerciseId)
    .sort((a, b) => new Date(a.started_at || 0) - new Date(b.started_at || 0));

  if (!sessions.length) {
    return { reviewCount: 0, firstScore: 0, latestScore: 0, improvement: 0, firstDate: null };
  }

  const firstScore = sessions[0].average_form_score ?? sessions[0].form_score_overall ?? 0;
  const latestScore = sessions[sessions.length - 1].average_form_score ?? sessions[sessions.length - 1].form_score_overall ?? 0;

  return {
    reviewCount: sessions.length,
    firstScore: Math.round(firstScore),
    latestScore: Math.round(latestScore),
    improvement: Math.round(latestScore - firstScore),
    firstDate: sessions[0].started_at || null,
  };
}