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

  /**
   * Classify current phase.
   * @param {object} smoothedJoints
   * @param {number} tMs
   * @param {object|string} repStateOrAngles — accepts angles object (new) or legacy state string
   */
  classify(smoothedJoints, tMs, repStateOrAngles) {
    // Support both new (angles object) and legacy (state string) callers
    const repState = typeof repStateOrAngles === 'string'
      ? repStateOrAngles
      : this._lastRepState ?? 'START';

    // Store for backward compat
    this._lastRepState = repState;

    const phaseId = this._map(repState);
    if (phaseId !== this.lastPhase) {
      this.lastPhase = phaseId;
    }
    return phaseId ? { id: phaseId } : null;
  }

  /** Update internal state directly from RepDetector (for hybrid usage) */
  updateRepState(state) {
    this._lastRepState = state;
  }

  _map(repState) {
    if (this.profile.phaseMap && this.profile.phaseMap[repState]) {
      return this.profile.phaseMap[repState];
    }

    const phases = this.profile.phases ?? [];
    const fallback = {
      START:       phases[0] ?? null,
      ECCENTRIC:   phases[1] ?? phases[0] ?? null,
      BOTTOM:      phases[2] ?? phases[1] ?? null,
      CONCENTRIC:  phases[3] ?? phases[2] ?? null,
      LOCKOUT:     phases[4] ?? phases[0] ?? null,
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