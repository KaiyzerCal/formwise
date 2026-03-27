/**
 * ReferenceSkeletonPlayer
 * Animates pre-computed reference landmark frames on a canvas.
 * Loops the keyframe sequence, interpolating between frames.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { Play, Pause, SkipBack } from 'lucide-react';

// MediaPipe connections (subset — matches canvasRenderer style)
const CONNECTIONS = [
  [11,12],[11,13],[13,15],[12,14],[14,16], // arms
  [11,23],[12,24],[23,24],                 // torso
  [23,25],[25,27],[24,26],[26,28],         // legs
  [0,11],[0,12],                           // head-shoulder
];

const SPEEDS = [0.5, 1, 2];

function lerp(a, b, t) { return a + (b - a) * t; }

function interpolateLandmarks(frameA, frameB, t) {
  return frameA.map((lmA, i) => {
    const lmB = frameB[i];
    return {
      x: lerp(lmA.x, lmB.x, t),
      y: lerp(lmA.y, lmB.y, t),
      z: lerp(lmA.z || 0, lmB.z || 0, t),
      visibility: lerp(lmA.visibility, lmB.visibility, t),
    };
  });
}

function drawSkeleton(ctx, landmarks, w, h) {
  if (!landmarks) return;
  ctx.clearRect(0, 0, w, h);

  // Connections
  ctx.lineWidth = 2;
  for (const [a, b] of CONNECTIONS) {
    const lmA = landmarks[a], lmB = landmarks[b];
    if (!lmA || !lmB || lmA.visibility < 0.3 || lmB.visibility < 0.3) continue;
    const alpha = Math.min(lmA.visibility, lmB.visibility);
    ctx.strokeStyle = `rgba(201,162,39,${alpha * 0.85})`;
    ctx.beginPath();
    ctx.moveTo(lmA.x * w, lmA.y * h);
    ctx.lineTo(lmB.x * w, lmB.y * h);
    ctx.stroke();
  }

  // Joints
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    if (!lm || lm.visibility < 0.3) continue;
    const r = [11,12,23,24,25,26].includes(i) ? 5 : 3;
    ctx.fillStyle = `rgba(255,255,255,${lm.visibility * 0.9})`;
    ctx.beginPath();
    ctx.arc(lm.x * w, lm.y * h, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function ReferenceSkeletonPlayer({ frames, label, onLandmarksChange }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const stateRef  = useRef({ frameIdx: 0, t: 0, playing: true, speed: 1 });

  const [displayPhase, setDisplayPhase] = useState('');
  const [playing, setPlaying]           = useState(true);
  const [speed, setSpeed]               = useState(1);
  const [frameIdx, setFrameIdx]         = useState(0);
  const lastTickRef = useRef(null);

  const FRAME_DURATION_MS = 1200; // ms per keyframe at speed 1

  const tick = useCallback((now) => {
    const s = stateRef.current;
    if (!lastTickRef.current) lastTickRef.current = now;
    const dt = now - lastTickRef.current;
    lastTickRef.current = now;

    if (s.playing && frames?.length > 1) {
      s.t += (dt / FRAME_DURATION_MS) * s.speed;
      if (s.t >= 1) {
        s.t = 0;
        s.frameIdx = (s.frameIdx + 1) % frames.length;
        setFrameIdx(s.frameIdx);
      }
    }

    const cvs = canvasRef.current;
    if (cvs && frames?.length) {
      const ctx = cvs.getContext('2d');
      const nextIdx = (s.frameIdx + 1) % frames.length;
      const lms = interpolateLandmarks(frames[s.frameIdx].landmarks, frames[nextIdx].landmarks, s.t);
      drawSkeleton(ctx, lms, cvs.width, cvs.height);
      setDisplayPhase(frames[s.frameIdx].label || frames[s.frameIdx].phase);
      onLandmarksChange?.(lms);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [frames, onLandmarksChange]);

  useEffect(() => {
    lastTickRef.current = null;
    stateRef.current = { frameIdx: 0, t: 0, playing: true, speed: 1 };
    setPlaying(true);
    setSpeed(1);
    setFrameIdx(0);
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [frames, tick]);

  // Resize canvas
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ro = new ResizeObserver(() => {
      cvs.width  = cvs.offsetWidth;
      cvs.height = cvs.offsetHeight;
    });
    ro.observe(cvs);
    cvs.width  = cvs.offsetWidth;
    cvs.height = cvs.offsetHeight;
    return () => ro.disconnect();
  }, []);

  const togglePlay = () => {
    stateRef.current.playing = !stateRef.current.playing;
    setPlaying(p => !p);
  };

  const reset = () => {
    stateRef.current.frameIdx = 0;
    stateRef.current.t = 0;
    setFrameIdx(0);
  };

  const changeSpeed = (s) => {
    stateRef.current.speed = s;
    setSpeed(s);
  };

  if (!frames?.length) {
    return (
      <div className="w-full h-full flex items-center justify-center"
        style={{ background: '#000' }}>
        <p className="text-[10px] tracking-widest uppercase" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          No reference selected
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col relative" style={{ background: '#000' }}>
      {/* Label banner */}
      <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
        <span className="text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-1 rounded"
          style={{ background: 'rgba(0,0,0,0.7)', color: COLORS.gold, fontFamily: FONT.mono }}>
          {label || 'IDEAL FORM'}
        </span>
        <span className="text-[9px] tracking-[0.1em] px-2 py-1 rounded"
          style={{ background: 'rgba(0,0,0,0.7)', color: COLORS.textSecondary, fontFamily: FONT.mono }}>
          {displayPhase}
        </span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="flex-1 w-full"
        style={{ display: 'block' }}
      />

      {/* Controls */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-t"
        style={{ borderColor: COLORS.border, background: COLORS.surface }}>
        <div className="flex items-center gap-2">
          <button onClick={reset}
            className="p-1.5 rounded"
            style={{ background: COLORS.border, color: COLORS.textSecondary }}>
            <SkipBack size={11} />
          </button>
          <button onClick={togglePlay}
            className="px-3 py-1 rounded text-[9px] font-bold tracking-[0.1em] uppercase"
            style={{ background: COLORS.goldDim, borderColor: COLORS.goldBorder, border: '1px solid', color: COLORS.gold, fontFamily: FONT.mono }}>
            {playing ? <Pause size={11} /> : <Play size={11} />}
          </button>
        </div>

        {/* Frame dots */}
        <div className="flex items-center gap-1">
          {frames.map((_, i) => (
            <div key={i}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === frameIdx ? 6 : 4,
                height: i === frameIdx ? 6 : 4,
                background: i === frameIdx ? COLORS.gold : COLORS.border,
              }} />
          ))}
        </div>

        <div className="flex items-center gap-1">
          {SPEEDS.map(s => (
            <button key={s} onClick={() => changeSpeed(s)}
              className="px-1.5 py-0.5 rounded border text-[8px]"
              style={{
                background:  speed === s ? COLORS.goldDim    : 'transparent',
                borderColor: speed === s ? COLORS.goldBorder : COLORS.border,
                color:       speed === s ? COLORS.gold       : COLORS.textTertiary,
                fontFamily:  FONT.mono,
              }}>
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}