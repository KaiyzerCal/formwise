/**
 * GuideOverlayCanvas — minimal, clean keypoint overlay
 * Renders 3–5 key joint points and angle lines ONLY.
 * No full skeleton. No clinical visuals. Premium feel.
 */
import React, { useRef, useEffect, useCallback } from 'react';

// Only show the most important joints (3–5 max)
const KEY_JOINT_NAMES = ['hip', 'knee', 'ankle', 'shoulder', 'elbow'];

// Angle guide lines: joint chains to draw
const ANGLE_CHAINS = [
  ['hip', 'knee', 'ankle'],      // leg angle
  ['shoulder', 'hip', 'knee'],   // trunk-to-leg
  ['shoulder', 'elbow', 'wrist'], // arm angle (if visible)
];

const GUIDE_COLOR = 'rgba(201, 162, 39, 0.7)';
const GUIDE_COLOR_DIM = 'rgba(201, 162, 39, 0.25)';
const POINT_COLOR = 'rgba(255, 255, 255, 0.9)';

export default function GuideOverlayCanvas({ keypoints, containerRef }) {
  const canvasRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef?.current;
    if (!canvas || !container || !keypoints?.length) return;

    const rect = container.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    // Build name→position map
    const map = {};
    for (const kp of keypoints) {
      if (kp && kp.name && (kp.visibility == null || kp.visibility > 0.3)) {
        map[kp.name] = { x: kp.x * w, y: kp.y * h };
      }
    }

    // Draw angle guide lines (subtle)
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = GUIDE_COLOR_DIM;

    for (const chain of ANGLE_CHAINS) {
      const points = chain.map(name => map[name]).filter(Boolean);
      if (points.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw key joint points (small, clean circles)
    for (const name of KEY_JOINT_NAMES) {
      const pos = map[name];
      if (!pos) continue;

      // Outer ring (accent)
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
      ctx.strokeStyle = GUIDE_COLOR;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner dot (white)
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = POINT_COLOR;
      ctx.fill();
    }

    // Draw angle value at the "knee" vertex (most relevant)
    if (map.hip && map.knee && map.ankle) {
      const angle = computeAngle(map.hip, map.knee, map.ankle);
      ctx.font = `bold 11px "DM Mono", monospace`;
      ctx.fillStyle = GUIDE_COLOR;
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(angle)}°`, map.knee.x + 16, map.knee.y - 8);
    }
  }, [keypoints, containerRef]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Also redraw on resize
  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
}

function computeAngle(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
  const magCB = Math.sqrt(cb.x * cb.x + cb.y * cb.y);
  if (magAB === 0 || magCB === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return (Math.acos(cos) * 180) / Math.PI;
}