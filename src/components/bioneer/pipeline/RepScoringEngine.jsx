/**
 * RepScoringEngine — computes a 0-100 rep quality score.
 *
 * Inputs:
 *   kinematics  — angles + asymmetry from KinematicsEngine
 *   phaseData   — { phaseId: { frames, scores[] } }
 *   faults      — confirmed fault objects from FaultDetector
 *   confidence  — pose confidence 0-1
 *   profile     — MovementProfile (for confidenceWeights + thresholds)
 *
 * Score breakdown (default weights from profile.confidenceWeights):
 *   ROM quality       40%
 *   Tempo stability   20%
 *   Joint symmetry    20%
 *   Tracking conf.    10%
 *   Fault penalty    -10% per HIGH, -5% MODERATE, -2% LOW (capped at -45)
 */

export class RepScoringEngine {
  /**
   * @param {Object} kinematics  — { angles, asymmetry }
   * @param {Object} phaseData   — per-phase frame + score accumulator
   * @param {Array}  faults      — confirmed fault objects
   * @param {number} confidence  — 0-1
   * @param {Object} profile     — MovementProfile
   */
  score({ kinematics, phaseData = {}, faults = [], confidence = 1, profile = {} }) {
    const w = profile.confidenceWeights ?? {
      rom: 0.4, stability: 0.2, symmetry: 0.2, tempo: 0.1,
    };

    // ── ROM quality ───────────────────────────────────────────────────────────
    const romScore = this._romScore(kinematics, profile);

    // ── Tempo stability (inter-phase frame variance) ───────────────────────
    const tempoScore = this._tempoScore(phaseData);

    // ── Symmetry ──────────────────────────────────────────────────────────────
    const symScore = this._symmetryScore(kinematics);

    // ── Weighted base ─────────────────────────────────────────────────────────
    const base = (
      romScore   * (w.rom      ?? 0.4) +
      tempoScore * (w.stability ?? 0.2) +
      symScore   * (w.symmetry  ?? 0.2) +
      confidence * 100 * (w.tempo ?? 0.1)
    ) / ((w.rom ?? 0.4) + (w.stability ?? 0.2) + (w.symmetry ?? 0.2) + (w.tempo ?? 0.1));

    // ── Fault penalties ───────────────────────────────────────────────────────
    let penalty = 0;
    for (const f of faults) {
      const sev = (f.severity ?? '').toUpperCase();
      if (sev === 'HIGH'     || sev === 'CRITICAL') penalty += 10;
      else if (sev === 'MODERATE')                   penalty += 5;
      else                                           penalty += 2;
    }
    penalty = Math.min(penalty, 45);

    return Math.round(Math.max(0, Math.min(100, base - penalty)));
  }

  _romScore(kinematics, profile) {
    const angles = kinematics?.angles ?? {};
    const thresh = profile?.thresholds ?? {};
    const primary = angles[profile?.primaryAngleKey];
    if (primary == null) return 70; // no data → neutral

    // Lower angle from lockout = better depth (for hinge/knee dominant)
    if (thresh.bottomAngle != null && thresh.lockoutAngle != null) {
      const range = thresh.lockoutAngle - thresh.bottomAngle;
      const achieved = thresh.lockoutAngle - primary;
      return Math.min(100, Math.max(0, (achieved / range) * 100));
    }
    return 70;
  }

  _tempoScore(phaseData) {
    const frameCounts = Object.values(phaseData).map(p => p.frames ?? 0);
    if (frameCounts.length < 2) return 80;
    const mean = frameCounts.reduce((a, b) => a + b, 0) / frameCounts.length;
    if (mean === 0) return 80;
    const variance = frameCounts.reduce((s, v) => s + (v - mean) ** 2, 0) / frameCounts.length;
    const cv = Math.sqrt(variance) / mean; // coefficient of variation
    return Math.max(0, Math.min(100, (1 - cv) * 100));
  }

  _symmetryScore(kinematics) {
    const asym = kinematics?.asymmetry?.knee ?? null;
    if (asym == null) return 85;
    return Math.max(0, Math.min(100, 100 - asym * 2));
  }
}