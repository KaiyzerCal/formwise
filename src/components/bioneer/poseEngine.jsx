// Pose detection engine using MediaPipe Pose via CDN
// Handles landmark detection, smoothing, and angle calculation

const CONFIDENCE_THRESHOLD = 0.65;
const EMA_ALPHA = 0.4;

// Skeleton connections for rendering
export const SKELETON_CONNECTIONS = [
  [11, 12], // shoulders
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [11, 23], [12, 24], // torso
  [23, 24], // hips
  [23, 25], [25, 27], // left leg
  [24, 26], [26, 28], // right leg
];

export function calcAngle(A, B, C) {
  const r = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
  let a = Math.abs(r * (180 / Math.PI));
  return a > 180 ? Math.round(360 - a) : Math.round(a);
}

export function calcSpineLean(landmarks) {
  // Calculate lean of torso from vertical
  const shoulderMidX = (landmarks[11].x + landmarks[12].x) / 2;
  const shoulderMidY = (landmarks[11].y + landmarks[12].y) / 2;
  const hipMidX = (landmarks[23].x + landmarks[24].x) / 2;
  const hipMidY = (landmarks[23].y + landmarks[24].y) / 2;

  const dx = shoulderMidX - hipMidX;
  const dy = shoulderMidY - hipMidY;
  // Angle from vertical (vertical = straight up = 0 degrees)
  const angleFromVertical = Math.abs(Math.atan2(dx, -dy) * (180 / Math.PI));
  return Math.round(angleFromVertical);
}

export function evaluateState(angle, joint, phase) {
  const { danger } = joint;

  // Danger always wins regardless of phase
  if (danger.below !== null && angle < danger.below) return "DANGER";
  if (danger.above !== null && angle > danger.above) return "DANGER";

  // Use phase-specific optimal range if available
  const optimal = (phase && joint.phaseOptimal?.[phase]) ?? joint.optimal;
  const acceptable = joint.acceptable;

  if (angle >= optimal[0] && angle <= optimal[1]) return "OPTIMAL";
  if (angle >= acceptable[0] && angle <= acceptable[1]) return "ACCEPTABLE";
  return "WARNING";
}

export const STATE_COLORS = {
  OPTIMAL: "#22C55E",
  ACCEPTABLE: "#EAB308",
  WARNING: "#F97316",
  DANGER: "#EF4444",
};

export function smoothLandmarks(current, previous) {
  if (!previous) return current;
  return current.map((lm, i) => {
    const prev = previous[i];
    if (!prev) return lm;
    return {
      x: EMA_ALPHA * lm.x + (1 - EMA_ALPHA) * prev.x,
      y: EMA_ALPHA * lm.y + (1 - EMA_ALPHA) * prev.y,
      z: EMA_ALPHA * (lm.z || 0) + (1 - EMA_ALPHA) * (prev.z || 0),
      visibility: lm.visibility,
    };
  });
}

export function areLandmarksVisible(landmarks, indices) {
  return indices.every(
    (i) => landmarks[i] && landmarks[i].visibility >= CONFIDENCE_THRESHOLD
  );
}

export function computeJointAngles(landmarks, exercise, phase) {
  const results = [];

  for (const joint of exercise.joints) {
    if (joint.landmarks === "spine_lean") {
      if (!areLandmarksVisible(landmarks, [11, 12, 23, 24])) {
        results.push({ ...joint, angle: null, state: null });
        continue;
      }
      const angle = calcSpineLean(landmarks);
      const state = evaluateState(angle, joint, phase);
      const pos = {
        x: (landmarks[11].x + landmarks[12].x) / 2,
        y: (landmarks[11].y + landmarks[12].y) / 2,
      };
      results.push({ ...joint, angle, state, position: pos });
    } else {
      let lms = joint.landmarks;
      let visible = areLandmarksVisible(landmarks, lms);
      if (!visible && joint.altLandmarks) {
        lms = joint.altLandmarks;
        visible = areLandmarksVisible(landmarks, lms);
      }
      if (!visible) {
        results.push({ ...joint, angle: null, state: null });
        continue;
      }
      const A = landmarks[lms[0]];
      const B = landmarks[lms[1]];
      const C = landmarks[lms[2]];
      const angle = calcAngle(A, B, C);
      const state = evaluateState(angle, joint, phase);
      results.push({ ...joint, angle, state, position: { x: B.x, y: B.y } });
    }
  }

  return results;
}

export function computeFormScore(jointResults) {
  const scored = jointResults.filter((j) => j.state !== null);
  if (scored.length === 0) return 0;

  const stateScores = { OPTIMAL: 100, ACCEPTABLE: 75, WARNING: 45, DANGER: 15 };
  const total = scored.reduce((sum, j) => sum + (stateScores[j.state] || 0), 0);
  return Math.round(total / scored.length);
}