// Layer 2 helper: Normalize MediaPipe landmark array → named joint map

const MEDIAPIPE_MAP = {
  '0':  'head',
  '11': 'l_shoulder', '12': 'r_shoulder',
  '13': 'l_elbow',    '14': 'r_elbow',
  '15': 'l_wrist',    '16': 'r_wrist',
  '23': 'l_hip',      '24': 'r_hip',
  '25': 'l_knee',     '26': 'r_knee',
  '27': 'l_ankle',    '28': 'r_ankle',
  '31': 'l_toe',      '32': 'r_toe',
};

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/**
 * Converts MediaPipe poseLandmarks array → { joints, visibility }
 * joints: { [jointId]: {x, y} }
 * visibility: { [jointId]: 0-1 }
 */
export function normalizeLandmarks(poseLandmarks) {
  if (!poseLandmarks) return { joints: {}, visibility: {} };

  const joints = {};
  const visibility = {};

  poseLandmarks.forEach((lm, i) => {
    const id = MEDIAPIPE_MAP[String(i)];
    if (!id) return;
    joints[id]     = { x: lm.x, y: lm.y };
    visibility[id] = lm.visibility ?? 1;
  });

  // Derived midpoint joints
  if (joints.l_shoulder && joints.r_shoulder) {
    joints.chest       = mid(joints.l_shoulder, joints.r_shoulder);
    visibility.chest   = Math.min(visibility.l_shoulder ?? 1, visibility.r_shoulder ?? 1);
  }
  if (joints.l_hip && joints.r_hip) {
    joints.pelvis      = mid(joints.l_hip, joints.r_hip);
    visibility.pelvis  = Math.min(visibility.l_hip ?? 1, visibility.r_hip ?? 1);
  }
  if (joints.head && joints.chest) {
    joints.neck        = mid(joints.head, joints.chest);
    visibility.neck    = Math.min(visibility.head ?? 1, visibility.chest ?? 1);
  }

  return { joints, visibility };
}

/** Overall frame confidence = mean landmark visibility */
export function frameConfidence(poseLandmarks) {
  if (!poseLandmarks || poseLandmarks.length === 0) return 0;
  const sum = poseLandmarks.reduce((s, lm) => s + (lm.visibility ?? 1), 0);
  return sum / poseLandmarks.length;
}