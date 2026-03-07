import { base44 } from "@/api/base44Client";
import { eventBus } from "./eventBus";
import { moduleEnabled } from "./moduleRegistry";

const SERVICE = "InstantReportService";

const SCORE_LABELS = [
  { min: 95, label: "ELITE"       },
  { min: 88, label: "STRONG"      },
  { min: 78, label: "GOOD"        },
  { min: 65, label: "NEEDS WORK"  },
  { min: 0,  label: "MAJOR ISSUE" },
];

const DRILL_RECS = {
  squat: [
    { title: "Goblet Squat", sets: 3, reps: 10, cue: "Elbows inside knees. Drive knees out. Chest tall." },
    { title: "Box Squat",    sets: 4, reps: 5,  cue: "Sit back to the box. Full depth. Controlled." },
  ],
  deadlift: [
    { title: "Romanian Deadlift", sets: 3, reps: 10, cue: "Hinge, don't squat. Bar close to legs. Neutral spine." },
  ],
  basketball_shot: [
    { title: "Form Shooting (5 ft)",  sets: 3, reps: 10, cue: "One-hand drill. Align elbow. Follow through." },
  ],
  baseball_swing: [
    { title: "Tee Work — Inside Pitch", sets: 3, reps: 15, cue: "Hands inside the ball. Short to contact." },
  ],
};

function getScoreLabel(score) {
  return (SCORE_LABELS.find(s => score >= s.min) ?? SCORE_LABELS[SCORE_LABELS.length - 1]).label;
}

function generateHeadline(label, primaryFaultLabel, movementId) {
  const name = movementId?.replace(/_/g, " ") ?? "Movement";
  if (!primaryFaultLabel) return `${name} — ${label}. Clean mechanics across the board.`;
  return `${label}. ${primaryFaultLabel.toLowerCase()} is the primary breakdown point.`;
}

export async function generateInstantReport(session) {
  const {
    id: sessionId,
    exercise_id: movementId,
    form_score_overall: overallScore = 0,
    alerts = [],
    phases = {},
    exercise_def,
  } = session;

  const score      = overallScore;
  const scoreLabel = getScoreLabel(score);

  // Build findings from alerts
  const faultCounts = {};
  for (const a of alerts) {
    faultCounts[a.joint] = (faultCounts[a.joint] ?? 0) + 1;
  }
  const sortedFaults = Object.entries(faultCounts).sort((a, b) => b[1] - a[1]);
  const topFindings  = sortedFaults.slice(0, 3).map(([joint, count]) => ({
    label:  joint,
    detail: `Flagged ${count} time${count !== 1 ? "s" : ""} during session`,
  }));

  const primaryFaultLabel = sortedFaults[0]?.[0] ?? null;

  const riskFlags = sortedFaults
    .filter(([, count]) => count >= 3)
    .map(([joint, count]) => ({ label: joint, severity: count >= 5 ? "HIGH" : "MODERATE" }));

  // Phase breakdown from phases obj
  const phaseBreakdown = Object.entries(phases).map(([phaseId, data]) => ({
    phase_id:    phaseId,
    phase_label: phaseId.toUpperCase(),
    score:       typeof data === "object" ? (data.avgScore ?? score) : data,
  }));

  const drills = DRILL_RECS[movementId] ?? [];
  const recommendedDrill = drills[0] ?? null;

  const headline = generateHeadline(scoreLabel, primaryFaultLabel, movementId);

  const report = await base44.entities.InstantReport.create({
    session_id:        sessionId,
    movement_id:       movementId,
    movement_name:     movementId?.replace(/_/g, " "),
    overall_score:     score,
    score_label:       scoreLabel,
    headline,
    primary_fault:     primaryFaultLabel ? { label: primaryFaultLabel, severity: "MODERATE", correction: "Review demo and focus on this joint." } : null,
    top_findings:      topFindings,
    risk_flags:        riskFlags,
    recommended_drill: recommendedDrill,
    phase_breakdown:   phaseBreakdown,
  });

  eventBus.emit("InstantReportReady", { reportId: report.id, sessionId });
  return report;
}

eventBus.subscribe("MovementAnalysisGenerated", async ({ payload }) => {
  if (!moduleEnabled("instantReport")) return;
  console.log(`[${SERVICE}] MovementAnalysisGenerated → generating report`);
  const session = await base44.entities.FormSession.filter({ id: payload.sessionId });
  if (session[0]) await generateInstantReport(session[0]);
});

export async function getInstantReport(sessionId) {
  const results = await base44.entities.InstantReport.filter({ session_id: sessionId });
  return results[0] ?? null;
}