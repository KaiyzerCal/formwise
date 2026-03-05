import React, { useEffect, useRef, useState } from "react";
import {
  extractFrames,
  analyzeFrames,
  computeFrameAngles,
  tagFramePhases,
  classifyMovement,
  scoreSession,
  getMovementById,
} from "./videoAnalysisEngine";

const BASE = "https://unpkg.com/@mediapipe/pose@0.5.1675469404";

async function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      setTimeout(resolve, 100);
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function getPoseDetector() {
  await loadScript(`${BASE}/pose_solution_packed_assets_loader.js`);
  await loadScript(`${BASE}/pose_solution_simd_wasm_bin.js`);
  await loadScript(`${BASE}/pose.js`);

  const pose = new window.Pose({
    locateFile: (file) => `${BASE}/${file}`,
  });
  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: false,
    enableSegmentation: false,
    minDetectionConfidence: 0.55,
    minTrackingConfidence: 0.5,
  });
  await pose.initialize();
  return pose;
}

export default function VideoAnalyzingScreen({ videoFile, onComplete, onBack }) {
  const [stage, setStage] = useState("extracting"); // extracting | detecting | scoring | done
  const [progress, setProgress] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    runAnalysis();
    return () => { cancelled.current = true; };
  }, []);

  async function runAnalysis() {
    try {
      // 1. Extract frames
      setStage("extracting");
      const { frames, duration } = await extractFrames(videoFile, 10, (p) => {
        if (!cancelled.current) setProgress(p);
      });
      if (cancelled.current) return;
      setFrameCount(frames.length);

      // 2. Load pose detector
      setStage("detecting");
      setProgress(0);
      const pose = await getPoseDetector();
      if (cancelled.current) { pose.close(); return; }

      // 3. Run inference on each frame sequentially
      const rawResults = await analyzeFrames(frames, pose, (p) => {
        if (!cancelled.current) setProgress(p);
      });
      pose.close();
      if (cancelled.current) return;

      // 4. Classify movement
      setStage("scoring");

      // Attach rough joint angles for classification
      const tempProtocol = null;
      const withAngles = computeFrameAngles(rawResults, tempProtocol);
      const exerciseId = classifyMovement(withAngles);
      const protocol = getMovementById(exerciseId);

      // 5. Compute full angles with protocol
      const framesWithAngles = computeFrameAngles(rawResults, protocol);
      const framesWithPhases = tagFramePhases(framesWithAngles, protocol);

      // 6. Score
      const { overallScore, jointScores, riskFlag } = scoreSession(framesWithPhases, protocol);

      if (cancelled.current) return;

      onComplete({
        frameResults: framesWithPhases,
        exerciseId,
        protocol,
        overallScore,
        jointScores,
        riskFlag,
        duration,
        frameCount: frames.length,
      });
    } catch (err) {
      console.error("Analysis error:", err);
    }
  }

  const stageLabels = {
    extracting: "Extracting frames",
    detecting: "Running pose detection",
    scoring: "Scoring form",
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-6">
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <div className="max-w-sm w-full text-center space-y-8">
        {/* Spinner */}
        <div className="flex justify-center">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-2 border-white/5" />
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#C9A84C] animate-spin"
              style={{ animationDuration: "1.2s" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-lg font-bold text-[#C9A84C]"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {Math.round(progress * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Stage label */}
        <div>
          <p
            className="text-sm font-bold tracking-[0.2em] text-white uppercase"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {stageLabels[stage] || "Analyzing..."}
          </p>
          {frameCount > 0 && (
            <p
              className="text-[10px] text-white/30 mt-2 tracking-widest"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {frameCount} frames extracted
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#C9A84C] transition-all duration-300"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        <button
          onClick={onBack}
          className="text-[10px] text-white/25 tracking-widest uppercase hover:text-white/50 transition-colors"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}