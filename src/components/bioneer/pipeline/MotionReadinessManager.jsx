/**
 * MotionReadinessManager — PATCHED v2
 *
 * Full readiness gate: confidence + visibility + frame stability.
 * Frames that fail ANY check are rejected before kinematics.
 *
 * Three distinct gates:
 *   1. passesConfidence()  — pose score >= threshold
 *   2. hasRequiredJoints() — required joints visible
 *   3. isFrameStable()     — per-joint displacement within threshold
 *
 * passesReadiness() = all three must pass for N consecutive frames.
 */

const LOCK_STATES = { SEARCHING:'SEARCHING', LOCKED:'LOCKED', DEGRADED:'DEGRADED', LOST:'LOST' };

const DEFAULTS = {
  POSE_MIN:          0.55,
  JOINT_VIS_MIN:     0.50,
  READY_FRAMES:      3,
  INSTABILITY_THRESH: 0.08,  // max per-joint displacement (normalized 0–1) per frame
  INSTABILITY_JOINTS: ['l_hip','r_hip','l_shoulder','r_shoulder'],
};

const DEFAULT_REQUIRED = ['l_hip','r_hip','l_knee','r_knee','l_shoulder','r_shoulder'];

export class MotionReadinessManager {
  constructor(requiredJoints = DEFAULT_REQUIRED, opts = {}) {
    this._required   = requiredJoints;
    this._cfg        = { ...DEFAULTS, ...opts };
    this._passStreak = 0;
    this._prevJoints = null;  // last accepted joint positions for stability diff
    this.isReady     = false;
    this.readinessScore = 0;
  }

  /**
   * Main entry point. Call once per frame BEFORE kinematics.
   * @param {number} poseConf    — avg visibility score [0,1]
   * @param {object} visibility  — { jointName: score }
   * @param {string} lockState   — SubjectLockEngine state
   * @param {object} [rawJoints] — normalized joints for stability check
   * @returns {boolean}
   */
  check(poseConf, visibility = {}, lockState = 'SEARCHING', rawJoints = null) {
    if (lockState === LOCK_STATES.LOST) { this._fail(); return false; }
    if (!this.passesConfidence(poseConf))         { this._fail(); return false; }
    if (!this.hasRequiredJoints(visibility))       { this._fail(); return false; }
    if (rawJoints && !this.isFrameStable(rawJoints)) { this._fail(); return false; }

    this._passStreak++;
    if (rawJoints) this._prevJoints = rawJoints;
    this.readinessScore = Math.min(1, this._passStreak / this._cfg.READY_FRAMES);
    this.isReady        = this._passStreak >= this._cfg.READY_FRAMES;
    return this.isReady;
  }

  /** Gate 1: overall pose confidence */
  passesConfidence(poseConf) {
    return poseConf >= this._cfg.POSE_MIN;
  }

  /** Gate 2: required joints all visible */
  hasRequiredJoints(visibility = {}) {
    return !this._required.some(j => (visibility[j] ?? 0) < this._cfg.JOINT_VIS_MIN);
  }

  /**
   * Gate 3: frame-to-frame stability.
   * Rejects frames where key joints moved too far since the last accepted frame.
   */
  isFrameStable(rawJoints) {
    if (!this._prevJoints) return true; // first frame — always pass
    const joints = this._cfg.INSTABILITY_JOINTS;
    for (const j of joints) {
      const cur  = rawJoints[j];
      const prev = this._prevJoints[j];
      if (!cur || !prev) continue;
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > this._cfg.INSTABILITY_THRESH) return false;
    }
    return true;
  }

  /** Combined readiness check (for external query without side-effects) */
  passesReadiness(poseConf, visibility, lockState, rawJoints) {
    if (lockState === LOCK_STATES.LOST)       return false;
    if (!this.passesConfidence(poseConf))     return false;
    if (!this.hasRequiredJoints(visibility))  return false;
    if (rawJoints && !this.isFrameStable(rawJoints)) return false;
    return true;
  }

  _fail() {
    this._passStreak    = Math.max(0, this._passStreak - 1);
    this.readinessScore = this._passStreak / this._cfg.READY_FRAMES;
    this.isReady        = false;
  }

  reset() {
    this._passStreak = 0;
    this.readinessScore = 0;
    this.isReady     = false;
    this._prevJoints = null;
  }
}