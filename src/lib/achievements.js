/**
 * Achievement definitions and evaluation engine — Supabase backend.
 */
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { base44 } from '@/api/base44Client';
import { getAllSessions } from '@/components/bioneer/data/unifiedSessionStore';

export const ACHIEVEMENTS = [
  { id: 'FIRST_STEP',    title: 'FIRST STEP',    desc: 'Complete your first session',                emoji: '🚀' },
  { id: 'CONSISTENT',    title: 'CONSISTENT',    desc: '7-day training streak',                       emoji: '🔥' },
  { id: 'PERFECTIONIST', title: 'PERFECTIONIST', desc: 'Score 95+ on any session',                    emoji: '💎' },
  { id: 'DEPTH_MASTER',  title: 'DEPTH MASTER',  desc: 'Squat depth optimal for 10 consecutive reps', emoji: '⬇️' },
  { id: 'IRON_WILL',     title: 'IRON WILL',     desc: 'Complete 50 total sessions',                  emoji: '🏋️' },
  { id: 'FORM_FREAK',    title: 'FORM FREAK',    desc: 'Avg 85+ over 10 sessions on one exercise',    emoji: '🎯' },
  { id: 'EARLY_RISER',   title: 'EARLY RISER',   desc: 'Complete a session before 7am',               emoji: '🌅' },
  { id: 'STRENGTH_WEEK', title: 'STRENGTH WEEK', desc: 'Hit all 5 major lifts in one week',           emoji: '💪' },
  { id: 'NO_FAULTS',     title: 'NO FAULTS',     desc: 'Complete a 10-rep set with 0 faults',         emoji: '✅' },
  { id: 'COMEBACK',      title: 'COMEBACK',      desc: 'Return after 7+ days off',                    emoji: '↩️' },
  { id: 'SOCIAL',        title: 'SOCIAL',        desc: 'Share your first session',                    emoji: '📤' },
  { id: 'ELITE',         title: 'ELITE',         desc: 'Reach PROFICIENT mastery on 3 exercises',     emoji: '🏆' },
];

const MAJOR_LIFTS = ['back_squat','squat','deadlift','bench_press','overhead_press','barbell_row','pull_up'];

function checkEarned(sessions, extraFlags = {}) {
  const earned = new Set();
  if (!sessions.length) return earned;

  const sorted = [...sessions].sort((a, b) => new Date(a.started_at||0) - new Date(b.started_at||0));

  if (sessions.length >= 1)  earned.add('FIRST_STEP');
  if (sessions.length >= 50) earned.add('IRON_WILL');
  if (sessions.some(s => (s.movement_score ?? s.form_score_overall ?? 0) >= 95)) earned.add('PERFECTIONIST');
  if (sessions.some(s => (s.reps_detected ?? 0) >= 10 && !s.top_faults?.length && !s.alerts?.length)) earned.add('NO_FAULTS');
  if (sessions.some(s => s.started_at && new Date(s.started_at).getHours() < 7)) earned.add('EARLY_RISER');

  // 7-day streak
  const daySet = new Set(sorted.map(s => s.started_at ? new Date(s.started_at).toDateString() : null).filter(Boolean));
  const days = Array.from(daySet).map(d => new Date(d)).sort((a,b) => a-b);
  let streak = 1, maxStreak = 1;
  for (let i = 1; i < days.length; i++) {
    if ((days[i] - days[i-1]) / 86400000 <= 1.5) { streak++; maxStreak = Math.max(maxStreak, streak); } else streak = 1;
  }
  if (maxStreak >= 7) earned.add('CONSISTENT');

  // Comeback — 7+ day gap
  for (let i = 1; i < sorted.length; i++) {
    if (!sorted[i].started_at || !sorted[i-1].started_at) continue;
    if ((new Date(sorted[i].started_at) - new Date(sorted[i-1].started_at)) / 86400000 >= 7) { earned.add('COMEBACK'); break; }
  }

  // Per-exercise maps
  const exMap = {};
  sessions.forEach(s => {
    const id = s.movement_id || s.exercise_id;
    if (!id) return;
    if (!exMap[id]) exMap[id] = [];
    exMap[id].push(s.movement_score ?? s.form_score_overall ?? 0);
  });

  // FORM_FREAK
  if (Object.values(exMap).some(scores => scores.length >= 10 && scores.reduce((a,b)=>a+b,0)/scores.length >= 85)) earned.add('FORM_FREAK');

  // STRENGTH_WEEK
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7);
  const thisWeek = sessions.filter(s => s.started_at && new Date(s.started_at) >= weekStart);
  const liftIds = new Set(thisWeek.map(s => s.movement_id || s.exercise_id).filter(Boolean));
  if (MAJOR_LIFTS.filter(l => liftIds.has(l)).length >= 5) earned.add('STRENGTH_WEEK');

  // ELITE
  if (Object.values(exMap).filter(scores => scores.length >= 20 && scores.reduce((a,b)=>a+b,0)/scores.length >= 90).length >= 3) earned.add('ELITE');

  // Extra flags
  Object.entries(extraFlags).forEach(([k, v]) => { if (v) earned.add(k); });

  return earned;
}

export async function checkAndAwardAchievements(extraFlags = {}) {
  const authed = await base44.auth.isAuthenticated();
  if (!authed) return;

  const sessions = getAllSessions();
  const earned   = checkEarned(sessions, extraFlags);

  let existing = [];
  try {
    existing = await base44.entities.UserAchievement.list();
  } catch { return; }

  const existingIds = new Set((existing || []).map(a => a.achievement_id));
  const newlyEarned = [...earned].filter(id => !existingIds.has(id));

  for (const id of newlyEarned) {
    const def = ACHIEVEMENTS.find(a => a.id === id);
    if (!def) continue;
    try {
      await base44.entities.UserAchievement.create({ achievement_id: id, title: def.title, earned_at: new Date().toISOString() });
      toast(`${def.emoji} ACHIEVEMENT UNLOCKED — ${def.title}`, { duration: 4000, style: { background: '#0c0c0c', border: '1px solid rgba(201,162,39,0.5)', color: '#C9A84C', fontFamily:"'DM Mono',monospace", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em' } });
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 }, colors: ['#C9A84C','#fff','#ffd700'] });
    } catch { /* duplicate — ignore */ }
  }
}