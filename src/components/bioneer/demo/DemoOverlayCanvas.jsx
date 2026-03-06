import React, { useRef, useEffect } from "react";

const STATE_COLORS = {
  OPTIMAL:    "#22C55E",
  ACCEPTABLE: "#EAB308",
  WARNING:    "#F97316",
  DANGER:     "#EF4444",
};

const SKELETON_PAIRS = [
  ["left_shoulder",  "right_shoulder"],
  ["left_shoulder",  "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip",       "right_hip"],
  ["left_hip",       "left_knee"],
  ["right_hip",      "right_knee"],
  ["left_knee",      "left_ankle"],
  ["right_knee",     "right_ankle"],
];

// Map joint connections to a relevant state key
const PAIR_STATE = {
  "left_shoulder-right_shoulder": "trunk",
  "left_shoulder-left_hip": "trunk",
  "right_shoulder-right_hip": "trunk",
  "left_hip-right_hip": "trunk",
  "left_hip-left_knee": "front_knee",
  "right_hip-right_knee": "front_knee",
  "left_knee-left_ankle": "front_knee",
  "right_knee-right_ankle": "front_knee",
};

function resolveState(a, b, jointStates) {
  const key = `${a}-${b}`;
  const stateKey = PAIR_STATE[key] || "trunk";
  // Try multiple state keys
  return jointStates?.[stateKey] || jointStates?.["elbow"] || jointStates?.["body_line"] || "OPTIMAL";
}

export default function DemoOverlayCanvas({ currentFrame, width = 400, height = 300 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentFrame) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);

    const kp = currentFrame.keypoints;
    const js = currentFrame.jointStates || {};
    const angles = currentFrame.angles || {};

    // Draw skeleton lines
    for (const [a, b] of SKELETON_PAIRS) {
      if (!kp[a] || !kp[b]) continue;
      const state = resolveState(a, b, js);
      const color = STATE_COLORS[state] || "#22C55E";

      const x1 = kp[a].x * width;
      const y1 = kp[a].y * height;
      const x2 = kp[b].x * width;
      const y2 = kp[b].y * height;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw joint dots
    const mainJoints = ["left_shoulder","right_shoulder","left_hip","right_hip","left_knee","right_knee","left_ankle","right_ankle","shoulder_mid","hip_mid"];
    for (const name of mainJoints) {
      if (!kp[name]) continue;
      const x = kp[name].x * width;
      const y = kp[name].y * height;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw angle badges
    const BADGE_POSITIONS = {
      knee:      kp["left_knee"],
      hip:       kp["left_hip"],
      spine:     kp["shoulder_mid"],
      trunk:     kp["shoulder_mid"],
      front_knee:kp["left_knee"],
      elbow:     kp["left_shoulder"],
      body_line: kp["hip_mid"],
    };

    for (const [key, val] of Object.entries(angles)) {
      const pos = BADGE_POSITIONS[key];
      if (!pos) continue;
      const state = js[key] || "OPTIMAL";
      const color = STATE_COLORS[state] || "#22C55E";
      const x = pos.x * width - 28;
      const y = pos.y * height - 20;

      // Badge background
      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.beginPath();
      ctx.roundRect(x - 2, y - 12, 58, 18, 4);
      ctx.fill();

      // Badge border
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label text
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "bold 7px 'DM Mono', monospace";
      ctx.fillText(key.toUpperCase(), x + 2, y - 1);

      // Angle text
      ctx.fillStyle = color;
      ctx.font = "bold 9px 'DM Mono', monospace";
      ctx.fillText(`${Math.round(val)}°`, x + 2, y + 9);
    }
  }, [currentFrame, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 2 }}
    />
  );
}