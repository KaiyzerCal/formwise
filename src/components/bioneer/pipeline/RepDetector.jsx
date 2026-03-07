/**
 * RepDetector — profile-driven rep state machine
 * Reads SMOOTHED velocities from KinematicsEngine/StabilizationEngine.
 * NEVER reads raw coordinate deltas.
 */

export class RepDetector {
  constructor(profile) {
    this.profile        = profile;
    this.state          = 'LOCKOUT';
    this.repCount       = 0;
    this.repStart       = null;
    this.stateEnteredAt = null;
    this.MIN_STATE_MS   = 150;
  }

  /** smoothedVelocities and angles come from KinematicsEngine — never raw */
  evaluate(smoothedJoints, smoothedVelocities, angles, tMs) {
    const velJoint = this.profile.repVelJoint;
    const velY     = smoothedVelocities[velJoint]?.y ?? 0;
    const angle    = angles[this.profile.angleKey] ?? null;
    const stateAge = this.stateEnteredAt != null ? tMs - this.stateEnteredAt : Infinity;

    let event = null;

    switch (this.state) {
      case 'LOCKOUT':
        if (velY > this.profile.thresholds.descentVel && stateAge > this.MIN_STATE_MS) {
          this._transition('DESCENT', tMs);
          this.repStart = tMs;
          event = { type: 'PHASE_DESCENT', tMs };
        }
        break;

      case 'DESCENT':
        if (angle != null && angle <= this.profile.thresholds.bottomAngle && stateAge > this.MIN_STATE_MS) {
          this._transition('BOTTOM', tMs);
          event = { type: 'PHASE_BOTTOM', tMs, angle };
        }
        // Safety fallback — if we've been descending too long, reset
        if (stateAge > 8000) {
          this._transition('LOCKOUT', tMs);
        }
        break;

      case 'BOTTOM':
        if (velY < -this.profile.thresholds.ascentVel && stateAge > this.MIN_STATE_MS) {
          this._transition('ASCENT', tMs);
          event = { type: 'PHASE_ASCENT', tMs };
        }
        break;

      case 'ASCENT':
        if (angle != null &&
            angle >= this.profile.thresholds.lockoutAngle &&
            this.repStart != null &&
            tMs - this.repStart >= this.profile.minRepMs) {
          this._transition('LOCKOUT', tMs);
          this.repCount++;
          event = {
            type:       'REP_COMPLETE',
            tMs,
            repNumber:  this.repCount,
            durationMs: tMs - this.repStart,
          };
        }
        // Safety fallback
        if (stateAge > 8000) {
          this._transition('LOCKOUT', tMs);
        }
        break;
    }

    return event;
  }

  _transition(newState, tMs) {
    this.state          = newState;
    this.stateEnteredAt = tMs;
  }

  getState()    { return this.state; }
  getRepCount() { return this.repCount; }

  reset() {
    this.state          = 'LOCKOUT';
    this.repCount       = 0;
    this.repStart       = null;
    this.stateEnteredAt = null;
  }
}