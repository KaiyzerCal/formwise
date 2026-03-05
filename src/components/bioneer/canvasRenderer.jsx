// Canvas rendering: skeleton lines, joint nodes, angle badges, ghost pose
import { SKELETON_CONNECTIONS, STATE_COLORS } from "./poseEngine";

const GHOST_COLOR = "#C9A84C";
const GHOST_OPACITY = 0.4;

export function clearCanvas(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
}

export function drawLine(ctx, A, B, color, lineWidth = 3) {
  ctx.beginPath();
  ctx.moveTo(A.x, A.y);
  ctx.lineTo(B.x, B.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.shadowBlur = 8;
  ctx.shadowColor = color;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

export function drawJointNode(ctx, x, y, color, pulse = false) {
  const radius = pulse ? 6 * (1 + 0.15 * Math.sin(Date.now() * 0.008)) : 6;
  // White border
  ctx.beginPath();
  ctx.arc(x, y, radius + 1.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fill();
  // Colored fill
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

export function drawAngleBadge(ctx, x, y, angle, label, color) {
  const badgeX = x + 20;
  const badgeY = y - 15;
  const badgeW = 56;
  const badgeH = 38;

  // Background
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
  ctx.fill();

  // Border
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
  ctx.stroke();

  // Label
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, badgeX + badgeW / 2, badgeY + 12);

  // Angle value
  ctx.fillStyle = color;
  ctx.font = "bold 16px monospace";
  ctx.fillText(`${angle}°`, badgeX + badgeW / 2, badgeY + 30);
}

export function drawSkeleton(ctx, landmarks, jointResults, w, h) {
  // Build a map of joint states for coloring skeleton segments
  const jointStateMap = {};
  for (const jr of jointResults) {
    if (jr.state && jr.landmarks !== "spine_lean") {
      const lms = jr.position ? [jr.landmarks?.[1] || jr.altLandmarks?.[1]] : [];
      if (jr.landmarks && Array.isArray(jr.landmarks)) {
        jr.landmarks.forEach((l) => (jointStateMap[l] = jr.state));
      }
      if (jr.altLandmarks) {
        jr.altLandmarks.forEach((l) => {
          if (!jointStateMap[l]) jointStateMap[l] = jr.state;
        });
      }
    }
  }

  // Draw skeleton connections
  for (const [i, j] of SKELETON_CONNECTIONS) {
    const a = landmarks[i];
    const b = landmarks[j];
    if (!a || !b || a.visibility < 0.5 || b.visibility < 0.5) continue;

    const stateA = jointStateMap[i] || "OPTIMAL";
    const stateB = jointStateMap[j] || "OPTIMAL";
    // Use worse state for segment color
    const states = ["DANGER", "WARNING", "ACCEPTABLE", "OPTIMAL"];
    const worstIdx = Math.min(states.indexOf(stateA), states.indexOf(stateB));
    const color = STATE_COLORS[states[Math.max(0, worstIdx)]];

    drawLine(
      ctx,
      { x: a.x * w, y: a.y * h },
      { x: b.x * w, y: b.y * h },
      color
    );
  }

  // Draw joint nodes for tracked joints
  for (const jr of jointResults) {
    if (!jr.position || jr.angle === null) continue;
    const color = STATE_COLORS[jr.state] || "#ffffff";
    const pulse = jr.state === "DANGER";
    drawJointNode(ctx, jr.position.x * w, jr.position.y * h, color, pulse);
    drawAngleBadge(
      ctx,
      jr.position.x * w,
      jr.position.y * h,
      jr.angle,
      jr.label,
      color
    );
  }
}

export function drawGhostSkeleton(ctx, landmarks, w, h) {
  ctx.globalAlpha = GHOST_OPACITY;
  for (const [i, j] of SKELETON_CONNECTIONS) {
    const a = landmarks[i];
    const b = landmarks[j];
    if (!a || !b) continue;
    drawLine(
      ctx,
      { x: a.x * w, y: a.y * h },
      { x: b.x * w, y: b.y * h },
      GHOST_COLOR,
      1.5
    );
  }
  ctx.globalAlpha = 1.0;
}

// Generate a simple reference pose scaled to user size
export function generateGhostPose(userLandmarks) {
  if (!userLandmarks || userLandmarks.length < 29) return null;
  // Use user's general position but with ideal alignment
  // Just return user landmarks slightly adjusted for now
  const ghost = userLandmarks.map((lm) => ({ ...lm }));
  // Straighten spine: align shoulders over hips
  const hipMidX = (ghost[23].x + ghost[24].x) / 2;
  const shoulderMidX = (ghost[11].x + ghost[12].x) / 2;
  const offset = hipMidX - shoulderMidX;
  [11, 12, 13, 14, 15, 16].forEach((i) => {
    if (ghost[i]) ghost[i].x += offset * 0.5;
  });
  return ghost;
}