/**
 * PhaseClassifier — maps RepDetector state machine states → display phase id
 *
 * RepDetector states: START | ECCENTRIC | BOTTOM | CONCENTRIC | LOCKOUT
 *
 * Each movement profile defines its phase names per state in `phaseMap`.
 * PhaseClassifier reads that map directly — no hardcoded fallback lists.
 */

export class PhaseClassifier {
  constructor(profile) {
    this.profile   = profile;
    this.lastPhase = null;
    this.repStartMs = null;
  }

  setRepStart(tMs) {
    this.repStartMs = tMs;
  }

  classify(smoothedJoints, tMs, repState) {
    const phaseId = this._map(repState);
    if (phaseId !== this.lastPhase) {
      this.lastPhase = phaseId;
    }
    return phaseId ? { id: phaseId } : null;
  }

  _map(repState) {
    // Use profile's phaseMap if defined (preferred)
    if (this.profile.phaseMap && this.profile.phaseMap[repState]) {
      return this.profile.phaseMap[repState];
    }

    // Generic fallback for movements without a phaseMap
    const phases = this.profile.phases ?? [];
    const fallback = {
      START:       phases[0] ?? null,
      ECCENTRIC:   phases[1] ?? phases[0] ?? null,
      BOTTOM:      phases[2] ?? phases[1] ?? null,
      CONCENTRIC:  phases[3] ?? phases[2] ?? null,
      LOCKOUT:     phases[4] ?? phases[0] ?? null,
      // Legacy states (RepDetector previously used these)
      DESCENT:     phases[1] ?? phases[0] ?? null,
      ASCENT:      phases[3] ?? phases[2] ?? null,
    };
    return fallback[repState] ?? phases[0] ?? null;
  }

  reset() {
    this.lastPhase  = null;
    this.repStartMs = null;
  }
}