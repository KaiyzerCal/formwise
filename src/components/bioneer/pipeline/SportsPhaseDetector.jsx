/**
 * SportsPhaseDetector — presence-based phase detection for sports movements
 * 
 * Uses the primary joint angle from each movement's first joint definition to determine phase.
 * Lower 30% of acceptable range → first phase
 * Middle 40% → second phase
 * Upper 30% → final phase
 */

export class SportsPhaseDetector {
  constructor(movementDef) {
    this.phases = (movementDef?.phases || []).filter(p => typeof p === 'string');
    this.primaryJoint = movementDef?.joints?.[0] || null;
    this.currentPhase = null;
  }

  /**
   * @param {number} primaryAngle — the current angle for the primary joint
   * @returns {string|null} — the detected phase name
   */
  detect(primaryAngle) {
    if (!this.primaryJoint || this.phases.length < 2 || primaryAngle == null) {
      return this.currentPhase;
    }

    const acceptable = this.primaryJoint.acceptable;
    if (!acceptable || acceptable.length < 2) return this.currentPhase;

    const [low, high] = acceptable;
    const range = high - low;
    if (range <= 0) return this.currentPhase;

    // Normalize angle to 0-1 within acceptable range
    const normalized = Math.max(0, Math.min(1, (primaryAngle - low) / range));

    let phaseIdx;
    if (normalized < 0.3) {
      phaseIdx = 0; // first phase
    } else if (normalized < 0.7) {
      phaseIdx = Math.min(1, this.phases.length - 2); // middle phase
    } else {
      phaseIdx = this.phases.length - 1; // last phase
    }

    // For movements with more than 3 phases, map proportionally
    if (this.phases.length > 3) {
      phaseIdx = Math.min(
        this.phases.length - 1,
        Math.floor(normalized * this.phases.length)
      );
    }

    this.currentPhase = this.phases[phaseIdx] || null;
    return this.currentPhase;
  }

  getCurrentPhase() {
    return this.currentPhase;
  }

  reset() {
    this.currentPhase = null;
  }
}