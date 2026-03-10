import React, { useRef, useEffect } from "react";
import { COLORS, FONT } from "./DesignTokens";

const SKELETON_JOINTS = [
  { x: 0.5, y: 0.12, label: 'head' },
  { x: 0.45, y: 0.25, label: 'l_shoulder' },
  { x: 0.55, y: 0.25, label: 'r_shoulder' },
  { x: 0.42, y: 0.40, label: 'l_elbow' },
  { x: 0.58, y: 0.40, label: 'r_elbow' },
  { x: 0.40, y: 0.52, label: 'l_wrist' },
  { x: 0.60, y: 0.52, label: 'r_wrist' },
  { x: 0.46, y: 0.50, label: 'l_hip' },
  { x: 0.54, y: 0.50, label: 'r_hip' },
  { x: 0.44, y: 0.68, label: 'l_knee' },
  { x: 0.56, y: 0.68, label: 'r_knee' },
  { x: 0.43, y: 0.85, label: 'l_ankle' },
  { x: 0.57, y: 0.85, label: 'r_ankle' },
];

const BONES = [
  [0,1],[0,2],[1,2],[1,3],[2,4],[3,5],[4,6],[1,7],[2,8],[7,8],[7,9],[8,10],[9,11],[10,12]
];

export default function LiveCameraPanel({ running, phase, cue, cueVisible, confidence }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function draw() {
      const w = canvas.width = canvas.offsetWidth * 2;
      const h = canvas.height = canvas.offsetHeight * 2;
      ctx.clearRect(0, 0, w, h);
      tRef.current += 0.02;
      const t = tRef.current;

      if (running) {
        // Draw trajectory paths
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = COLORS.correct;
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          for (let x = 0; x < w; x += 4) {
            const y = h * 0.5 + Math.sin(x * 0.01 + t + i * 2) * 40 + i * 30;
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Animated joints
        const jitter = () => (Math.sin(t * 3) * 0.008);
        const joints = SKELETON_JOINTS.map(j => ({
          x: (j.x + jitter()) * w,
          y: (j.y + Math.sin(t * 2 + j.x * 10) * 0.01) * h,
          label: j.label,
        }));

        // Bones
        ctx.lineWidth = 2;
        BONES.forEach(([a, b]) => {
          const isFault = (a === 9 || a === 10 || b === 9 || b === 10) && phase === 'Bottom';
          ctx.strokeStyle = isFault ? COLORS.fault : COLORS.correct;
          ctx.globalAlpha = isFault ? 0.9 : 0.6;
          ctx.beginPath();
          ctx.moveTo(joints[a].x, joints[a].y);
          ctx.lineTo(joints[b].x, joints[b].y);
          ctx.stroke();
        });
        ctx.globalAlpha = 1;

        // Joint dots
        joints.forEach((j, i) => {
          const isFault = (i === 9 || i === 10) && phase === 'Bottom';
          ctx.fillStyle = isFault ? COLORS.fault : COLORS.correct;
          ctx.beginPath();
          ctx.arc(j.x, j.y, isFault ? 6 : 4, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      animRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [running, phase]);

  const cueBorderColor = cue?.severity === 'error' ? COLORS.fault : cue?.severity === 'warning' ? COLORS.warning : COLORS.correct;

  return (
    <div className="relative w-full h-full" style={{ background: COLORS.surface }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle, rgba(201,162,39,0.03) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      {/* Tracking badge */}
      {running && (
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full border" style={{ background: 'rgba(0,0,0,0.7)', borderColor: COLORS.goldBorder }}>
          <span className="text-[9px] tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>TRACKING LOCKED</span>
        </div>
      )}

      {/* Confidence */}
      {running && (
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <span className="text-[9px] tracking-[0.1em]" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>{confidence}%</span>
        </div>
      )}

      {/* Not running state */}
      {!running && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full border-2 flex items-center justify-center mb-3" style={{ borderColor: COLORS.border }}>
              <div className="w-3 h-3 rounded-full" style={{ background: COLORS.gold }} />
            </div>
            <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: COLORS.textTertiary }}>Press start to begin session</p>
          </div>
        </div>
      )}

      {/* Coaching cue bar */}
      {running && cueVisible && cue && (
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 border-t-2 transition-opacity" style={{
          background: 'rgba(0,0,0,0.85)',
          borderColor: cueBorderColor,
          opacity: cueVisible ? 1 : 0,
        }}>
          <p className="text-xs text-center" style={{ color: COLORS.textPrimary, fontFamily: FONT.mono }}>{cue.text}</p>
        </div>
      )}
    </div>
  );
}