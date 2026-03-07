/**
 * PoseNormalizer
 * Maps MediaPipe 33-landmark array → named joint dictionary
 * Adds derived midpoints: neck, chest, pelvis
 * Supports both 2D (normalized image) and 3D (world/GHUM metric) landmarks.
 */

// MediaPipe landmark index → joint name
export const MEDIAPIPE_MAP = {
  0:  'nose',
  11: 'l_shoulder',
  12: 'r_shoulder',
  13: 'l_elbow',
  14: 'r_elbow',
  15: 'l_wrist',
  16: 'r_wrist',
  23: 'l_hip',
  24: 'r_hip',
  25: 'l_knee',
  26: 'r_knee',
  27: 'l_ankle',
  28: 'r_ankle',
  31: 'l_toe',
  32: 'r_toe',
};

/**
 * @param {Array} landmarks       — MediaPipe poseLandmarks array (33 items, normalized image coords)
 * @param {Array} [worldLandmarks] — Optional BlazePose GHUM world landmarks (metric 3D x,y,z in meters)
 * @returns {{ joints: Object, visibility: Object, world: Object }}
 */
export function normalizeLandmarks(landmarks, worldLandmarks) {
  if (!landmarks || landmarks.length === 0) return { joints: {}, visibility: {}, world: {} };

  const joints     = {};
  const visibility = {};
  const world      = {};  // 3D world coords (meters, GHUM) keyed by joint name

  for (const [idx, name] of Object.entries(MEDIAPIPE_MAP)) {
    const i  = Number(idx);
    const lm = landmarks[i];
    if (!lm) continue;
    joints[name]     = { x: lm.x, y: lm.y };
    visibility[name] = lm.visibility ?? 0;

    // World landmarks: metric 3D from BlazePose GHUM
    const wlm = worldLandmarks?.[i];
    if (wlm) {
      world[name] = { x: wlm.x, y: wlm.y, z: wlm.z };
    }
  }

  // ── Derived midpoints ────────────────────────────────
  if (joints.l_shoulder && joints.r_shoulder) {
    joints.neck = {
      x: (joints.l_shoulder.x + joints.r_shoulder.x) / 2,
      y: Math.min(joints.l_shoulder.y, joints.r_shoulder.y) - 0.04,
    };
    joints.chest = {
      x: (joints.l_shoulder.x + joints.r_shoulder.x) / 2,
      y: (joints.l_shoulder.y + joints.r_shoulder.y) / 2,
    };
    visibility.neck  = Math.min(visibility.l_shoulder, visibility.r_shoulder);
    visibility.chest = Math.min(visibility.l_shoulder, visibility.r_shoulder);

    if (world.l_shoulder && world.r_shoulder) {
      world.neck  = { x: (world.l_shoulder.x + world.r_shoulder.x) / 2, y: (world.l_shoulder.y + world.r_shoulder.y) / 2 - 0.1, z: (world.l_shoulder.z + world.r_shoulder.z) / 2 };
      world.chest = { x: (world.l_shoulder.x + world.r_shoulder.x) / 2, y: (world.l_shoulder.y + world.r_shoulder.y) / 2, z: (world.l_shoulder.z + world.r_shoulder.z) / 2 };
    }
  }

  if (joints.l_hip && joints.r_hip) {
    joints.pelvis = {
      x: (joints.l_hip.x + joints.r_hip.x) / 2,
      y: (joints.l_hip.y + joints.r_hip.y) / 2,
    };
    visibility.pelvis = Math.min(visibility.l_hip, visibility.r_hip);

    if (world.l_hip && world.r_hip) {
      world.pelvis = { x: (world.l_hip.x + world.r_hip.x) / 2, y: (world.l_hip.y + world.r_hip.y) / 2, z: (world.l_hip.z + world.r_hip.z) / 2 };
    }
  }

  return { joints, visibility, world };
}

/** Average visibility score across all available joints */
export function avgVisibility(visibility) {
  const vals = Object.values(visibility);
  if (!vals.length) return 0;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}