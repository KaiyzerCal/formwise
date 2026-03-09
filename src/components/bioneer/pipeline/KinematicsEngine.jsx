/**
 * KinematicsEngine
 * - Limits GHUM 33-joint output to 17 biomechanical joints
 * - Applies EMA temporal smoothing on Z to suppress jitter
 * - Computes hip hinge, knee valgus, and torso lean from 3D world coords
 * - Falls back to 2D when world coords unavailable
 */

import { calcAngle } from '../poseEngine';

// The 17 biomechanical joints we care about (subset of GHUM's 33)
const BIO_JOINTS = new Set([
  'nose', 'l_shoulder', 'r_shoulder',
  'l_elbow', 'r_elbow', 'l_wrist', 'r_wrist',
  'l_hip', 'r_hip', 'l_knee', 'r_knee',
  'l_ankle', 'r_ankle', 'l_heel', 'r_heel',
  // derived (added by PoseNormalizer)
  'neck', 'chest', 'pelvis',
]);

const EMA_ALPHA = 0.35; // higher = more responsive, lower = smoother Z

// 3D angle A-B-C (B is vertex), returns degrees or null
function angle3D(A, B, C) {
  const ax = A.x - B.x, ay = A.y - B.y, az = A.z - B.z;
  const cx = C.x - B.x, cy = C.y - B.y, cz = C.z - B.z;
  const dot  = ax*cx + ay*cy + az*cz;
  const magA = Math.sqrt(ax*ax + ay*ay + az*az);
  const magC = Math.sqrt(cx*cx + cy*cy + cz*cz);
  if (magA === 0 || magC === 0) return null;
  return Math.acos(Math.min(1, Math.max(-1, dot / (magA * magC)))) * (180 / Math.PI);
}

export class KinematicsEngine {
  constructor() {
    this._zSmooth = {}; // EMA state per joint name for Z axis
  }

  /** Apply EMA smoothing to the Z coordinate of world joints */
  _smoothWorld(worldJoints) {
    const out = {};
    for (const name of Object.keys(worldJoints)) {
      if (!BIO_JOINTS.has(name)) continue; // drop non-biomechanical joints
      const raw = worldJoints[name];
      const prevZ = this._zSmooth[name] ?? raw.z;
      const smoothZ = prevZ + EMA_ALPHA * (raw.z - prevZ);
      this._zSmooth[name] = smoothZ;
      out[name] = { x: raw.x, y: raw.y, z: smoothZ };
    }
    return out;
  }

  /**
   * @param {Object} smoothedJoints       — 2D stabilized joints
   * @param {Object} stabilizedVelocities — from StabilizationEngine
   * @param {Object} [worldJoints]        — 3D GHUM world joints (metric meters)
   */
  compute(smoothedJoints, stabilizedVelocities, worldJoints) {
    const velocities = stabilizedVelocities ?? {};
    const j = smoothedJoints;
    const w = worldJoints ? this._smoothWorld(worldJoints) : {};

    // Helper: 3D if available, else 2D fallback
    const angle = (a, b, c) => {
      if (w[a] && w[b] && w[c]) return angle3D(w[a], w[b], w[c]);
      if (j[a] && j[b] && j[c]) return calcAngle(j[a], j[b], j[c]);
      return null;
    };

    const angles = {};

    // ── Hip hinge: shoulder → hip → knee (sagittal plane flexion)
    angles.hipHingeL = angle('l_shoulder', 'l_hip', 'l_knee');
    angles.hipHingeR = angle('r_shoulder', 'r_hip', 'r_knee');

    // ── Knee valgus/varus: hip → knee → ankle (frontal plane)
    angles.kneeL = angle('l_hip', 'l_knee', 'l_ankle');
    angles.kneeR = angle('r_hip', 'r_knee', 'r_ankle');

    // ── Torso lean: shoulder midpoint vs hip midpoint vs vertical axis
    if (w.l_shoulder && w.r_shoulder && w.l_hip && w.r_hip) {
      const sX = (w.l_shoulder.x + w.r_shoulder.x) / 2;
      const sY = (w.l_shoulder.y + w.r_shoulder.y) / 2;
      const hX = (w.l_hip.x + w.r_hip.x) / 2;
      const hY = (w.l_hip.y + w.r_hip.y) / 2;
      // Angle between torso vector and vertical (0,1,0)
      const tX = sX - hX, tY = sY - hY;
      angles.torsoLean = Math.atan2(Math.abs(tX), Math.abs(tY)) * (180 / Math.PI);
    } else if (j.l_shoulder && j.r_shoulder && j.l_hip && j.r_hip) {
      const sX = (j.l_shoulder.x + j.r_shoulder.x) / 2;
      const hX = (j.l_hip.x + j.r_hip.x) / 2;
      angles.torsoLean = Math.atan2(Math.abs(sX - hX), 0.2) * (180 / Math.PI);
    }

    // ── Elbow angles (accessory — useful for press/row detection)
    angles.elbowL = angle('l_shoulder', 'l_elbow', 'l_wrist');
    angles.elbowR = angle('r_shoulder', 'r_elbow', 'r_wrist');

    // ── Ankle dorsiflexion: knee → ankle → toe (approximated via heel)
    angles.ankleDorsiL = angle('l_knee', 'l_ankle', 'l_heel');
    angles.ankleDorsiR = angle('r_knee', 'r_ankle', 'r_heel');

    // ── Hip / shoulder / trunk rotation (frontal plane X-offset ratios)
    if (w.l_hip && w.r_hip && w.l_shoulder && w.r_shoulder) {
      angles.hipRotation      = Math.atan2(w.l_hip.z      - w.r_hip.z,      w.r_hip.x      - w.l_hip.x)      * (180 / Math.PI);
      angles.shoulderRotation = Math.atan2(w.l_shoulder.z - w.r_shoulder.z, w.r_shoulder.x - w.l_shoulder.x) * (180 / Math.PI);
      angles.trunkRotation    = angles.shoulderRotation - angles.hipRotation;
    }

    // ── Centre of mass (simple mid-point of hips, normalized Y)
    const comJoints = {};
    if (j.l_hip && j.r_hip) {
      comJoints.centerOfMassX = (j.l_hip.x + j.r_hip.x) / 2;
      comJoints.centerOfMassY = (j.l_hip.y + j.r_hip.y) / 2;
    }
    if (j.pelvis) {
      comJoints.pelvisDriftX = j.pelvis.x - 0.5; // 0.5 = frame centre
      comJoints.pelvisDriftY = j.pelvis.y;
    }

    // ── Stride / arm-swing (locomotion metrics)
    const locomotion = {};
    if (j.l_ankle && j.r_ankle) {
      locomotion.strideLength = Math.abs(j.l_ankle.x - j.r_ankle.x);
    }
    if (j.l_wrist && j.r_wrist) {
      const lSwing = velocities.l_wrist?.x ?? 0;
      const rSwing = velocities.r_wrist?.x ?? 0;
      const swingAvg = (Math.abs(lSwing) + Math.abs(rSwing)) / 2;
      locomotion.armSwingSymmetry = swingAvg > 0
        ? 1 - Math.abs(Math.abs(lSwing) - Math.abs(rSwing)) / swingAvg
        : 1;
    }

    // ── Knee asymmetry
    const asymmetry = {};
    if (angles.kneeL != null && angles.kneeR != null) {
      const avg = (angles.kneeL + angles.kneeR) / 2;
      asymmetry.knee = avg > 0 ? Math.abs(angles.kneeL - angles.kneeR) / avg * 100 : 0;
    }

    // Strip nulls
    for (const k of Object.keys(angles)) {
      if (angles[k] == null) delete angles[k];
    }

    return { velocities, angles: { ...angles, ...comJoints, ...locomotion }, asymmetry };
  }

  reset() {
    this._zSmooth = {};
  }
}