import { base44 } from '@/api/base44Client';
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
  const authed = await base44.auth.isAuthenticated();
  if (!authed) return null;

  try {
    const profiles = await base44.entities.UserProfile.list();
    const profile = profiles?.[0];
    const currentXP    = profile?.xp_total ?? 0;
    const currentLevel = profile?.level ?? 1;
    const newXP        = currentXP + points;
    const newLevel     = calculateLevel(newXP);

    if (profile) {
      await base44.entities.UserProfile.update(profile.id, { xp_total: newXP, level: newLevel });
    } else {
      await base44.entities.UserProfile.create({ xp_total: newXP, level: newLevel });
    }

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

export async function getLeaderboard(limit = 100, currentUserEmail = null) {
  try {
    const data = await base44.entities.UserProfile.list('-xp_total', limit);
    return (data ?? []).map((p, i) => ({
      rank: i + 1,
      displayName: p.created_by?.split('@')[0] ?? `user-${i}`,
      email: p.created_by ?? '',
      level: p.level || 1,
      xp: p.xp_total || 0,
      sessions: p.total_sessions || 0,
      streak: p.current_streak || 0,
      isCurrentUser: currentUserEmail ? p.created_by === currentUserEmail : false,
    }));
  } catch { return []; }
}

export async function getUserRank(userEmail) {
  try {
    const lb = await getLeaderboard(500, userEmail);
    const r = lb.findIndex(u => u.isCurrentUser);
    return r >= 0 ? r + 1 : null;
  } catch { return null; }
}