import React, { useState, useRef, useEffect, useCallback } from "react";
import { COLORS, FONT, deviationColor } from "../components/bioneer/ui/DesignTokens";
import { JOINT_DEVIATIONS } from "../components/bioneer/ui/mockData";
import PhasePill from "../components/bioneer/ui/PhasePill";

const SKELETON = [
  { x: 0.50, y: 0.10 }, // head
  { x: 0.43, y: 0.22 }, // l_shoulder
  { x: 0.57, y: 0.22 }, // r_shoulder
  { x: 0.38, y: 0.38 }, // l_elbow
  { x: 0.62, y: 0.38 }, // r_elbow
  { x: 0.36, y: 0.50 }, // l_wrist
  { x: 0.64, y: 0.50 }, // r_wrist
  { x: 0.45, y: 0.48 }, // l_hip
  { x: 0.55, y: 0.48 }, // r_hip
  { x: 0.43, y: 0.66 }, // l_knee
  { x: 0.57, y: 0.66 }, // r_knee
  { x: 0.42, y: 0.84 }, // l_ankle
  { x: 0.58, y: 0.84 }, // r_ankle
];
const BONES = [[0,1],[0,2],[1,2],[1,3],[2,4],[3,5],[4,6],[1,7],[2,8],[7,8],[7,9],[8,10],[9,11],[10,12]];
const TOTAL_FRAMES = 180;

function drawSkeleton(ctx, joints, color, w, h, dotSize = 4) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.7;
  BONES.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(joints[a].x * w, joints[a].y * h);
    ctx.lineTo(joints[b].x * w, joints[b].y * h);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  joints.forEach(j => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(j.x * w, j.y * h, dotSize, 0, Math.PI * 2);
    ctx.fill();
  });
}

function animatedJoints(base, t, offset = 0) {
  return base.map(j => ({
    x: j.x + Math.sin(t * 2 + j.y * 6 + offset) * 0.012,
    y: j.y + Math.cos(t * 1.5 + j.x * 8 + offset) * 0.008,
  }));
}

export default function TechniqueCompare() {
  const [mode, setMode] = useState('sidebyside');
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showYou, setShowYou] = useState(true);
  const [showIdeal, setShowIdeal] = useState(true);
  const [showAngles, setShowAngles] = useState(false);
  const canvasLeftRef = useRef(null);
  const canvasRightRef = useRef(null);
  const canvasOverlayRef = useRef(null);
  const animRef = useRef(null);
  const tRef = useRef(0);

  const tick = useCallback(() => {
    tRef.current += 0.016 * speed;
    setFrame(f => (f + 1) % TOTAL_FRAMES);

    [canvasLeftRef, canvasRightRef, canvasOverlayRef].forEach(ref => {
      const canvas = ref.current;
      if (!canvas) return;
      const w = canvas.width = canvas.offsetWidth * 2;
      const h = canvas.height = canvas.offsetHeight * 2;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      const t = tRef.current;

      if (ref === canvasLeftRef && showYou) {
        drawSkeleton(ctx, animatedJoints(SKELETON, t, 0), COLORS.correct, w, h, 5);
      }
      if (ref === canvasRightRef && showIdeal) {
        drawSkeleton(ctx, animatedJoints(SKELETON, t, 0.3), COLORS.gold, w, h, 5);
      }
      if (ref === canvasOverlayRef) {
        if (showYou) drawSkeleton(ctx, animatedJoints(SKELETON, t, 0), COLORS.correct, w, h, 5);
        if (showIdeal) drawSkeleton(ctx, animatedJoints(SKELETON, t, 0.3), `${COLORS.gold}99`, w, h, 4);
      }

      if (showAngles) {
        ctx.font = `${Math.floor(w * 0.018)}px monospace`;
        ctx.fillStyle = COLORS.textSecondary;
        const jts = animatedJoints(SKELETON, t, 0);
        ctx.fillText('95°', jts[9].x * w + 8, jts[9].y * h);
        ctx.fillText('105°', jts[7].x * w + 8, jts[7].y * h);
      }
    });

    animRef.current = requestAnimationFrame(tick);
  }, [speed, showYou, showIdeal, showAngles]);

  useEffect(() => {
    if (playing) {
      animRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(animRef.current);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [playing, tick]);

  const timeMs = Math.round((frame / TOTAL_FRAMES) * 6000);

  return (
    <div className="h-full flex flex-col" style={{ fontFamily: FONT.mono }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: COLORS.border }}>
        <div className="flex items-center gap-4">
          <h1 className="text-xs tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.gold }}>Technique Analysis</h1>
          <span className="text-[10px]" style={{ color: COLORS.textTertiary }}>Back Squat</span>
        </div>
        <div className="flex gap-1">
          {['sidebyside', 'overlay'].map(m => (
            <button key={m} onClick={() => setMode(m)}
              className="px-3 py-1 rounded text-[9px] tracking-[0.1em] uppercase border"
              style={{
                background: mode === m ? COLORS.goldDim : 'transparent',
                borderColor: mode === m ? COLORS.goldBorder : COLORS.border,
                color: mode === m ? COLORS.gold : COLORS.textTertiary,
              }}>
              {m === 'sidebyside' ? 'Side by Side' : 'Overlay'}
            </button>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col lg:flex-row">
          {mode === 'sidebyside' ? (
            <>
              <div className="flex-1 relative border-r" style={{ borderColor: COLORS.border, background: COLORS.bg }}>
                <span className="absolute top-3 left-3 text-[9px] tracking-[0.15em] uppercase z-10" style={{ color: COLORS.correct }}>YOUR MOVEMENT</span>
                <canvas ref={canvasLeftRef} className="w-full h-full" />
              </div>
              <div className="flex-1 relative" style={{ background: COLORS.bg }}>
                <span className="absolute top-3 left-3 text-[9px] tracking-[0.15em] uppercase z-10" style={{ color: COLORS.gold }}>IDEAL FORM</span>
                <canvas ref={canvasRightRef} className="w-full h-full" />
              </div>
            </>
          ) : (
            <div className="flex-1 relative" style={{ background: COLORS.bg }}>
              <div className="absolute top-3 left-3 z-10 flex gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS.correct }} />
                  <span className="text-[9px] tracking-[0.1em] uppercase" style={{ color: COLORS.correct }}>You</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS.gold }} />
                  <span className="text-[9px] tracking-[0.1em] uppercase" style={{ color: COLORS.gold }}>Ideal</span>
                </div>
              </div>
              <canvas ref={canvasOverlayRef} className="w-full h-full" />
            </div>
          )}

          {/* Joint deviation sidebar */}
          <div className="lg:w-[180px] w-full border-l p-4 space-y-4" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
            <span className="text-[9px] tracking-[0.15em] uppercase block" style={{ color: COLORS.textTertiary }}>JOINT Δ</span>
            {JOINT_DEVIATIONS.map(jd => (
              <div key={jd.joint} className="space-y-1">
                <span className="text-[10px]" style={{ color: COLORS.textTertiary }}>{jd.joint}</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${Math.min(jd.deviation * 3, 100)}%`,
                      background: deviationColor(jd.deviation),
                    }} />
                  </div>
                  <span className="text-[10px] font-bold w-6 text-right" style={{ color: deviationColor(jd.deviation) }}>{jd.deviation}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="px-4 py-3 border-t space-y-2" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
        {/* Timeline scrubber */}
        <input type="range" min={0} max={TOTAL_FRAMES - 1} value={frame}
          onChange={e => { setPlaying(false); setFrame(Number(e.target.value)); }}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: COLORS.gold, background: COLORS.border }}
        />
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button onClick={() => setPlaying(!playing)}
              className="px-3 py-1.5 rounded text-[10px] tracking-[0.1em] uppercase font-bold"
              style={{ background: COLORS.gold, color: '#000' }}>
              {playing ? 'Pause' : 'Play'}
            </button>
            <button onClick={() => setFrame(f => Math.max(0, f - 1))} className="px-2 py-1.5 rounded border text-[10px]"
              style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}>{'<'}</button>
            <button onClick={() => setFrame(f => Math.min(TOTAL_FRAMES - 1, f + 1))} className="px-2 py-1.5 rounded border text-[10px]"
              style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}>{'>'}</button>
          </div>
          <div className="flex items-center gap-1">
            {[0.25, 0.5, 1, 2].map(s => (
              <button key={s} onClick={() => setSpeed(s)}
                className="px-2 py-1 rounded text-[9px] border"
                style={{
                  background: speed === s ? COLORS.goldDim : 'transparent',
                  borderColor: speed === s ? COLORS.goldBorder : COLORS.border,
                  color: speed === s ? COLORS.gold : COLORS.textTertiary,
                }}>
                {s}×
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px]" style={{ color: COLORS.textTertiary }}>Frame {frame + 1} / {TOTAL_FRAMES}</span>
            <span className="text-[10px]" style={{ color: COLORS.textTertiary }}>{timeMs}ms</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[{l:'You',c:COLORS.correct,v:showYou,s:setShowYou},{l:'Ideal',c:COLORS.gold,v:showIdeal,s:setShowIdeal},{l:'Angles',c:COLORS.textTertiary,v:showAngles,s:setShowAngles}].map(t => (
              <button key={t.l} onClick={() => t.s(!t.v)}
                className="px-2 py-1 rounded text-[9px] border"
                style={{
                  background: t.v ? `${t.c}20` : 'transparent',
                  borderColor: t.v ? `${t.c}50` : COLORS.border,
                  color: t.v ? t.c : COLORS.textTertiary,
                }}>
                {t.l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}