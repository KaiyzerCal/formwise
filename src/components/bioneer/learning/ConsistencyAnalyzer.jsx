/**
 * ConsistencyAnalyzer.js
 * Analyzes rep-to-rep variation and stability patterns
 * Detects fatigue and form breakdown
 */

/**
 * Analyze consistency metrics from session
 * Returns consistency score (0-100) and specific issues
 */
export function analyzeConsistency(sessionMetrics) {
  if (!sessionMetrics?.allMetrics || sessionMetrics.allMetrics.length < 2) {
    return {
      consistencyScore: 100,
      unstableReps: [],
      issues: [],
      fatigueDetected: false,
    };
  }

  const reps = sessionMetrics.allMetrics;

  // Calculate angle deviations
  const angleDeviation = calculateAngleDeviation(reps);

  // Calculate tempo deviation
  const tempoDeviation = calculateTempoDeviation(reps);

  // Calculate stability deviation
  const stabilityDeviation = calculateStabilityDeviation(reps);

  // Identify unstable reps (outliers)
  const unstableReps = identifyUnstableReps(reps, angleDeviation);

  // Detect fatigue pattern
  const fatigueDetected = detectFatiguePattern(reps);

  // Calculate overall consistency score
  const consistencyScore = calculateConsistencyScore(
    angleDeviation,
    tempoDeviation,
    stabilityDeviation,
    fatigueDetected
  );

  // Generate issue flags
  const issues = [];
  if (angleDeviation > 15) issues.push('high_angle_variance');
  if (tempoDeviation > 20) issues.push('inconsistent_tempo');
  if (stabilityDeviation > 0.2) issues.push('stability_breakdown');
  if (fatigueDetected) issues.push('fatigue_detected');
  if (unstableReps.length > reps.length * 0.3) issues.push('multiple_failed_reps');

  return {
    consistencyScore,
    unstableReps,
    issues,
    fatigueDetected,
    metrics: {
      angleDeviation: angleDeviation.toFixed(1),
      tempoDeviation: tempoDeviation.toFixed(1),
      stabilityDeviation: stabilityDeviation.toFixed(2),
    },
  };
}

/**
 * Calculate angle variance across reps (degrees)
 */
function calculateAngleDeviation(reps) {
  const angles = reps
    .map(r => (r.kneeAngleMin + r.kneeAngleMax) / 2)
    .filter(a => a > 0);

  if (angles.length === 0) return 0;

  const avg = angles.reduce((a, b) => a + b, 0) / angles.length;
  const variance = angles.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / angles.length;

  return Math.sqrt(variance);
}

/**
 * Calculate tempo variance across reps (%)
 */
function calculateTempoDeviation(reps) {
  const tempos = reps.map(r => r.repDuration).filter(d => d > 0);

  if (tempos.length === 0) return 0;

  const avg = tempos.reduce((a, b) => a + b, 0) / tempos.length;
  const deviations = tempos.map(t => Math.abs((t - avg) / avg) * 100);

  return deviations.reduce((a, b) => a + b, 0) / deviations.length;
}

/**
 * Calculate stability variance across reps (0-1)
 */
function calculateStabilityDeviation(reps) {
  const stabilities = reps.map(r => 1 - r.stabilityVariance);

  if (stabilities.length === 0) return 0;

  const avg = stabilities.reduce((a, b) => a + b, 0) / stabilities.length;
  const variance = stabilities.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / stabilities.length;

  return Math.sqrt(variance);
}

/**
 * Identify reps that deviate significantly from baseline
 */
function identifyUnstableReps(reps, angleDeviation) {
  if (angleDeviation === 0) return [];

  const angles = reps.map((r, idx) => ({
    idx,
    angle: (r.kneeAngleMin + r.kneeAngleMax) / 2,
  }));

  const avgAngle = angles.reduce((sum, a) => sum + a.angle, 0) / angles.length;
  const threshold = angleDeviation * 1.5; // 1.5σ

  return angles
    .filter(a => Math.abs(a.angle - avgAngle) > threshold)
    .map(a => a.idx + 1); // 1-indexed
}

/**
 * Detect fatigue pattern
 * True if last 3 reps show speed + depth reduction
 */
function detectFatiguePattern(reps) {
  if (reps.length < 6) return false;

  const first3 = reps.slice(0, 3);
  const last3 = reps.slice(-3);

  // Speed comparison
  const firstAvgSpeed = first3.reduce((sum, r) => sum + r.repDuration, 0) / 3;
  const lastAvgSpeed = last3.reduce((sum, r) => sum + r.repDuration, 0) / 3;
  const speedDrop = lastAvgSpeed / firstAvgSpeed;

  // Depth comparison
  const firstAvgDepth = first3.reduce((sum, r) => sum + r.kneeAngleMin, 0) / 3;
  const lastAvgDepth = last3.reduce((sum, r) => sum + r.kneeAngleMin, 0) / 3;
  const depthReduction = 1 - lastAvgDepth / firstAvgDepth;

  // Stability comparison
  const firstAvgStability = first3.reduce((sum, r) => sum + (1 - r.stabilityVariance), 0) / 3;
  const lastAvgStability = last3.reduce((sum, r) => sum + (1 - r.stabilityVariance), 0) / 3;
  const stabilityDrop = 1 - lastAvgStability / firstAvgStability;

  // Fatigue if: speed slowed by 25%+ AND depth reduced by 10%+ AND stability dropped
  return speedDrop > 1.25 && depthReduction > 0.1 && stabilityDrop > 0.05;
}

/**
 * Calculate overall consistency score (0-100)
 */
function calculateConsistencyScore(angleDeviation, tempoDeviation, stabilityDeviation, fatigueDetected) {
  let score = 100;

  // Penalize angle variance
  if (angleDeviation > 15) score -= Math.min(20, angleDeviation * 0.8);
  else if (angleDeviation > 8) score -= angleDeviation * 0.6;

  // Penalize tempo variance
  if (tempoDeviation > 20) score -= Math.min(15, tempoDeviation * 0.4);
  else if (tempoDeviation > 10) score -= tempoDeviation * 0.3;

  // Penalize stability variance
  if (stabilityDeviation > 0.2) score -= Math.min(20, stabilityDeviation * 50);

  // Heavy penalty for fatigue
  if (fatigueDetected) score -= 15;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get consistency rating (text label)
 */
export function getConsistencyRating(score) {
  if (score >= 90) return { label: 'EXCELLENT', severity: 'excellent', color: '#22C55E' };
  if (score >= 75) return { label: 'GOOD', severity: 'good', color: '#EAB308' };
  if (score >= 60) return { label: 'FAIR', severity: 'fair', color: '#F97316' };
  return { label: 'POOR', severity: 'poor', color: '#EF4444' };
}

export default {
  analyzeConsistency,
  getConsistencyRating,
};