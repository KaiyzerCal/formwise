import { base44 } from '@/api/base44Client';

/**
 * Retention Engine: Calculates streaks, XP, levels, and daily reminders
 */

const XP_PER_SESSION = 50;
const XP_PER_LEVEL = 500;

/**
 * Calculate current streak based on last session date
 */
export function calculateStreak(lastSessionDate) {
  if (!lastSessionDate) return 0;

  const lastDate = new Date(lastSessionDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastDate.setHours(0, 0, 0, 0);

  const diffTime = today - lastDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Streak broken if > 1 day since last session
  if (diffDays > 1) return 0;
  if (diffDays === 1) return 1;
  return 1; // Same day = streak continues
}

/**
 * Update user profile after session completion
 * Increments streak, XP, and level
 */
export async function recordSession(userEmail) {
  try {
    const user = await base44.auth.me();
    if (!user || user.email !== userEmail) return null;

    // Get or create user profile
    let profiles = await base44.entities.UserProfile.filter({ created_by: userEmail });
    let profile = profiles[0];

    if (!profile) {
      profile = await base44.entities.UserProfile.create({
        total_sessions: 0,
        current_streak: 0,
        longest_streak: 0,
        xp_total: 0,
        level: 1,
      });
    }

    // Calculate new streak
    const oldStreak = profile.current_streak || 0;
    const newStreak = Math.max(oldStreak, calculateStreak(profile.last_session_date)) + 1;
    const longestStreak = Math.max(profile.longest_streak || 0, newStreak);

    // Calculate new XP and level
    const newXP = (profile.xp_total || 0) + XP_PER_SESSION;
    const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;

    // Update profile
    await base44.entities.UserProfile.update(profile.id, {
      total_sessions: (profile.total_sessions || 0) + 1,
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_session_date: new Date().toISOString(),
      xp_total: newXP,
      level: newLevel,
    });

    return {
      newStreak,
      xpGained: XP_PER_SESSION,
      newLevel,
      streakMilestone: newStreak % 7 === 0, // Every 7 days
    };
  } catch (error) {
    console.error('Error recording session:', error);
    return null;
  }
}

/**
 * Get user's current streak and engagement metrics
 */
export async function getUserEngagement(userEmail) {
  try {
    let profiles = await base44.entities.UserProfile.filter({ created_by: userEmail });
    let profile = profiles[0];

    if (!profile) {
      return {
        streak: 0,
        xp: 0,
        level: 1,
        totalSessions: 0,
        longestStreak: 0,
      };
    }

    return {
      streak: profile.current_streak || 0,
      xp: profile.xp_total || 0,
      level: profile.level || 1,
      totalSessions: profile.total_sessions || 0,
      longestStreak: profile.longest_streak || 0,
      lastSessionDate: profile.last_session_date,
      pushEnabled: profile.push_notifications_enabled,
      notificationTime: profile.preferred_notification_time,
    };
  } catch (error) {
    console.error('Error fetching engagement:', error);
    return null;
  }
}

/**
 * Check if user's streak is about to break
 * (Returns true if > 23 hours since last session)
 */
export function isStreakAtRisk(lastSessionDate) {
  if (!lastSessionDate) return false;

  const lastDate = new Date(lastSessionDate);
  const now = new Date();
  const hoursSinceSession = (now - lastDate) / (1000 * 60 * 60);

  return hoursSinceSession > 23;
}