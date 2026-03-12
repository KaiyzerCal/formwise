/**
 * UserMovementModel.js
 * Builds personalized baseline profiles from historical movement data
 * Uses weighted averaging to maintain up-to-date user norms
 */

import { getMovementMetrics } from './SessionLearningEngine';

/**
 * Calculate movement baseline from historical data
 * Weighted toward recent sessions (last 20 reps get 100% weight, older get less)
 */
export async function calculateMovementBaseline(movement) {
  const metrics = await getMovementMetrics(movement, 100);

  if (metrics.length === 0) {
    return null;
  }

  // Weight recent reps higher (exponential decay)
  const weighted = metrics.map((metric, index) => {
    const recencyFactor = 1 - (index / metrics.length) * 0.5; // 100% → 50% weight
    return { ...metric, weight: recencyFactor };
  });

  const formScores = weighted.map(m => m.formScore * m.weight);
  const kneeDepths = weighted.map(m => m.kneeAngleMin * m.weight);
  const hipDepths = weighted.map(m => m.hipAngleMin * m.weight);
  const tempos = weighted.map(m => m.repDuration * m.weight);
  const stabilities = weighted.map(m => (1 - m.stabilityVariance) * m.weight);
  const totalWeight = weighted.reduce((sum, m) => sum + m.weight, 0);

  // Aggregate fault frequencies
  const faultCounts = {};
  metrics.forEach(m => {
    m.faultsDetected?.forEach(fault => {
      faultCounts[fault] = (faultCounts[fault] || 0) + 1;
    });
  });
  const commonFault = Object.keys(faultCounts).length > 0
    ? Object.entries(faultCounts).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  return {
    movement,
    sessionCount: metrics.length,
    avgFormScore: Math.round(formScores.reduce((a, b) => a + b, 0) / totalWeight),
    avgKneeDepth: Math.round(kneeDepths.reduce((a, b) => a + b, 0) / totalWeight),
    avgHipDepth: Math.round(hipDepths.reduce((a, b) => a + b, 0) / totalWeight),
    avgTempo: parseFloat((tempos.reduce((a, b) => a + b, 0) / totalWeight).toFixed(2)),
    stabilityScore: parseFloat((stabilities.reduce((a, b) => a + b, 0) / totalWeight).toFixed(2)),
    commonFault,
    faultFrequency: commonFault ? (faultCounts[commonFault] / metrics.length * 100).toFixed(1) : 0,
    lastUpdated: Date.now(),
  };
}

/**
 * Compare current session against baseline
 * Returns delta (improvement/degradation) metrics
 */
export async function compareToBaseline(movement, sessionMetrics) {
  const baseline = await calculateMovementBaseline(movement);

  if (!baseline) {
    return { isNewMovement: true };
  }

  const currentAvgScore = sessionMetrics.avgFormScore;
  const scoreDelta = currentAvgScore - baseline.avgFormScore;
  const scoreImprovement = scoreDelta > 0;

  const currentDepth = sessionMetrics.avgROMDepth || 0;
  const depthDelta = currentDepth - baseline.avgKneeDepth;

  const currentTempo = parseFloat(sessionMetrics.avgRepDuration);
  const tempoDelta = currentTempo - baseline.avgTempo;

  return {
    baseline,
    currentScore: currentAvgScore,
    scoreDelta,
    scoreImprovement,
    depthDelta,
    tempoDelta,
    consistency: calculateConsistencyMetric(sessionMetrics),
  };
}

/**
 * Helper: calculate consistency within a session
 */
function calculateConsistencyMetric(sessionMetrics) {
  if (!sessionMetrics.allMetrics || sessionMetrics.allMetrics.length === 0) {
    return 0.5;
  }

  const scores = sessionMetrics.allMetrics.map(m => m.formScore);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / avgScore; // Coefficient of variation

  return Math.max(0, Math.min(1, 1 - cv)); // Clamp 0-1
}

/**
 * Get all cached baselines
 */
export async function getAllBaselines() {
  const baselines = {};
  const movements = ['squat', 'deadlift', 'benchpress', 'pushup', 'pullup', 'lunge'];

  for (const movement of movements) {
    const baseline = await calculateMovementBaseline(movement);
    if (baseline) {
      baselines[movement] = baseline;
    }
  }

  return baselines;
}

export default {
  calculateMovementBaseline,
  compareToBaseline,
  getAllBaselines,
};