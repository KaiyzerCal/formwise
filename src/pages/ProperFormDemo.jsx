import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Play, Pause, Eye } from "lucide-react";
import { DEMO_ASSETS } from "../components/bioneer/demoAssets";
import DemoOverlayCanvas from "../components/bioneer/demo/DemoOverlayCanvas";
import FaultSimToggle from "../components/bioneer/demo/FaultSimToggle";
import TechniquePanel from "../components/bioneer/demo/TechniquePanel";
import { createPageUrl } from "@/utils";

// ─── Helpers ───────────────────────────────────────────────────────────────

function getFrameForTime(frames, currentMs, intervalMs) {
  const index = Math.min(
    Math.floor(currentMs / intervalMs),
    frames.length - 1
  );
  return frames[Math.max(0, index)];
}

function applyFaultSimulation(baseFrame, fault) {
  const frame = JSON.parse(JSON.stringify(baseFrame));
  if (fault.keypointOffsets) {
    for (const [joint, delta] of Object.entries(fault.keypointOffsets)) {
      if (frame.keypoints[joint]) {
        frame.keypoints[joint].x = (frame.keypoints[joint].x ?? 0) + (delta.x ?? 0);
        frame.keypoints[joint].y = (frame.keypoints[joint].y ?? 0) + (delta.y ?? 0);
      }
    }
  }
  if (fault.angleOffsets) {
    for (const [joint, offset] of Object.entries(fault.angleOffsets)) {
      if (frame.angles[joint] !== undefined) frame.angles[joint] += offset;
    }
  }
  frame.jointStates = { ...frame.jointStates, ...fault.resultingStates };
  return frame;
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function ProperFormDemo() {
  const params = new URLSearchParams(window.location.search);
  const exerciseId = params.get("exercise") || "squat";
  const asset = DEMO_ASSETS[exerciseId];

  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [activeFault, setActiveFault] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [containerSize, setContainerSize] = useState({ w: 400, h: 300 });

  const animRef = useRef(null);
  const lastTickRef = useRef(null);
  const containerRef = useRef(null);

  // Measure container for canvas sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setContainerSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Animation loop (simulates video playback through pose frames)
  const tick = useCallback(() => {
    const now = Date.now();
    const delta = lastTickRef.current ? now - lastTickRef.current : 16;
    lastTickRef.current = now;

    setCurrentTimeMs((prev) => {
      const totalMs = asset.idealPoseFrames.length * asset.frameIntervalMs;
      const next = (prev + delta) % totalMs;
      return next;
    });
    animRef.current = requestAnimationFrame(tick);
  }, [asset]);

  useEffect(() => {
    if (isPlaying) {
      lastTickRef.current = Date.now();
      animRef.current = requestAnimationFrame(tick);
    } else {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      lastTickRef.current = null;
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isPlaying, tick]);

  if (!asset) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-white/40 text-sm">No demo available for <span className="text-white">{exerciseId}</span></p>
          <button onClick={() => window.history.back()} className="text-[#C9A84C] text-xs underline">Go back</button>
        </div>
      </div>
    );
  }

  const baseFrame = getFrameForTime(asset.idealPoseFrames, currentTimeMs, asset.frameIntervalMs);
  const currentFrame = activeFault ? applyFaultSimulation(baseFrame, activeFault) : baseFrame;
  const totalMs = asset.idealPoseFrames.length * asset.frameIntervalMs;
  const progress = totalMs > 0 ? currentTimeMs / totalMs : 0;

  const handleTrainNow = () => {
    const focusCue = activeFault ? activeFault.explanation : asset.techniqueText.singleCue;
    console.log("DEMO_TRAIN_NOW_PRESSED blueprint=", asset.idealBlueprint, "cue=", focusCue);
    window.location.href = createPageUrl(`FormCheck?exercise=${exerciseId}`);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <div className="flex-1">
            <h1
              className="text-sm font-bold text-white tracking-wide"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {asset.displayName}
            </h1>
          </div>
          <div className="px-2.5 py-1 rounded-full border border-[#C9A84C]/40 bg-[#C9A84C]/10">
            <span
              className="text-[9px] font-bold text-[#C9A84C] tracking-[0.2em] uppercase"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              IDEAL FORM
            </span>
          </div>
        </div>
      </div>

      {/* ── Pose Visualizer (replaces video) ── */}
      <div className="max-w-lg mx-auto w-full px-4 pt-4">
        <div
          ref={containerRef}
          className="relative w-full rounded-2xl overflow-hidden border border-white/5 bg-[#111]"
          style={{ aspectRatio: "4/3" }}
        >
          {/* Background grid */}
          <div className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(201,168,76,0.06) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Overlay canvas */}
          <DemoOverlayCanvas
            currentFrame={currentFrame}
            width={containerSize.w}
            height={containerSize.h}
          />

          {/* Phase label */}
          {currentFrame?.phase && (
            <div className="absolute top-3 left-0 right-0 flex justify-center pointer-events-none" style={{ zIndex: 3 }}>
              <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[#C9A84C]/30">
                <span
                  className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-[0.2em]"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {currentFrame.phase.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          )}

          {/* Fault mode badge */}
          {activeFault && (
            <div className="absolute top-3 right-3 pointer-events-none" style={{ zIndex: 3 }}>
              <div className="px-2.5 py-1 rounded-full bg-[#EF4444]/20 border border-[#EF4444]/50">
                <span className="text-[9px] font-bold text-[#EF4444] tracking-wider uppercase"
                  style={{ fontFamily: "'DM Mono', monospace" }}>FAULT</span>
              </div>
            </div>
          )}

          {/* Play/Pause button */}
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="absolute bottom-3 left-3 p-2.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors"
            style={{ zIndex: 3 }}
          >
            {isPlaying
              ? <Pause className="w-4 h-4 text-white" />
              : <Play className="w-4 h-4 text-white" />
            }
          </button>

          {/* Scrubber */}
          <div className="absolute bottom-3 left-14 right-3 flex items-center gap-2" style={{ zIndex: 3 }}>
            <input
              type="range"
              min={0}
              max={totalMs}
              value={currentTimeMs}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentTimeMs(Number(e.target.value));
              }}
              className="flex-1 h-1 accent-[#C9A84C] cursor-pointer"
            />
            <span
              className="text-[9px] text-white/30 flex-shrink-0"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {(currentTimeMs / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-5 space-y-6 overflow-y-auto pb-32">

        {/* Fault Sim Toggle */}
        <FaultSimToggle
          faults={asset.faultSimulations}
          activeFault={activeFault}
          onChange={setActiveFault}
        />

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* Technique Panel */}
        <TechniquePanel techniqueText={asset.techniqueText} />
      </div>

      {/* ── Train Now CTA (fixed bottom) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/5 px-4 py-4 pb-6">
        <div className="max-w-lg mx-auto space-y-1.5">
          <p className="text-[9px] text-white/25 text-center tracking-widest uppercase"
             style={{ fontFamily: "'DM Mono', monospace" }}>
            Focus cue: {activeFault ? activeFault.explanation.split(".")[0] : asset.techniqueText.singleCue}
          </p>
          <button
            onClick={handleTrainNow}
            className="w-full py-4 rounded-xl bg-[#C9A84C] hover:bg-[#b8943f] text-black font-bold text-sm tracking-[0.2em] uppercase transition-colors shadow-[0_0_30px_rgba(201,168,76,0.25)]"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            TRAIN NOW
          </button>
        </div>
      </div>
    </div>
  );
}