import React, { useRef, useEffect, useState, useCallback } from "react";
import { Play, Pause, RotateCcw, ArrowLeft } from "lucide-react";
import { clearCanvas, drawSkeleton, drawGhostSkeleton } from "./canvasRenderer";
import { STATE_COLORS } from "./poseEngine";

const FRAME_INTERVAL_MS = 100; // matches 10fps extraction

function getFrameAtTime(comparisonResults, currentTimeMs) {
  if (!comparisonResults?.length) return null;
  const index = Math.min(
    Math.floor(currentTimeMs / FRAME_INTERVAL_MS),
    comparisonResults.length - 1
  );
  return comparisonResults[Math.max(0, index)];
}

function buildJointResultsFromComparison(frame, blueprint, poseFrame) {
  if (!frame || !blueprint || !poseFrame?.landmarks) return [];
  return blueprint.joints.map(joint => {
    const angle = frame.angles[joint.id];
    const state = frame.jointStates[joint.id];
    const lm = poseFrame.landmarks;

    let position = null;
    if (joint.landmarks === "spine_lean") {
      if (lm[11] && lm[12]) {
        position = { x: (lm[11].x + lm[12].x) / 2, y: (lm[11].y + lm[12].y) / 2 };
      }
    } else {
      const lmIdx = joint.landmarks?.[1] ?? joint.altLandmarks?.[1];
      if (lmIdx != null && lm[lmIdx]) {
        position = { x: lm[lmIdx].x, y: lm[lmIdx].y };
      }
    }

    return {
      ...joint,
      landmarks: joint.landmarks,
      angle: angle ?? null,
      state: state ?? "ACCEPTABLE",
      position,
    };
  });
}

export default function UploadPlaybackScreen({ session, onDone, onBack }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const [playing, setPlaying]     = useState(false);
  const [progress, setProgress]   = useState(0);
  const [duration, setDuration]   = useState(0);
  const [currentFrame, setCurrentFrame] = useState(null);

  const { videoUrl, comparisonResults, poseFrames, blueprint } = session;

  const renderFrame = useCallback((currentTimeMs) => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    canvas.width  = video.videoWidth  || canvas.offsetWidth;
    canvas.height = video.videoHeight || canvas.offsetHeight;

    clearCanvas(ctx, canvas.width, canvas.height);

    const frame = getFrameAtTime(comparisonResults, currentTimeMs);
    if (!frame || frame.phase === "unknown") return;

    setCurrentFrame(frame);

    const frameIndex = frame.index;
    const poseFrame  = poseFrames[frameIndex];
    if (!poseFrame?.landmarks) return;

    const jointResults = buildJointResultsFromComparison(frame, blueprint, poseFrame);

    // 1. Ghost skeleton (gold, ideal reference)
    drawGhostSkeleton(ctx, poseFrame.landmarks, canvas.width, canvas.height);

    // 2. Live skeleton colored by joint states
    drawSkeleton(ctx, poseFrame.landmarks, jointResults, canvas.width, canvas.height);
  }, [comparisonResults, poseFrames, blueprint]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const currentMs = video.currentTime * 1000;
    setProgress(video.currentTime);
    renderFrame(currentMs);
  }, [renderFrame]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onMeta = () => setDuration(video.duration);
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", () => setPlaying(false));
    return () => {
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", () => setPlaying(false));
    };
  }, [handleTimeUpdate]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) { video.pause(); setPlaying(false); }
    else { video.play(); setPlaying(true); }
  };

  const restart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play();
    setPlaying(true);
  };

  const handleScrub = (e) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const pct = parseFloat(e.target.value);
    video.currentTime = pct;
    setProgress(pct);
    renderFrame(pct * 1000);
  };

  const phase = currentFrame?.phase;
  const worstState = currentFrame
    ? Object.values(currentFrame.jointStates).filter(Boolean).reduce((worst, s) => {
        const order = ["DANGER", "WARNING", "ACCEPTABLE", "OPTIMAL"];
        return order.indexOf(s) < order.indexOf(worst) ? s : worst;
      }, "OPTIMAL")
    : null;

  const stateColor = worstState ? STATE_COLORS[worstState] : "#C9A84C";

  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 z-50 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0">
        <button onClick={onBack} className="p-2 rounded-full bg-white/10 backdrop-blur-md">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[#C9A84C] text-xs font-bold tracking-[0.2em] uppercase" style={{ fontFamily: "'DM Mono', monospace" }}>
            {session.exerciseName || "Analysis"}
          </span>
          {phase && (
            <span className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
              {phase.replace(/_/g, " ")}
            </span>
          )}
        </div>
        {worstState && (
          <div
            className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider"
            style={{ background: `${stateColor}20`, color: stateColor, border: `1px solid ${stateColor}40`, fontFamily: "'DM Mono', monospace" }}
          >
            {worstState}
          </div>
        )}
      </div>

      {/* Video + Overlay */}
      <div className="relative flex-1 bg-black">
        {/* z-index 1: video */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="absolute inset-0 w-full h-full object-contain"
          playsInline
          muted
          style={{ zIndex: 1 }}
        />
        {/* z-index 2: canvas overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{ zIndex: 2 }}
        />
      </div>

      {/* Controls — z-index 3 */}
      <div className="relative bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-white/5 px-4 pt-3 pb-6" style={{ zIndex: 3 }}>
        {/* Scrub bar */}
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.01}
          value={progress}
          onChange={handleScrub}
          className="w-full h-1 rounded-full appearance-none bg-white/10 cursor-pointer mb-4"
          style={{
            background: `linear-gradient(to right, #C9A84C ${(progress / (duration || 1)) * 100}%, rgba(255,255,255,0.1) 0%)`,
          }}
        />

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <button onClick={restart} className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <RotateCcw className="w-5 h-5 text-white/60" />
          </button>
          <button
            onClick={togglePlay}
            className="p-4 rounded-full bg-[#C9A84C] hover:bg-[#b8943f] transition-colors shadow-[0_0_20px_rgba(201,168,76,0.3)]"
          >
            {playing
              ? <Pause className="w-6 h-6 text-black" />
              : <Play  className="w-6 h-6 text-black ml-0.5" />
            }
          </button>
          <button
            onClick={onDone}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs font-bold tracking-wider hover:bg-white/10 transition-colors"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            REPORT
          </button>
        </div>

        {/* Joint states row */}
        {currentFrame && (
          <div className="flex gap-2 justify-center flex-wrap">
            {Object.entries(currentFrame.jointStates).map(([id, state]) => {
              if (!state) return null;
              const color = STATE_COLORS[state] || "#ffffff30";
              return (
                <div
                  key={id}
                  className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase"
                  style={{ background: `${color}15`, color, border: `1px solid ${color}30`, fontFamily: "'DM Mono', monospace" }}
                >
                  {id.replace(/_/g, " ")} {currentFrame.angles[id] != null ? `${Math.round(currentFrame.angles[id])}°` : ""}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}