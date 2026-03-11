/**
 * Shared pose utility functions for Technique Compare.
 * Works with MediaPipe Pose landmark arrays (33 points, normalized 0-1).
 */

const MP = {
  NOSE: 0,
  L_SHOULDER: 11, R_SHOULDER: 12,
  L_ELBOW: 13,    R_ELBOW: 14,
  L_WRIST: 15,    R_WRIST: 16,
  L_HIP: 23,      R_HIP: 24,
  L_KNEE: 25,     R_KNEE: 26,
  L_ANKLE: 27,    R_ANKLE: 28,
};

export { MP };

/**
 * Compute angle (degrees) between three landmarks: A-B-C (vertex at B).
 */
export function angleBetween(a, b, c) {
  if (!a || !b || !c) return null;
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag = Math.sqrt(v1.x ** 2 + v1.y ** 2) * Math.sqrt(v2.x ** 2 + v2.y ** 2);
  if (mag === 0) return null;
  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI;
}

/**
 * Extract key angle values from a landmark array using a compare profile.
 */
export function extractAngles(landmarks, keyAngles) {
  if (!landmarks || landmarks.length < 29) return {};
  const result = {};
  for (const { id, indices } of keyAngles) {
    const [ai, bi, ci] = indices;
    result[id] = angleBetween(landmarks[ai], landmarks[bi], landmarks[ci]);
  }
  return result;
}

/**
 * Normalize landmark positions to [0,1] relative to their bounding box.
 * This makes cross-video comparisons scale-invariant.
 */
export function normalizeLandmarksBBox(landmarks) {
  if (!landmarks?.length) return landmarks;
  const visible = landmarks.filter(l => l.visibility > 0.3);
  if (!visible.length) return landmarks;
  const minX = Math.min(...visible.map(l => l.x));
  const maxX = Math.max(...visible.map(l => l.x));
  const minY = Math.min(...visible.map(l => l.y));
  const maxY = Math.max(...visible.map(l => l.y));
  const w = maxX - minX || 1;
  const h = maxY - minY || 1;
  return landmarks.map(l => ({ ...l, x: (l.x - minX) / w, y: (l.y - minY) / h }));
}

// Skeleton connections for rendering
export const SKELETON_CONNECTIONS = [
  [MP.L_SHOULDER, MP.R_SHOULDER],
  [MP.L_SHOULDER, MP.L_ELBOW], [MP.L_ELBOW, MP.L_WRIST],
  [MP.R_SHOULDER, MP.R_ELBOW], [MP.R_ELBOW, MP.R_WRIST],
  [MP.L_SHOULDER, MP.L_HIP],   [MP.R_SHOULDER, MP.R_HIP],
  [MP.L_HIP, MP.R_HIP],
  [MP.L_HIP, MP.L_KNEE],  [MP.L_KNEE, MP.L_ANKLE],
  [MP.R_HIP, MP.R_KNEE],  [MP.R_KNEE, MP.R_ANKLE],
];

const KEY_JOINTS = [MP.NOSE, MP.L_SHOULDER, MP.R_SHOULDER, MP.L_ELBOW, MP.R_ELBOW,
  MP.L_WRIST, MP.R_WRIST, MP.L_HIP, MP.R_HIP, MP.L_KNEE, MP.R_KNEE, MP.L_ANKLE, MP.R_ANKLE];

/**
 * Draw skeleton overlay on a canvas context from MediaPipe landmarks.
 */
export function drawPoseOverlay(ctx, landmarks, color, w, h, opts = {}) {
  if (!landmarks || landmarks.length < 29) return;
  const { dotSize = 4, alpha = 0.85, lineWidth = 2 } = opts;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Draw bones
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  for (const [a, b] of SKELETON_CONNECTIONS) {
    const la = landmarks[a], lb = landmarks[b];
    if (!la || !lb) continue;
    if ((la.visibility ?? 1) < 0.2 || (lb.visibility ?? 1) < 0.2) continue;
    ctx.beginPath();
    ctx.moveTo(la.x * w, la.y * h);
    ctx.lineTo(lb.x * w, lb.y * h);
    ctx.stroke();
  }

  // Draw joints
  for (const i of KEY_JOINTS) {
    const lm = landmarks[i];
    if (!lm || (lm.visibility ?? 1) < 0.2) continue;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(lm.x * w, lm.y * h, dotSize, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draw angle annotations for key joints.
 */
export function drawAngleLabels(ctx, landmarks, angles, profile, w, h) {
  if (!landmarks || !angles || !profile?.keyAngles) return;
  ctx.save();
  const fontSize = Math.max(10, Math.floor(w * 0.022));
  ctx.font = `${fontSize}px 'DM Mono', monospace`;
  ctx.textBaseline = 'middle';

  for (const { id, indices } of profile.keyAngles) {
    const angle = angles[id];
    if (angle === null || angle === undefined) continue;
    const [, bi] = indices; // vertex joint
    const lm = landmarks[bi];
    if (!lm || (lm.visibility ?? 1) < 0.3) continue;
    const x = lm.x * w + 10;
    const y = lm.y * h;

    // Background pill
    const label = `${Math.round(angle)}°`;
    const tw = ctx.measureText(label).width;
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.roundRect(x - 4, y - fontSize / 2 - 3, tw + 10, fontSize + 6, 3);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(label, x + 1, y);
  }

  ctx.restore();
}