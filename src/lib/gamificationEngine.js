/**
 * Gamification Engine — Points, XP, and Progression System
 */
import { base44 } from '@/api/base44Client';
import toast from 'react-hot-toast';

// Points awarded for various actions
export const POINT_VALUES = {
  SESSION_COMPLETE: 100,        // Per session
  PERSONAL_BEST: 50,            // Breaking a previous form score record
  PERFECT_REP: 10,              // Single rep with 95+ score
  ZERO_FAULT_SET: 75,           // 10+ reps with 0 faults
  STREAK_DAY: 25,               // Daily streak bonus
  EXERCISE_MASTERY: 150,        // Achieving 85+ avg on exercise
  ELITE_MASTERY: 200,           // Achieving 90+ avg on exercise
};

// XP thresholds for level progression
export const LEVEL_THRESHOLDS = [
  0, 500, 1200, 2100, 3200, 4500, 6000, 7700, 9600, 11700, 14000, // 1-11
  16500, 19200, 22100, 25200, 28500, 32000, 35700, 39600, 43700,   // 12-20
  48000, 52500, 57200, 62100, 67200, 72500, 78000, 83700, 89600, 95700, // 21-30
  102000, 108500, 115200, 122100, 129200, 136500, 144000, 151700, 159600, 167700, // 31-40
  176000, 184500, 193200, 202100, 211200, 220500, 230000, 239700, 249600, 259700, // 41-50
];

export const MAX_LEVEL = 50;

/**
 * Award points to user and calculate new level
 */
export async function awardPoints(pointsEarned, reason = 'Session Complete') {
  let user;
  try { user = await base44.auth.me(); } catch { return null; }
  if (!user) return null;

  try {
    // Fetch current profile
    let profile = null;
    try {
      profile = await base44.entities.UserProfile.filter({ created_by: user.email });
      profile = profile?.[0];
    } catch { /* no profile yet */ }

    const currentXP = profile?.xp_total ?? 0;
    const currentLevel = profile?.level ?? 1;
    const newXP = currentXP + pointsEarned;
    const newLevel = calculateLevel(newXP);

    // Update profile
    if (profile?.id) {
      await base44.entities.UserProfile.update(profile.id, {
        xp_total: newXP,
        level: newLevel,
      });
    } else {
      // Create first time
      await base44.entities.UserProfile.create({
        xp_total: newXP,
        level: newLevel,
      });
    }

    // Level up toast
    if (newLevel > currentLevel) {
      toast(`🎉 LEVEL ${newLevel} REACHED!`, {
        duration: 4000,
        style: {
          background: '#0c0c0c',
          border: '1px solid rgba(201,162,39,0.5)',
          color: '#C9A84C',
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
        },
      });
    }

    return { xp: newXP, level: newLevel, pointsEarned };
  } catch (error) {
    console.error('Failed to award points:', error);
    return null;
  }
}

/**
 * Calculate level based on total XP
 */
export function calculateLevel(totalXP) {
  for (let level = MAX_LEVEL; level >= 1; level--) {
    if (totalXP >= LEVEL_THRESHOLDS[level - 1]) {
      return level;
    }
  }
  return 1;
}

/**
 * Get XP needed for next level
 */
export function getXPToNextLevel(currentXP, currentLevel) {
  if (currentLevel >= MAX_LEVEL) return 0;
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel];
  return Math.max(0, nextThreshold - currentXP);
}

/**
 * Get progress to next level (0-100%)
 */
export function getLevelProgress(totalXP, level) {
  if (level >= MAX_LEVEL) return 100;
  const currentThreshold = LEVEL_THRESHOLDS[level - 1];
  const nextThreshold = LEVEL_THRESHOLDS[level];
  const progress = Math.round(((totalXP - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
  return Math.min(100, Math.max(0, progress));
}

/**
 * Award points for session completion
 */
export async function awardSessionPoints(session) {
  let totalPoints = POINT_VALUES.SESSION_COMPLETE;

  // Personal best bonus
  const isPB = checkPersonalBest(session);
  if (isPB) totalPoints += POINT_VALUES.PERSONAL_BEST;

  // Perfect rep bonus
  if (session.mastery_avg >= 95) totalPoints += POINT_VALUES.PERFECT_REP * (session.reps_detected || 1);

  // Zero fault set
  if ((session.reps_detected || 0) >= 10 && !session.top_faults?.length) {
    totalPoints += POINT_VALUES.ZERO_FAULT_SET;
  }

  return awardPoints(totalPoints, 'Session Complete');
}

/**
 * Check if session is a personal best
 */
function checkPersonalBest(session) {
  const sessions = getAllSessions();
  const exerciseId = session.exercise_id || session.movement_id;
  const prevSessions = sessions.filter(s => (s.exercise_id || s.movement_id) === exerciseId && s.id !== session.id);
  if (!prevSessions.length) return true;
  const prevMax = Math.max(...prevSessions.map(s => s.form_score_overall || 0));
  return (session.form_score_overall || 0) > prevMax;
}

/**
 * Fetch leaderboard data — top users by XP/level
 */
export async function getLeaderboard(limit = 100) {
  try {
    const profiles = await base44.entities.UserProfile.list('-xp_total', limit);
    if (!profiles) return [];
    return profiles.map((p, idx) => ({
      rank: idx + 1,
      email: p.created_by,
      level: p.level || 1,
      xp: p.xp_total || 0,
      sessions: p.total_sessions || 0,
      streak: p.current_streak || 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Get user rank on global leaderboard
 */
export async function getUserRank(userEmail) {
  try {
    const leaderboard = await getLeaderboard(500);
    const rank = leaderboard.findIndex(u => u.email === userEmail);
    return rank >= 0 ? rank + 1 : null;
  } catch {
    return null;
  }
}

// Helper to get all sessions (imported from store)
function getAllSessions() {
  try {
    const { getAllSessions } = require('@/components/bioneer/data/unifiedSessionStore');
    return getAllSessions();
  } catch {
    return [];
  }
}