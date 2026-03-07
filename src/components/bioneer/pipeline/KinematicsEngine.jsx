/**
 * KinematicsEngine
 * Computes joint angles from BlazePose GHUM 3D world landmarks when available,
 * falling back to 2D smoothed image coordinates.
 * 3D world coords (metric, in meters) give rotation-invariant angles — no perspective distortion.
 */

// 3D angle between three points A-B-C (B is the vertex)
function calcAngle3D(A, B, C) {
  const ax = A.x - B.x, ay = A.y - B.y, az = (A.z ?? 0) - (B.z ?? 0);
  const cx = C.x - B.x, cy = C.y - B.y, cz = (C.z ?? 0) - (B.z ?? 0);
  const dot  = ax*cx + ay*cy + az*cz;
  const magA = Math.sqrt(ax*ax + ay*ay + az*az);
  const magC = Math.sqrt(cx*cx + cy*cy + cz*cz);
  if (magA === 0 || magC === 0) return null;
  return Math.acos(Math.min(1, Math.max(-1, dot / (magA * magC)))) * (180 / Math.PI);
}

// 2D fallback (import from poseEngine)
import { calcAngle } from '../poseEngine';

export class KinematicsEngine {
  constructor() {
    this.prevSmoothed = {};
    this.prevVelocity = {};
  }

  /**
   * @param {Object} smoothedJoints     — 2D stabilized joints (always present)
   * @param {Object} stabilizedVelocities — from StabilizationEngine filter 5
   * @param {Object} [worldJoints]      — 3D GHUM world joints (optional, metric meters)
   */
  compute(smoothedJoints, stabilizedVelocities, worldJoints) {
    const velocities = stabilizedVelocities ?? {};
    const j  = smoothedJoints;
    const w  = worldJoints ?? {};   // 3D world — use when both endpoints available
    const angles = {};

    // Helper: use 3D if available, else 2D
    const angle = (nameA, nameB, nameC) => {
      if (w[nameA] && w[nameB] && w[nameC])
        return calcAngle3D(w[nameA], w[nameB], w[nameC]);
      if (j[nameA] && j[nameB] && j[nameC])
        return calcAngle(j[nameA], j[nameB], j[nameC]);
      return null;
    };

    angles.kneeL    = angle('l_hip',      'l_knee',   'l_ankle');
    angles.kneeR    = angle('r_hip',      'r_knee',   'r_ankle');
    angles.hipL     = angle('l_shoulder', 'l_hip',    'l_knee');
    angles.hipR     = angle('r_shoulder', 'r_hip',    'r_knee');
    angles.elbowL   = angle('l_shoulder', 'l_elbow',  'l_wrist');
    angles.elbowR   = angle('r_shoulder', 'r_elbow',  'r_wrist');
    angles.trunkFwd = angle('neck',       'chest',    'pelvis');

    // Lateral trunk: use 3D if available
    if (w.l_shoulder && w.r_shoulder && w.l_hip && w.r_hip) {
      const shoulderMidX = (w.l_shoulder.x + w.r_shoulder.x) / 2;
      const hipMidX      = (w.l_hip.x      + w.r_hip.x)      / 2;
      const shoulderMidY = (w.l_shoulder.y + w.r_shoulder.y) / 2;
      const hipMidY      = (w.l_hip.y      + w.r_hip.y)      / 2;
      angles.trunkLat = Math.atan2(shoulderMidX - hipMidX, Math.abs(shoulderMidY - hipMidY)) * (180 / Math.PI);
    } else if (j.l_shoulder && j.r_shoulder && j.l_hip && j.r_hip) {
      const shoulderMidX = (j.l_shoulder.x + j.r_shoulder.x) / 2;
      const hipMidX      = (j.l_hip.x      + j.r_hip.x)      / 2;
      angles.trunkLat = Math.atan2(shoulderMidX - hipMidX, 0.2) * (180 / Math.PI);
    }

    // Knee asymmetry (%)
    const asymmetry = {};
    if (angles.kneeL != null && angles.kneeR != null) {
      const avg = (angles.kneeL + angles.kneeR) / 2;
      asymmetry.knee = avg > 0 ? Math.abs(angles.kneeL - angles.kneeR) / avg * 100 : 0;
    }

    // Filter out nulls
    for (const k of Object.keys(angles)) {
      if (angles[k] == null) delete angles[k];
    }

    return { velocities, angles, asymmetry };
  }

  reset() {
    this.prevSmoothed = {};
    this.prevVelocity = {};
  }
}