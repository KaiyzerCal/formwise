import { base44 } from "@/api/base44Client";
import { eventBus } from "./eventBus";
import { moduleEnabled } from "./moduleRegistry";

const SERVICE = "BiomechanicsEngine";

function calcAngle(A, B, C) {
  const BA = { x: A.x - B.x, y: A.y - B.y };
  const BC = { x: C.x - B.x, y: C.y - B.y };
  const dot     = BA.x * BC.x + BA.y * BC.y;
  const magBA   = Math.sqrt(BA.x ** 2 + BA.y ** 2);
  const magBC   = Math.sqrt(BC.x ** 2 + BC.y ** 2);
  if (magBA === 0 || magBC === 0) return null;
  return Math.round(Math.acos(Math.max(-1, Math.min(1, dot / (magBA * magBC)))) * (180 / Math.PI));
}

export function extractMetrics(frames, movementId) {
  const metrics = [];
  for (const frame of frames) {
    const j = frame;
    const m = { phase: frame.phase, movement_id: movementId, t_ms: frame.tMs ?? 0 };

    if (j.l_hip && j.l_knee && j.l_ankle)   m.knee_angle_l   = calcAngle(j.l_hip, j.l_knee, j.l_ankle);
    if (j.r_hip && j.r_knee && j.r_ankle)   m.knee_angle_r   = calcAngle(j.r_hip, j.r_knee, j.r_ankle);
    if (j.l_shoulder && j.l_hip && j.l_knee) m.hip_angle_l   = calcAngle(j.l_shoulder, j.l_hip, j.l_knee);
    if (j.l_shoulder && j.l_elbow && j.l_wrist) m.elbow_angle_l = calcAngle(j.l_shoulder, j.l_elbow, j.l_wrist);

    if (m.knee_angle_l != null && m.knee_angle_r != null) {
      const avg = (m.knee_angle_l + m.knee_angle_r) / 2;
      m.knee_asymmetry = avg > 0 ? Math.abs(m.knee_angle_l - m.knee_angle_r) / avg * 100 : 0;
    }
    metrics.push(m);
  }
  return metrics;
}

export async function persistMetrics(sessionId, userId, movementId, frames) {
  const metrics = extractMetrics(frames, movementId);
  const batchSize = 20;
  for (let i = 0; i < metrics.length; i += batchSize) {
    const batch = metrics.slice(i, i + batchSize).map(m => ({
      session_id: sessionId, user_id: userId, ...m,
    }));
    await base44.entities.BiomechanicsMetric.bulkCreate(batch);
  }
  return metrics;
}

export async function getBenchmark(userId, movementId, sessionScore) {
  const userReports = await base44.entities.InstantReport.filter({ movement_id: movementId });
  const scores = userReports.map(r => r.overall_score ?? 0).filter(s => s > 0);
  const personalBest = scores.length ? Math.max(...scores) : sessionScore;
  const cohortAvg    = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : sessionScore;

  return {
    vsPersonalBest:   personalBest > 0 ? (((sessionScore - personalBest) / personalBest) * 100).toFixed(1) : "0.0",
    vsCohortAvg:      cohortAvg > 0    ? (((sessionScore - cohortAvg) / cohortAvg) * 100).toFixed(1) : "0.0",
    cohortPercentile: sessionScore >= cohortAvg ? "above avg" : "avg range",
    personalBest,
    cohortAvg: Math.round(cohortAvg),
  };
}

eventBus.subscribe("MovementAnalysisGenerated", async ({ payload }) => {
  if (!moduleEnabled("biomechanics")) return;
  console.log(`[${SERVICE}] MovementAnalysisGenerated → extracting biomechanics`);
  // frames would come from session analysis context; this is the hook point
  // actual frame data is wired from the CameraView session context
});