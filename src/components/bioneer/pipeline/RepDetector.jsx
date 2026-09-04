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
 *  - Bottom angle hit: primary angle must reach profile.bottomAngle threshold
 *  - ROM completeness: achieved ROM vs theoretical max for the exercise
 *  - Visibility gating
 */

const STATES = ['START', 'ECCENTRIC', 'BOTTOM', 'CONCENTRIC', 'LOCKOUT'];
const CONFIRM_FRAMES = 3;
const VISIBILITY_THRESHOLD = 0.7;
const ANGLE_VEL_EMA = 0.3;
const VEL_DESCEND  = -2;
const VEL_ASCEND   =  2;
const VEL_PAUSE    =  0.5;
const MIN_ROM      = 40;
const STATE_TIMEOUT_MS = 8000;

export class RepDetector {
  constructor(profile) {
    this.profile = profile;

    this.state        = 'START';
    this.stateAt      = null;
    this.confirmCount = 0;
    this.pendingState = null;

    this.repCount      = 0;
    this.repStartMs    = null;
    this.eccentricMs   = null;
    this.concentricMs  = null;
    this.bottomMs      = null;
    this.phaseTimeline = [];
    this.bottomDetected  = false;
    this.lockoutDetected = false;
    // Track whether the exercise-specific depth and extension thresholds were met
    this.bottomAngleHit    = false;  // primary angle ≤ profile's bottomAngle target
    this.lockoutAngleHit   = false;  // primary angle ≥ profile's lockoutAngle (enforced by state transition)
    this.positionDepthHit  = false;  // hip crease at/below top of knee (competition depth standard)

    this.prevAngle      = null;
    this.angleVelSmooth = 0;
    this.minAngle       = Infinity;
    this.maxAngle       = -Infinity;
  }

  evaluate(smoothedJoints, smoothedVelocities, angles, tMs, visibility = {}) {
    const cfg = this.profile;

    if (cfg.visibilityJoints) {
      const lowConf = cfg.visibilityJoints.some(j => (visibility[j] ?? 1) < VISIBILITY_THRESHOLD);
      if (lowConf) return null;
    }

    const primaryAngle = angles[cfg.primaryAngleKey] ?? null;
    if (primaryAngle == null) return null;

    const rawVel = this.prevAngle != null ? primaryAngle - this.prevAngle : 0;
    this.angleVelSmooth = ANGLE_VEL_EMA * rawVel + (1 - ANGLE_VEL_EMA) * this.angleVelSmooth;
    const av = this.angleVelSmooth;
    this.prevAngle = primaryAngle;

    if (primaryAngle < this.minAngle) this.minAngle = primaryAngle;
    if (primaryAngle > this.maxAngle) this.maxAngle = primaryAngle;

    // Check whether the target bottom angle was actually reached this rep
    // bottomAngle lives at cfg.thresholds.bottomAngle or cfg.bottomAngle
    const targetBottom = cfg.thresholds?.bottomAngle ?? cfg.bottomAngle ?? null;
    if (targetBottom != null && primaryAngle <= targetBottom) {
      this.bottomAngleHit = true;
    }

    // Competition depth standard (position-based, not angle) — currently only
    // used by profiles that set depthStandard (e.g. squat's hip-below-knee rule).
    if (cfg.depthStandard === 'hip_below_knee') {
      const delta = angles.hipKneeDeltaM ?? angles.hipKneeDeltaNorm ?? null;
      if (delta != null && delta >= 0) this.positionDepthHit = true;
    }

    const secAngle = cfg.secondaryAngleKey ? (angles[cfg.secondaryAngleKey] ?? null) : null;
    const secVel   = cfg.secondaryAngleKey ? this._getSecVel(secAngle) : null;
    const comDir   = this._comDirection(smoothedJoints);
    const age      = this.stateAt != null ? tMs - this.stateAt : Infinity;

    let candidate = null;

    switch (this.state) {
      case 'START':
        if (this._descending(av) && (comDir === 'down' || comDir === null))
          candidate = 'ECCENTRIC';
        break;

      case 'ECCENTRIC':
        if (this._paused(av) && secAngle == null || this._paused(av))
          candidate = 'BOTTOM';
        if (age > STATE_TIMEOUT_MS) { this._reset(); return null; }
        break;

      case 'BOTTOM':
        if (this._ascending(av) && (secVel == null || secVel > 0) && (comDir === 'up' || comDir === null))
          candidate = 'CONCENTRIC';
        if (age > STATE_TIMEOUT_MS) { this._reset(); return null; }
        break;

      case 'CONCENTRIC':
        if (primaryAngle >= cfg.lockoutAngle && this._paused(av))
          candidate = 'LOCKOUT';
        if (age > STATE_TIMEOUT_MS) { this._reset(); return null; }
        break;

      case 'LOCKOUT':
        if (this._descending(av) && (comDir === 'down' || comDir === null))
          candidate = 'ECCENTRIC';
        break;
    }

    if (candidate && candidate === this.pendingState) {
      this.confirmCount++;
    } else {
      this.pendingState = candidate;
      this.confirmCount = candidate ? 1 : 0;
    }

    if (this.confirmCount < CONFIRM_FRAMES) return null;

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
          this.repStartMs      = tMs;
          this.eccentricMs     = tMs;
          this.minAngle        = this.prevAngle ?? Infinity;
          this.maxAngle        = this.prevAngle ?? -Infinity;
          this.bottomDetected  = false;
          this.lockoutDetected = false;
          this.bottomAngleHit  = false;
          this.lockoutAngleHit = false;
          this.positionDepthHit = false;
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

      case 'LOCKOUT': {
        this.lockoutDetected = true;
        this.lockoutAngleHit = true; // state machine enforces angle >= lockoutAngle to reach here

        const rom = this.maxAngle - this.minAngle;
        const dur = tMs - (this.repStartMs ?? tMs);

        // Rep is valid only if: bottom phase was entered AND bottom depth threshold was met.
        // Competition-rules profiles with an explicit depthStandard use the stricter
        // position-based check; everything else keeps the original angle-threshold check.
        const targetBottom = this.profile.thresholds?.bottomAngle ?? this.profile.bottomAngle ?? null;
        const angleDepthAchieved = targetBottom == null ? true : this.bottomAngleHit;
        const depthAchieved = this.profile.depthStandard ? this.positionDepthHit : angleDepthAchieved;
        const valid = this.bottomDetected && depthAchieved && rom >= MIN_ROM
                   && dur >= (this.profile.minRepMs ?? 800);

        // Meet-standard verdict — only computed for profiles flagged competitionRules.
        // Reuses the same depth/lockout checks above; adds a pause-duration check
        // (e.g. bench press "press command" pause) from the already-tracked bottom→
        // concentric timing.
        let meetStandard = null;
        let noLiftReasons = null;
        if (this.profile.competitionRules) {
          noLiftReasons = [];
          if (!depthAchieved) noLiftReasons.push('insufficient_depth');
          const minPauseMs = this.profile.thresholds?.minPauseMs ?? 0;
          if (minPauseMs > 0) {
            const pauseMs = this.concentricMs && this.bottomMs ? this.concentricMs - this.bottomMs : null;
            if (pauseMs == null || pauseMs < minPauseMs) noLiftReasons.push('no_pause');
          }
          meetStandard = noLiftReasons.length === 0;
        }

        // ROM completeness: how much of the theoretical full ROM was achieved (0–1)
        const lockoutAngle = this.profile.lockoutAngle ?? 170;
        const bottomAngle  = targetBottom ?? (lockoutAngle - 100);
        const theoreticalROM = lockoutAngle - bottomAngle;
        const romCompleteness = theoreticalROM > 0
          ? Math.min(1, Math.max(0, rom / theoreticalROM))
          : null;

        const eccentricTimeMs = this.bottomMs && this.eccentricMs
          ? this.bottomMs - this.eccentricMs
          : null;

        if (valid) {
          this.repCount++;
          const isEvent = this.profile.movementType === 'event'
            || this.profile.repValidationMode === 'event_cycle'
            || this.profile.repValidationMode === 'peak_detect';

          event = {
            type:              isEvent ? 'EVENT_COMPLETE' : 'REP_COMPLETE',
            repNumber:         this.repCount,
            tMs,
            rangeOfMotion:     Math.round(rom),
            romCompleteness,          // 0–1: fraction of theoretical full ROM achieved
            bottomAngleHit:    this.bottomAngleHit,
            lockoutAngleHit:   this.lockoutAngleHit,
            eccentricTime:     eccentricTimeMs,
            concentricTime:    tMs && this.concentricMs ? tMs - this.concentricMs : null,
            pauseTime:         this.concentricMs && this.bottomMs
                                 ? this.concentricMs - this.bottomMs : null,
            durationMs:        dur,
            phaseTimeline:     [...this.phaseTimeline],
            repScore:          this._scoreRep(rom, dur, eccentricTimeMs, romCompleteness),
            meetStandard,      // true/false for competitionRules profiles, else null
            noLiftReasons,     // e.g. ['insufficient_depth','no_pause'], else null
          };
        }
        this.phaseTimeline = [];
        break;
      }
    }

    return event;
  }

  _scoreRep(rom, durationMs, eccentricMs, romCompleteness) {
    // ROM quality (0–60): prefer completeness metric when available
    const romFraction = romCompleteness != null
      ? romCompleteness
      : Math.min(1, (rom - MIN_ROM) / 60);
    const romScore = romFraction * 60;

    // Eccentric tempo (0–25): reward a controlled descent (1.5–4 s)
    let tempoScore = 10;
    if (durationMs > 1500 && durationMs < 6000) tempoScore = 20;
    if (eccentricMs != null) {
      if (eccentricMs >= 1500 && eccentricMs <= 4000) tempoScore = Math.min(25, tempoScore + 5);
      else if (eccentricMs < 600)                     tempoScore = Math.max(5,  tempoScore - 10);
    }

    return Math.round(Math.max(0, Math.min(100, romScore + tempoScore + 15)));
  }

  _prevSecAngle = null;
  _getSecVel(angle) {
    if (angle == null) return null;
    const v = this._prevSecAngle != null ? angle - this._prevSecAngle : 0;
    this._prevSecAngle = angle;
    return v;
  }

  _comY = null;
  _comDirection(joints) {
    const pts = ['l_shoulder','r_shoulder','l_hip','r_hip','l_knee','r_knee']
      .map(k => joints[k]?.y).filter(v => v != null);
    if (pts.length < 4) return null;
    const comY = pts.reduce((a, b) => a + b, 0) / pts.length;
    const dir = this._comY != null
      ? (comY > this._comY ? 'down' : comY < this._comY ? 'up' : 'still')
      : null;
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
    this.repCount        = 0;
    this.repStartMs      = null;
    this.eccentricMs     = null;
    this.concentricMs    = null;
    this.bottomMs        = null;
    this.prevAngle       = null;
    this.angleVelSmooth  = 0;
    this.minAngle        = Infinity;
    this.maxAngle        = -Infinity;
    this.bottomDetected   = false;
    this.lockoutDetected  = false;
    this.bottomAngleHit   = false;
    this.lockoutAngleHit  = false;
    this.positionDepthHit = false;
    this._prevSecAngle    = null;
    this._comY            = null;
  }
}
