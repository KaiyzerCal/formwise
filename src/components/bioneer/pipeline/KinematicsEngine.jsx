/**
 * KinematicsEngine
 * Computes joint angles, smoothed velocities, and asymmetry
 * from stabilized (smoothed) joint positions.
 * RepDetector and FaultDetector ONLY read from this output — never raw.
 */

import { calcAngle } from '../poseEngine';

const VEL_ALPHA = 0.40;

export class KinematicsEngine {
  constructor() {
    this.prevSmoothed = {};
    this.prevVelocity = {};
  }

  compute(smoothedJoints, stabilizedVelocities) {
    // Use velocities already computed by StabilizationEngine (filter 5)
    // but re-smooth here as a second pass for kinematics consumers
    const velocities = stabilizedVelocities ?? {};

    const j = smoothedJoints;
    const angles = {};

    if (j.l_hip && j.l_knee && j.l_ankle)
      angles.kneeL    = calcAngle(j.l_hip,      j.l_knee,   j.l_ankle);
    if (j.r_hip && j.r_knee && j.r_ankle)
      angles.kneeR    = calcAngle(j.r_hip,      j.r_knee,   j.r_ankle);
    if (j.l_shoulder && j.l_hip && j.l_knee)
      angles.hipL     = calcAngle(j.l_shoulder, j.l_hip,    j.l_knee);
    if (j.r_shoulder && j.r_hip && j.r_knee)
      angles.hipR     = calcAngle(j.r_shoulder, j.r_hip,    j.r_knee);
    if (j.l_shoulder && j.l_elbow && j.l_wrist)
      angles.elbowL   = calcAngle(j.l_shoulder, j.l_elbow,  j.l_wrist);
    if (j.r_shoulder && j.r_elbow && j.r_wrist)
      angles.elbowR   = calcAngle(j.r_shoulder, j.r_elbow,  j.r_wrist);
    if (j.neck && j.chest && j.pelvis)
      angles.trunkFwd = calcAngle(j.neck,        j.chest,    j.pelvis);
    if (j.l_shoulder && j.r_shoulder && j.l_hip && j.r_hip)
      angles.trunkLat = this._trunkLateralAngle(j);

    // Knee asymmetry (%)
    const asymmetry = {};
    if (angles.kneeL != null && angles.kneeR != null) {
      const avg = (angles.kneeL + angles.kneeR) / 2;
      asymmetry.knee = avg > 0 ? Math.abs(angles.kneeL - angles.kneeR) / avg * 100 : 0;
    }

    return { velocities, angles, asymmetry };
  }

  _trunkLateralAngle(j) {
    const shoulderMidX = (j.l_shoulder.x + j.r_shoulder.x) / 2;
    const hipMidX      = (j.l_hip.x      + j.r_hip.x)      / 2;
    return Math.atan2(shoulderMidX - hipMidX, 0.2) * (180 / Math.PI);
  }

  reset() {
    this.prevSmoothed = {};
    this.prevVelocity = {};
  }
}