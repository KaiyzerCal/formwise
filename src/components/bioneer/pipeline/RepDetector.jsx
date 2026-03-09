/**
 * RepDetector — angle-velocity state machine
 *
 * States: START → ECCENTRIC → BOTTOM → CONCENTRIC → LOCKOUT → (next rep)
 *
 * Uses:
 *  - Primary joint angle + EMA-smoothed angle velocity
 *  - Secondary joint confirmation (multi-joint)
 *  - COM vertical motion as secondary signal
 *  - Frame-buffer stability (3 consecutive frames)
 *  - ROM validation (> 40° required to count rep)
 *  - Visibility gating
 */

const STATES = ['START', 'ECCENTRIC', 'BOTTOM', 'CONCENTRIC', 'LOCKOUT'];
const CONFIRM_FRAMES = 3;       // consecutive frames required for transition
const VISIBILITY_THRESHOLD = 0.7;
const ANGLE_VEL_EMA = 0.3;     // for angle velocity smoothing
const VEL_DESCEND  = -2;       // °/frame threshold
const VEL_ASCEND   =  2;       // °/frame threshold
const VEL_PAUSE    =  0.5;     // °/frame — "still"
const MIN_ROM      = 40;       // degrees
const STATE_TIMEOUT_MS = 8000;

export class RepDetector {
  constructor(profile) {
    this.profile = profile;

    // State machine
    this.state        = 'START';
    this.stateAt      = null;
    this.confirmCount = 0;
    this.pendingState = null;

    // Rep tracking
    this.repCount      = 0;
    this.repStartMs    = null;
    this.eccentricMs   = null;
    this.concentricMs  = null;
    this.bottomMs      = null;
    this.phaseTimeline = [];
    this.bottomDetected  = false;
    this.lockoutDetected = false;

    // Angle tracking for ROM + velocity
    this.prevAngle     = null;
    this.angleVelSmooth = 0;
    this.minAngle      = Infinity;
    this.maxAngle      = -Infinity;
  }

  /**
   * @param {Object} smoothedJoints      — 2D joints from StabilizationEngine
   * @param {Object} smoothedVelocities  — 2D velocities (existing pipeline)
   * @param {Object} angles              — from KinematicsEngine
   * @param {number} tMs                 — timestamp ms
   * @param {Object} [visibility]        — joint visibility scores
   */
  evaluate(smoothedJoints, smoothedVelocities, angles, tMs, visibility = {}) {
    const cfg = this.profile;

    // ── Visibility gate ────────────────────────────────────────────────────
    if (cfg.visibilityJoints) {
      const lowConf = cfg.visibilityJoints.some(j => (visibility[j] ?? 1) < VISIBILITY_THRESHOLD);
      if (lowConf) return null;
    }

    // ── Primary angle + velocity ───────────────────────────────────────────
    const primaryAngle = angles[cfg.primaryAngleKey] ?? null;
    if (primaryAngle == null) return null;

    const rawVel = this.prevAngle != null ? primaryAngle - this.prevAngle : 0;
    this.angleVelSmooth = ANGLE_VEL_EMA * rawVel + (1 - ANGLE_VEL_EMA) * this.angleVelSmooth;
    const av = this.angleVelSmooth;
    this.prevAngle = primaryAngle;

    // Track range
    if (primaryAngle < this.minAngle) this.minAngle = primaryAngle;
    if (primaryAngle > this.maxAngle) this.maxAngle = primaryAngle;

    // ── Secondary joint confirmation ───────────────────────────────────────
    const secAngle = cfg.secondaryAngleKey ? (angles[cfg.secondaryAngleKey] ?? null) : null;
    const secVel   = cfg.secondaryAngleKey ? this._getSecVel(secAngle) : null;

    // ── COM signal ─────────────────────────────────────────────────────────
    const comDir = this._comDirection(smoothedJoints);

    // ── State age / timeout ────────────────────────────────────────────────
    const age = this.stateAt != null ? tMs - this.stateAt : Infinity;

    // ── Determine candidate next state ────────────────────────────────────
    let candidate = null;

    switch (this.state) {
      case 'START':
        // Eccentric: primary descending
        if (this._descending(av) && (comDir === 'down' || comDir === null))
          candidate = 'ECCENTRIC';
        break;

      case 'ECCENTRIC':
        // Bottom: paused AND angle at minimum (hip near minimum)
        if (this._paused(av) && secAngle == null || this._paused(av))
          candidate = 'BOTTOM';
        // Timeout
        if (age > STATE_TIMEOUT_MS) { this._reset(); return null; }
        break;

      case 'BOTTOM':
        // Concentric: primary ascending + secondary confirmation
        if (this._ascending(av) && (secVel == null || secVel > 0) && (comDir === 'up' || comDir === null))
          candidate = 'CONCENTRIC';
        if (age > STATE_TIMEOUT_MS) { this._reset(); return null; }
        break;

      case 'CONCENTRIC':
        // Lockout: angle above threshold AND paused
        if (primaryAngle >= cfg.lockoutAngle && this._paused(av))
          candidate = 'LOCKOUT';
        if (age > STATE_TIMEOUT_MS) { this._reset(); return null; }
        break;

      case 'LOCKOUT':
        // Next rep begins when descending again
        if (this._descending(av) && (comDir === 'down' || comDir === null))
          candidate = 'ECCENTRIC';
        break;
    }

    // ── Frame-buffer confirmation ──────────────────────────────────────────
    if (candidate && candidate === this.pendingState) {
      this.confirmCount++;
    } else {
      this.pendingState = candidate;
      this.confirmCount = candidate ? 1 : 0;
    }

    if (this.confirmCount < CONFIRM_FRAMES) return null;

    // Transition confirmed
    this.confirmCount = 0;
    this.pendingState = null;

    return this._transition(candidate, tMs, primaryAngle);
  }

  _transition(newState, tMs, angle) {
    const prev = this.state;
    this.state   = newState;
    this.stateAt = tMs;
    this.phaseTimeline.push({ state: newState, tMs });

    let event = null;

    switch (newState) {
      case 'ECCENTRIC':
        if (prev === 'START' || prev === 'LOCKOUT') {
          this.repStartMs   = tMs;
          this.eccentricMs  = tMs;
          this.minAngle     = this.prevAngle ?? Infinity;
          this.maxAngle     = this.prevAngle ?? -Infinity;
          this.bottomDetected  = false;
          this.lockoutDetected = false;
          event = { type: 'PHASE_ECCENTRIC', tMs };
        }
        break;

      case 'BOTTOM':
        this.bottomDetected = true;
        this.bottomMs = tMs;
        event = { type: 'PHASE_BOTTOM', tMs, angle };
        break;

      case 'CONCENTRIC':
        this.concentricMs = tMs;
        event = { type: 'PHASE_CONCENTRIC', tMs };
        break;

      case 'LOCKOUT':
        this.lockoutDetected = true;
        // Validate and count rep/event
        const rom = this.maxAngle - this.minAngle;
        const dur = tMs - (this.repStartMs ?? tMs);
        const valid = this.bottomDetected && rom >= MIN_ROM && dur >= (this.profile.minRepMs ?? 800);

        if (valid) {
          this.repCount++;
          // Use EVENT_COMPLETE for event-type movements, REP_COMPLETE for rep-type
          const isEvent = this.profile.movementType === 'event' ||
            this.profile.repValidationMode === 'event_cycle' ||
            this.profile.repValidationMode === 'peak_detect';
          event = {
            type:           isEvent ? 'EVENT_COMPLETE' : 'REP_COMPLETE',
            repNumber:      this.repCount,
            tMs,
            rangeOfMotion:  Math.round(rom),
            eccentricTime:  this.bottomMs && this.eccentricMs ? this.bottomMs - this.eccentricMs : null,
            concentricTime: tMs && this.concentricMs ? tMs - this.concentricMs : null,
            pauseTime:      this.concentricMs && this.bottomMs ? this.concentricMs - this.bottomMs : null,
            durationMs:     dur,
            phaseTimeline:  [...this.phaseTimeline],
            repScore:       this._scoreRep(rom, dur),
          };
        }
        this.phaseTimeline = [];
        break;
    }

    return event;
  }

  _scoreRep(rom, durationMs) {
    // Simple heuristic: good ROM + controlled tempo = higher score
    const romScore   = Math.min(1, (rom - MIN_ROM) / 60) * 60;        // 0–60
    const tempoScore = durationMs > 1500 && durationMs < 6000 ? 25 : 10; // 25 for controlled
    return Math.round(Math.max(0, Math.min(100, romScore + tempoScore + 15)));
  }

  // Secondary joint velocity tracking
  _prevSecAngle = null;
  _getSecVel(angle) {
    if (angle == null) return null;
    const v = this._prevSecAngle != null ? angle - this._prevSecAngle : 0;
    this._prevSecAngle = angle;
    return v;
  }

  // COM vertical direction from smoothed joints
  _comY = null;
  _comDirection(joints) {
    const pts = ['l_shoulder', 'r_shoulder', 'l_hip', 'r_hip', 'l_knee', 'r_knee']
      .map(k => joints[k]?.y).filter(v => v != null);
    if (pts.length < 4) return null;
    const comY = pts.reduce((a, b) => a + b, 0) / pts.length;
    const dir = this._comY != null ? (comY > this._comY ? 'down' : comY < this._comY ? 'up' : 'still') : null;
    this._comY = comY;
    return dir;
  }

  _descending(av) { return av < VEL_DESCEND; }
  _ascending(av)  { return av > VEL_ASCEND; }
  _paused(av)     { return Math.abs(av) < VEL_PAUSE; }

  _reset() {
    this.state        = 'START';
    this.stateAt      = null;
    this.confirmCount = 0;
    this.pendingState = null;
    this.phaseTimeline = [];
  }

  getState()    { return this.state; }
  getRepCount() { return this.repCount; }

  reset() {
    this._reset();
    this.repCount      = 0;
    this.repStartMs    = null;
    this.eccentricMs   = null;
    this.concentricMs  = null;
    this.bottomMs      = null;
    this.prevAngle     = null;
    this.angleVelSmooth = 0;
    this.minAngle      = Infinity;
    this.maxAngle      = -Infinity;
    this._prevSecAngle = null;
    this._comY         = null;
  }
}