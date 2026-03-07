/**
 * PoseNormalizer
 * Maps MediaPipe 33-landmark array → named joint dictionary
 * Adds derived midpoints: neck, chest, pelvis
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
 * @param {Array} landmarks  — MediaPipe poseLandmarks array (33 items)
 * @returns {{ joints: Object, visibility: Object }}
 */
export function normalizeLandmarks(landmarks) {
  if (!landmarks || landmarks.length === 0) return { joints: {}, visibility: {} };

  const joints     = {};
  const visibility = {};

  for (const [idx, name] of Object.entries(MEDIAPIPE_MAP)) {
    const lm = landmarks[Number(idx)];
    if (!lm) continue;
    joints[name]     = { x: lm.x, y: lm.y };
    visibility[name] = lm.visibility ?? 0;
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
  }

  if (joints.l_hip && joints.r_hip) {
    joints.pelvis = {
      x: (joints.l_hip.x + joints.r_hip.x) / 2,
      y: (joints.l_hip.y + joints.r_hip.y) / 2,
    };
    visibility.pelvis = Math.min(visibility.l_hip, visibility.r_hip);
  }

  return { joints, visibility };
}

/** Average visibility score across all available joints */
export function avgVisibility(visibility) {
  const vals = Object.values(visibility);
  if (!vals.length) return 0;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}