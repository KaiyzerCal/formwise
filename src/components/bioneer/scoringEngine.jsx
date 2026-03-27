// ─── Scoring Engine ─────────────────────────────────────────────────────────
// Weighted dimension scoring + single-cue priority selection + score labels

// ─── Dimension Weights ────────────────────────────────────────────────────────

export const DIMENSION_WEIGHTS = {
  squat: {
    depth:         0.20,
    kneeTracking:  0.20,
    spinePosition: 0.20,
    hipControl:    0.15,
    tempoControl:  0.10,
    footBalance:   0.15,
  },
  deadlift: {
    spineIntegrity:    0.25,
    barPathEfficiency: 0.20,
    hipHingePattern:   0.20,
    startPosition:     0.15,
    lockoutControl:    0.10,
    tempoTension:      0.10,
  },
  pushup: {
    bodyLine:        0.25,
    depth:           0.20,
    elbowPath:       0.15,
    scapularControl: 0.20,
    neckPosition:    0.10,
    tempoControl:    0.10,
  },
};

// ─── Overall Score ────────────────────────────────────────────────────────────

export function calcOverallScore(dimensionScores, exerciseId) {
  const weights = DIMENSION_WEIGHTS[exerciseId];
  if (!weights) return 0;
  return Math.round(
    Object.entries(dimensionScores).reduce((sum, [dim, score]) => {
      return sum + score * (weights[dim] ?? 0);
    }, 0)
  );
}

// ─── Per-Dimension Scoring Rules ─────────────────────────────────────────────

/**
 * Returns { scores: { dim: 0-100 }, redFlags: [ { id, state, penaltyPoints } ] }
 * repData shape: { hipAngle, kneeAngle, spineAngle, wristXDrift, elbow, ... }
 */
export function calcDimensionScores(exerciseId, repData) {
  switch (exerciseId) {
    case "squat":     return calcSquatDimensions(repData);
    case "deadlift":  return calcDeadliftDimensions(repData);
    case "pushup":    return calcPushupDimensions(repData);
    default:          return { scores: {}, redFlags: [] };
  }
}

// ─── SQUAT ────────────────────────────────────────────────────────────────────

function calcSquatDimensions(d) {
  const scores = {};
  const redFlags = [];

  // Depth (20%)
  const hip = d.bottomHipAngle ?? 180;
  if (hip >= 85 && hip <= 105) scores.depth = 100;
  else if (hip >= 75 && hip <= 115) scores.depth = 75;
  else if (hip >= 65 && hip <= 125) scores.depth = 45;
  else scores.depth = 20;
  if (hip > 115) redFlags.push({ id: "insufficient_depth", state: "WARNING", penaltyPoints: 15 });

  // Knee Tracking (20%)
  const valgus = d.avgValgusDeviationPct ?? 0;
  scores.kneeTracking = Math.max(0, 100 - valgus * 300);
  if (valgus > 0.05) redFlags.push({ id: "knee_valgus", state: "DANGER", penaltyPoints: 30 });

  // Spine Position (20%)
  const spine = d.bottomSpineAngle ?? 0;
  if (spine <= 20)      scores.spinePosition = 100;
  else if (spine <= 30) scores.spinePosition = 75;
  else if (spine <= 40) scores.spinePosition = 45;
  else {
    scores.spinePosition = 15;
    redFlags.push({ id: "spine_collapse", state: "DANGER", penaltyPoints: 30 });
  }

  // Hip Control (15%)
  const hipAsym = d.hipAsymmetryPct ?? 0;
  scores.hipControl = Math.max(0, 100 - Math.max(0, hipAsym - 3) * 10);
  if (hipAsym > 8) redFlags.push({ id: "hip_shift", state: "WARNING", penaltyPoints: 20 });

  // Tempo Control (10%)
  const descent = d.descentDurationSec ?? 2;
  if (descent >= 1.5)     scores.tempoControl = 100;
  else if (descent < 0.8) scores.tempoControl = 50;
  else                    scores.tempoControl = Math.max(50, 100 - ((1.5 - descent) / 0.1) * 5);
  if (descent < 0.8) redFlags.push({ id: "rushed_tempo", state: "WARNING", penaltyPoints: 10 });

  // Foot Balance (15%)
  if (d.heelRisePct == null) {
    // No data — exclude from score (set null so caller can skip)
    scores.footBalance = null;
  } else {
    scores.footBalance = d.heelRisePct > 0.03 ? 50 : 100;
    if (d.heelRisePct > 0.03) redFlags.push({ id: "heel_lift", state: "WARNING", penaltyPoints: 15 });
  }

  return { scores, redFlags };
}

// ─── DEADLIFT ─────────────────────────────────────────────────────────────────

function calcDeadliftDimensions(d) {
  const scores = {};
  const redFlags = [];

  // Spine Integrity (25%) — worst frame
  const worstSpine = d.worstSpineAngle ?? 0;
  if (worstSpine <= 15)      scores.spineIntegrity = 100;
  else if (worstSpine <= 25) scores.spineIntegrity = 70;
  else if (worstSpine <= 35) scores.spineIntegrity = 40;
  else {
    scores.spineIntegrity = 10;
    redFlags.push({ id: "spine_rounding", state: "DANGER", penaltyPoints: 35 });
  }

  // Bar Path Efficiency (20%)
  const wristDrift = d.wristXDriftPct ?? 0;
  scores.barPathEfficiency = Math.max(0, 100 - Math.max(0, wristDrift - 4) * 7.5);
  if (wristDrift > 10) redFlags.push({ id: "bar_drift", state: "WARNING", penaltyPoints: 20 });

  // Hip Hinge Pattern (20%)
  const setupHip  = d.setupHipAngle  ?? 90;
  const setupKnee = d.setupKneeAngle ?? 145;
  const lockHip   = d.lockoutHipAngle ?? 175;
  let hingeScore = 100;
  if (setupKnee < 120) {
    hingeScore -= 25;
    redFlags.push({ id: "hip_squat_pattern", state: "WARNING", penaltyPoints: 20 });
  }
  hingeScore -= Math.max(0, 170 - lockHip) * 3;
  scores.hipHingePattern = Math.max(0, hingeScore);

  // Start Position (15%)
  const startSpine    = d.startSpineAngle    ?? 15;
  const shoulderAhead = d.shouldersAheadOfBar ?? true;
  let startScore = 100;
  if (!shoulderAhead)  startScore -= 20;
  if (startSpine > 25) startScore -= 30;
  scores.startPosition = Math.max(0, startScore);
  if (startSpine > 25 || !shoulderAhead)
    redFlags.push({ id: "poor_start", state: "ACCEPTABLE", penaltyPoints: 10 });

  // Lockout Control (10%)
  const lockKnee = d.lockoutKneeAngle ?? 175;
  const lockHipA = d.lockoutHipAngle  ?? 175;
  let lockScore  = 100 - Math.max(0, 170 - lockHip) * 4 - Math.max(0, 170 - lockKnee) * 4;
  if (lockHipA > 185) { lockScore -= 15; redFlags.push({ id: "hyperextension", state: "DANGER", penaltyPoints: 20 }); }
  scores.lockoutControl = Math.max(0, lockScore);

  // Tempo / Tension (10%)
  const setupSec = d.setupTimeSec ?? 0.6;
  if (setupSec >= 0.5)      scores.tempoTension = 100;
  else if (setupSec < 0.2)  { scores.tempoTension = 40; redFlags.push({ id: "rushed_setup", state: "WARNING", penaltyPoints: 10 }); }
  else                      scores.tempoTension = Math.round(40 + ((setupSec - 0.2) / 0.3) * 60);

  return { scores, redFlags };
}

// ─── PUSH-UP ──────────────────────────────────────────────────────────────────

function calcPushupDimensions(d) {
  const scores = {};
  const redFlags = [];

  // Body Line (25%)
  const hipSag  = d.hipSagPct  ?? 0;
  const hipPike = d.hipPikePct ?? 0;
  let bodyScore = 100;
  if (hipSag > 5)  { bodyScore -= 30; redFlags.push({ id: "hip_sag", state: "DANGER", penaltyPoints: 30 }); }
  if (hipPike > 5) { bodyScore -= 15; }
  scores.bodyLine = Math.max(0, bodyScore);

  // Depth (20%)
  const elbow = d.bottomElbowAngle ?? 80;
  if (elbow >= 70 && elbow <= 90)   scores.depth = 100;
  else if (elbow >= 60 && elbow <= 100) scores.depth = 70;
  else { scores.depth = 40; redFlags.push({ id: "partial_range", state: "WARNING", penaltyPoints: 20 }); }

  // Elbow Path (15%)
  const elbowAngleFromTorso = d.elbowAngleFromTorso ?? 40;
  if (elbowAngleFromTorso >= 30 && elbowAngleFromTorso <= 50) scores.elbowPath = 100;
  else if (elbowAngleFromTorso > 70) {
    scores.elbowPath = Math.max(0, 100 - 25);
    redFlags.push({ id: "elbow_flare", state: "WARNING", penaltyPoints: 20 });
  } else if (elbowAngleFromTorso < 20) scores.elbowPath = 90;
  else scores.elbowPath = 80;

  // Scapular Control (20%)
  const spreadChange = d.shoulderSpreadChangePct ?? 5;
  scores.scapularControl = spreadChange > 15 ? Math.max(0, 100 - 30) : 100;
  if (spreadChange > 15) redFlags.push({ id: "scapular_winging", state: "WARNING", penaltyPoints: 20 });

  // Neck / Head Position (10%)
  const headDrop = d.headDropPct ?? 5;
  scores.neckPosition = headDrop > 15 ? Math.max(0, 100 - 20) : 100;
  if (headDrop > 15) redFlags.push({ id: "forward_head", state: "ACCEPTABLE", penaltyPoints: 10 });

  // Tempo Control (10%)
  const descent = d.descentDurationSec ?? 1.5;
  if (descent >= 1.2)     scores.tempoControl = 100;
  else if (descent < 0.6) { scores.tempoControl = 50; redFlags.push({ id: "rushed_tempo", state: "WARNING", penaltyPoints: 10 }); }
  else                    scores.tempoControl = Math.max(50, 100 - ((1.2 - descent) / 0.1) * 5);

  return { scores, redFlags };
}

// ─── Score Interpretation ─────────────────────────────────────────────────────

export function interpretScore(score) {
  if (score >= 95) return { label: "ELITE",       color: "#22C55E" };
  if (score >= 88) return { label: "STRONG",      color: "#4ADE80" };
  if (score >= 78) return { label: "GOOD",        color: "#EAB308" };
  if (score >= 65) return { label: "NEEDS WORK",  color: "#F97316" };
  return               { label: "MAJOR ISSUE", color: "#EF4444" };
}

// ─── Cue Library ─────────────────────────────────────────────────────────────

export const CUE_LIBRARY = {
  squat: {
    insufficient_depth: ["Sit deeper between the hips", "Reach full depth with control", "Finish the bottom position"],
    knee_valgus:        ["Drive knees out", "Keep knees over midfoot", "Own the foot-knee line"],
    spine_collapse:     ["Chest taller", "Brace and stay stacked", "Keep the torso organized"],
    hip_shift:          ["Stay centered through the hips", "Even pressure side to side", "Control the bottom evenly"],
    rushed_tempo:       ["Slow the descent", "Own the transition", "Smooth on the way down"],
    heel_lift:          ["Stay midfoot", "Root through the whole foot", "Keep the heel down"],
  },
  deadlift: {
    spine_rounding:    ["Brace before the pull", "Stay long through the spine", "Don't fold off the floor"],
    bar_drift:         ["Keep the bar close", "Drag the bar straight up", "Tighten the path"],
    hip_squat_pattern: ["Push hips back", "Hinge, don't squat it", "Load the hinge first"],
    poor_start:        ["Set the lats first", "Find tension before the pull", "Build the start"],
    soft_lockout:      ["Finish tall", "Squeeze to lockout", "Stand up cleanly"],
    rushed_setup:      ["Build tension first", "Stay tight off the floor", "Smooth through the pull"],
  },
  pushup: {
    hip_sag:          ["Stay in one line", "Squeeze glutes and abs", "Don't let the hips sag"],
    partial_range:    ["Lower fully", "Earn the bottom", "Reach full range"],
    elbow_flare:      ["Tuck elbows slightly", "Cleaner arm path", "Don't flare early"],
    scapular_winging: ["Push the floor away", "Own the shoulders", "Keep the shoulder blades organized"],
    forward_head:     ["Neutral neck", "Eyes slightly forward", "Don't crane the head"],
    rushed_tempo:     ["Slow the lowering", "Control the rep", "No bounce"],
  },
};

// ─── Single-Cue Priority Engine ───────────────────────────────────────────────

const CUE_LOCK_MS    = 20000;
const MIN_FREQUENCY  = 0.25;

const STATE_RANK = { OPTIMAL: 0, ACCEPTABLE: 1, WARNING: 2, DANGER: 3 };
const RISK_SEVERITY  = { DANGER: 1.0, WARNING: 0.6, ACCEPTABLE: 0.2 };

export function selectSingleCue(repHistory, exerciseId, cueState, nowMs) {
  if (nowMs < (cueState.lockedUntilMs ?? 0)) return cueState;

  const recentReps = repHistory.slice(-5);
  if (!recentReps.length) return cueState;

  const issueStats = buildIssueStats(recentReps);

  const scored = Object.entries(issueStats)
    .filter(([, s]) => s.frequency >= MIN_FREQUENCY)
    .map(([issueId, s]) => {
      const riskScore     = RISK_SEVERITY[s.worstState] ?? 0.2;
      const dimPenalty    = s.dimensionPenaltyContribution;
      const priorityScore = (s.frequency * 0.40) + (riskScore * 0.35) + (dimPenalty * 0.25);
      return { issueId, priorityScore };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);

  if (!scored.length) return cueState;

  const topIssue = scored[0].issueId;
  if (topIssue === cueState.lastIssue) return cueState;

  const cueOptions = CUE_LIBRARY[exerciseId]?.[topIssue] ?? [];
  if (!cueOptions.length) return cueState;
  const cueIndex = (cueState.cueRotationIndex ?? 0) % cueOptions.length;

  return {
    currentCue:       cueOptions[cueIndex],
    lockedUntilMs:    nowMs + CUE_LOCK_MS,
    lastIssue:        topIssue,
    cueRotationIndex: cueIndex + 1,
    priorityScore:    scored[0].priorityScore,
  };
}

// ─── Rep / Consistency / Stability Scoring ───────────────────────────────────

/**
 * Score a single rep from its dimension scores and red flags.
 * Returns { repScore, consistency, stability } (0–100 each).
 */
export function scoreRep(repData, exerciseId) {
  const { scores, redFlags } = calcDimensionScores(exerciseId, repData);
  const repScore = calcOverallScore(scores, exerciseId);

  // Consistency proxy: penalise missing dimensions
  const definedDims = Object.values(scores).filter(v => v != null);
  const consistency = definedDims.length
    ? Math.round(definedDims.reduce((a, b) => a + b, 0) / definedDims.length)
    : 0;

  // Stability proxy: inverse of total penalty from red flags
  const totalPenalty = redFlags.reduce((s, f) => s + (f.penaltyPoints ?? 10), 0);
  const stability = Math.max(0, 100 - totalPenalty);

  return { repScore, consistency, stability };
}

/**
 * Consistency score from an array of rep scores.
 * Low variance = high consistency.
 */
export function calculateConsistency(repScores) {
  if (!repScores || repScores.length < 2) return repScores?.[0] ?? 0;
  const mean = repScores.reduce((a, b) => a + b, 0) / repScores.length;
  const variance = repScores.reduce((s, v) => s + (v - mean) ** 2, 0) / repScores.length;
  const stdDev = Math.sqrt(variance);
  return Math.round(Math.max(0, 100 - stdDev * 2));
}

/**
 * Stability score from joint angle variance across frames.
 * jointVariance: { [jointKey]: number }  (variance value, lower is better)
 */
export function calculateStability(jointVariance) {
  const vals = Object.values(jointVariance ?? {});
  if (!vals.length) return 100;
  const avgVariance = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.round(Math.max(0, 100 - avgVariance * 3));
}

// ─── (internal) ──────────────────────────────────────────────────────────────
function buildIssueStats(recentReps) {
  const stats = {};
  recentReps.forEach((rep) => {
    (rep.redFlags ?? []).forEach((flag) => {
      if (!stats[flag.id]) stats[flag.id] = { count: 0, worstState: "ACCEPTABLE", totalPenalty: 0 };
      stats[flag.id].count++;
      if ((STATE_RANK[flag.state] ?? 0) > (STATE_RANK[stats[flag.id].worstState] ?? 0))
        stats[flag.id].worstState = flag.state;
      stats[flag.id].totalPenalty += flag.penaltyPoints ?? 10;
    });
  });
  const maxPenalty = Math.max(...Object.values(stats).map((s) => s.totalPenalty), 1);
  return Object.fromEntries(
    Object.entries(stats).map(([id, s]) => [
      id,
      {
        ...s,
        frequency: s.count / recentReps.length,
        dimensionPenaltyContribution: s.totalPenalty / maxPenalty,
      },
    ])
  );
}