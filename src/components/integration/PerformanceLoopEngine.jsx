import { base44 } from "@/api/base44Client";
import { eventBus } from "./eventBus";
import { moduleEnabled } from "./moduleRegistry";

const SERVICE = "PerformanceLoopEngine";

const XP_RULES = [
  { event: "session_completed",   xp: 50,  condition: () => true },
  { event: "score_above_80",      xp: 25,  condition: (s) => s.score >= 80 },
  { event: "score_above_90",      xp: 50,  condition: (s) => s.score >= 90 },
  { event: "zero_high_faults",    xp: 30,  condition: (s) => !(s.faults ?? []).some(f => f.severity === "HIGH") },
  { event: "five_rep_session",    xp: 20,  condition: (s) => (s.repCount ?? 0) >= 5 },
  { event: "streak_3",            xp: 75,  condition: (_, streak) => streak === 3 },
  { event: "streak_7",            xp: 150, condition: (_, streak) => streak === 7 },
];

const MILESTONES = [
  { id: "first_session",     label: "First Rep",     condition: (stats) => stats.totalSessions === 1 },
  { id: "score_90",          label: "Form Elite",    condition: (stats) => (stats.bestScore ?? 0) >= 90 },
  { id: "streak_7",          label: "7-Day Streak",  condition: (stats) => (stats.longestStreak ?? 0) >= 7 },
  { id: "squat_10_sessions", label: "Squat Student", condition: (stats, mvmt) => mvmt === "squat" && (stats.sessionCount ?? 0) >= 10 },
];

eventBus.subscribe("SessionReviewCompleted", async ({ payload }) => {
  if (!moduleEnabled("performanceLoop")) return;
  console.log(`[${SERVICE}] SessionReviewCompleted → computing XP + streak`);

  const { sessionId, userId, score, faults, movementId, repCount } = payload;
  if (!userId) return;

  // Get or create performance record
  let perfList = await base44.entities.UserPerformance.filter({ user_id: userId });
  let perf = perfList[0];
  if (!perf) {
    perf = await base44.entities.UserPerformance.create({ user_id: userId, total_xp: 0, current_streak: 0, longest_streak: 0 });
  }

  // Compute streak
  const today     = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const newStreak = perf.last_session_date === yesterday ? (perf.current_streak ?? 0) + 1 : 1;

  // Award XP
  let totalXP = 0;
  const sessionData = { score: score ?? 0, faults: faults ?? [], repCount: repCount ?? 0 };
  for (const rule of XP_RULES) {
    if (rule.condition(sessionData, newStreak)) {
      totalXP += rule.xp;
      await base44.entities.XPEvent.create({ user_id: userId, session_id: sessionId, xp_amount: rule.xp, reason: rule.event });
      eventBus.emit("XPAwarded", { userId, xp: rule.xp, reason: rule.event });
    }
  }

  // Update performance record
  await base44.entities.UserPerformance.update(perf.id, {
    total_xp:          (perf.total_xp ?? 0) + totalXP,
    current_streak:    newStreak,
    longest_streak:    Math.max(perf.longest_streak ?? 0, newStreak),
    last_session_date: today,
  });

  // Check milestones
  const allSessions = await base44.entities.FormSession.filter({ created_by: userId });
  const mvmtSessions = allSessions.filter(s => s.exercise_id === movementId);
  const bestScore = Math.max(...allSessions.map(s => s.form_score_overall ?? 0), 0);
  const stats = {
    totalSessions: allSessions.length,
    sessionCount:  mvmtSessions.length,
    bestScore,
    longestStreak: Math.max(perf.longest_streak ?? 0, newStreak),
  };

  for (const m of MILESTONES) {
    const already = await base44.entities.Milestone.filter({ user_id: userId, milestone_id: m.id });
    if (!already.length && m.condition(stats, movementId)) {
      await base44.entities.Milestone.create({ user_id: userId, movement_id: movementId, milestone_id: m.id, label: m.label });
      eventBus.emit("MilestoneUnlocked", { userId, milestoneId: m.id });
    }
  }
});

// ── API helpers ───────────────────────────────────────────────────────────────

export async function getUserPerformance(userId) {
  const list = await base44.entities.UserPerformance.filter({ user_id: userId });
  return list[0] ?? null;
}

export async function getUserXPEvents(userId, limit = 30) {
  return base44.entities.XPEvent.filter({ user_id: userId }, "-created_date", limit);
}

export async function getUserMilestones(userId) {
  return base44.entities.Milestone.filter({ user_id: userId });
}