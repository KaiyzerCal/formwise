/**
 * ConfidenceEngine — 4-factor gating
 * A cue only surfaces when the combined confidence score >= 0.72
 */

export class ConfidenceEngine {
  constructor() {
    this.GATE_THRESHOLD = 0.72;
  }

  score({ poseConfidence, trackingStability, phaseConfidence, faultPersistence }) {
    // Clamp all inputs to [0,1] to avoid NaN from bad inputs
    const p = Math.min(1, Math.max(0, poseConfidence    ?? 0.5));
    const t = Math.min(1, Math.max(0, trackingStability ?? 0));
    const ph= Math.min(1, Math.max(0, phaseConfidence   ?? 0.5));
    const f = Math.min(1, Math.max(0, faultPersistence  ?? 0));

    // Weighted exponent product — any very-low factor collapses the score
    return (
      Math.pow(p,  0.35) *
      Math.pow(t,  0.25) *
      Math.pow(ph, 0.20) *
      Math.pow(f,  0.20)
    );
  }

  shouldSurface(factors) {
    return this.score(factors) >= this.GATE_THRESHOLD;
  }

  /** Maps persistence duration (ms) → 0–1 */
  persistenceScore(persistMs) {
    return Math.min(persistMs / 800, 1.0);
  }

  /** Maps angle distance from expected range → 0–1 */
  phaseConfidenceScore(currentAngle, expectedRange) {
    if (currentAngle == null || !expectedRange) return 0.6;
    const { min, max } = expectedRange;
    if (currentAngle >= min && currentAngle <= max) return 1.0;
    const dist = Math.min(Math.abs(currentAngle - min), Math.abs(currentAngle - max));
    return Math.max(0, 1 - dist / 30);
  }

  /** trackingStability from lock state */
  stabilityFromLockState(lockState) {
    if (lockState === 'LOCKED')   return 1.0;
    if (lockState === 'DEGRADED') return 0.5;
    return 0.0;
  }
}