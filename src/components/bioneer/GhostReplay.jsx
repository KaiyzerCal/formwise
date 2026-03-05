import React, { useRef, useEffect, useState, useCallback } from "react";
import { SKELETON_CONNECTIONS } from "./poseEngine";

const FPS = 30;
const FRAME_INTERVAL = 1000 / FPS;

// Interpolate between two landmark frames
function interpolateFrames(frameA, frameB, t) {
  if (!frameA || !frameB) return frameA || frameB;
  const result = {};
  for (const id of Object.keys(frameA)) {
    const a = frameA[id];
    const b = frameB[id];
    if (a && b) {
      result[id] = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    } else {
      result[id] = a || b;
    }
  }
  return result;
}

// Convert buffer { jointId: [{x,y,t}] } into array of frames { jointId: {x,y} }[]
function bufferToFrames(buffer, targetCount) {
  const ids = Object.keys(buffer);
  if (ids.length === 0) return [];
  const maxLen = Math.max(...ids.map((id) => buffer[id].length));
  if (maxLen === 0) return [];

  const frames = [];
  for (let i = 0; i < targetCount; i++) {
    const srcIdx = (i / (targetCount - 1)) * (maxLen - 1);
    const lo = Math.floor(srcIdx);
    const hi = Math.min(lo + 1, maxLen - 1);
    const t = srcIdx - lo;
    const frame = {};
    for (const id of ids) {
      const arr = buffer[id];
      const a = arr[lo];
      const b = arr[hi];
      if (a && b) {
        frame[id] = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      } else if (a) {
        frame[id] = { x: a.x, y: a.y };
      }
    }
    frames.push(frame);
  }
  return frames;
}

// Convert idealPaths { jointId: [{x,y}] } to frames array
function idealPathsToFrames(idealPaths, targetCount) {
  const ids = Object.keys(idealPaths);
  if (ids.length === 0) return [];
  const frames = [];
  for (let i = 0; i < targetCount; i++) {
    const frame = {};
    for (const id of ids) {
      const arr = idealPaths[id];
      if (!arr || arr.length === 0) continue;
      const srcIdx = (i / (targetCount - 1)) * (arr.length - 1);
      const lo = Math.floor(srcIdx);
      const hi = Math.min(lo + 1, arr.length - 1);
      const t = srcIdx - lo;
      const a = arr[lo];
      const b = arr[hi];
      frame[id] = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    frames.push(frame);
  }
  return frames;
}

// Minimal skeleton from joint positions (not full 33-landmark array)
// Draw just tracked joints connected by known pairs
const JOINT_PAIRS = [
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
];

function drawFrameSkeleton(ctx, frame, w, h, color, opacity) {
  if (!frame) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.shadowBlur = color === "#C9A84C" ? 6 : 0;
  ctx.shadowColor = color;

  for (const [a, b] of JOINT_PAIRS) {
    const pA = frame[a];
    const pB = frame[b];
    if (!pA || !pB) continue;
    ctx.beginPath();
    ctx.moveTo(pA.x * w, pA.y * h);
    ctx.lineTo(pB.x * w, pB.y * h);
    ctx.stroke();
  }

  // Draw joint dots
  for (const id of Object.keys(frame)) {
    const p = frame[id];
    if (!p) continue;
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.restore();
}

const REPLAY_FRAME_COUNT = 60; // normalize both to 60 frames

export default function GhostReplay({ replayData, onSave, onDone, saving }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const frameRef = useRef(0);

  const userFrames = useRef([]);
  const idealFrames = useRef([]);
  const [isPlaying, setIsPlaying] = useState(true);

  const score = replayData.score ?? 0;
  const exerciseName = replayData.exerciseName || replayData.exerciseId?.replace(/_/g, " ").toUpperCase() || "SESSION";
  const worstJoint = replayData.worstJoint;
  const coachingText = replayData.coachingText;

  // Pre-compute frames once
  useEffect(() => {
    userFrames.current = bufferToFrames(replayData.userFrames || {}, REPLAY_FRAME_COUNT);
    idealFrames.current = idealPathsToFrames(replayData.idealFrames || {}, REPLAY_FRAME_COUNT);
  }, [replayData]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const fi = frameRef.current % REPLAY_FRAME_COUNT;
    const idealFrame = idealFrames.current[fi];
    const userFrame = userFrames.current[fi];

    // Ideal skeleton (gold)
    drawFrameSkeleton(ctx, idealFrame, w, h, "#C9A84C", 0.70);
    // User skeleton (white)
    drawFrameSkeleton(ctx, userFrame, w, h, "#F5F5F5", 0.90);
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;
    let last = 0;
    function loop(ts) {
      if (ts - last >= FRAME_INTERVAL) {
        frameRef.current++;
        draw();
        last = ts;
      }
      animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, draw]);

  // Initial draw when paused
  useEffect(() => {
    if (!isPlaying) draw();
  }, [isPlaying, draw]);

  const handleReplay = () => {
    frameRef.current = 0;
    setIsPlaying(true);
  };

  const scoreColor = score >= 80 ? "#22C55E" : score >= 65 ? "#EAB308" : "#EF4444";

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] flex flex-col">
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-sm font-bold text-white tracking-[0.2em] uppercase"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {exerciseName}
            </h2>
            {worstJoint && (
              <p
                className="text-[10px] text-white/40 mt-0.5 tracking-wider"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                Largest deviation: {worstJoint.label}{" "}
                {worstJoint.avgAngle !== undefined ? `${worstJoint.avgAngle}°` : ""}{" "}
                {worstJoint.optimalRange ? `(optimal ${worstJoint.optimalRange[0]}–${worstJoint.optimalRange[1]}°)` : ""}
              </p>
            )}
          </div>
          <div className="text-right">
            <span
              className="text-2xl font-bold"
              style={{ fontFamily: "'DM Mono', monospace", color: scoreColor }}
            >
              {score}
            </span>
            <span className="text-white/30 text-sm"> / 100</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={500}
          height={560}
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "contain" }}
        />

        {/* Legend */}
        <div
          className="absolute bottom-4 left-4 flex flex-col gap-1.5"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#C9A84C]" />
            <span
              className="text-[10px] text-white/40 tracking-widest"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              IDEAL
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#F5F5F5]" />
            <span
              className="text-[10px] text-white/40 tracking-widest"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              YOU
            </span>
          </div>
        </div>
      </div>

      {/* Bottom panel */}
      <div className="flex-shrink-0 px-4 pb-6 pt-3 border-t border-white/5 bg-black/40 backdrop-blur-md space-y-3">
        {/* Coaching card */}
        {coachingText && (
          <div className="rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 px-4 py-3">
            <p
              className="text-[10px] text-[#C9A84C]/60 uppercase tracking-widest mb-1"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              Coaching
            </p>
            <p className="text-xs text-white/60 leading-relaxed">"{coachingText}"</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          <button
            onClick={handleReplay}
            className="flex-shrink-0 px-4 py-3 rounded-xl border border-white/10 text-white/60 text-xs font-bold tracking-wider hover:bg-white/5 transition-colors"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            ↺ REPLAY
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-[#C9A84C] hover:bg-[#b8943f] text-black font-bold text-xs tracking-wider transition-colors disabled:opacity-50"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {saving ? "SAVING..." : "SAVE SESSION"}
          </button>
          <button
            onClick={onDone}
            className="flex-shrink-0 px-4 py-3 rounded-xl border border-white/10 text-white/60 text-xs font-bold tracking-wider hover:bg-white/5 transition-colors"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
}