import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Play, Pause } from "lucide-react";
import { MOTION_FRAMES, getInterpolatedFrame, resolveFrame } from "../components/bioneer/demo/motionModelData";
import MotionModelCanvas from "../components/bioneer/demo/MotionModelCanvas";
import PhaseCuePanel from "../components/bioneer/demo/PhaseCuePanel";
import FaultSimToggle from "../components/bioneer/demo/FaultSimToggle";
import TechniquePanel from "../components/bioneer/demo/TechniquePanel";
import { DEMO_ASSETS } from "../components/bioneer/demoAssets";
import { createPageUrl } from "@/utils";

// Tiny helper: auto-starts playback when embedded demo mounts
function AutoPlayTrigger({ onPlay }) {
  useEffect(() => { onPlay(); }, [onPlay]);
  return null;
}

export default function ProperFormDemo({ embedded = false }) {
  const params     = new URLSearchParams(window.location.search);
  const exerciseId = params.get("exercise") || "squat";

  const motionData = MOTION_FRAMES[exerciseId];
  const asset      = DEMO_ASSETS[exerciseId]; // technique text

  const [currentTimeMs, setCurrentTimeMs]   = useState(0);
  const [activeFault, setActiveFault]       = useState(null);
  const [isPlaying, setIsPlaying]           = useState(false);
  const [pulseT, setPulseT]                 = useState(0);

  const animRef    = useRef(null);
  const pulseRef   = useRef(null);
  const lastTickRef= useRef(null);

  // Playback loop
  const tick = useCallback(() => {
    const now = Date.now();
    const delta = lastTickRef.current ? now - lastTickRef.current : 16;
    lastTickRef.current = now;
    setCurrentTimeMs((prev) => {
      const totalMs = motionData.frames.length * motionData.frameIntervalMs;
      return (prev + delta) % totalMs;
    });
    animRef.current = requestAnimationFrame(tick);
  }, [motionData]);

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

  // Pulse loop (independent of playback)
  useEffect(() => {
    let start = null;
    function pulse(ts) {
      if (!start) start = ts;
      setPulseT(((ts - start) / 1200) % 1);
      pulseRef.current = requestAnimationFrame(pulse);
    }
    pulseRef.current = requestAnimationFrame(pulse);
    return () => { if (pulseRef.current) cancelAnimationFrame(pulseRef.current); };
  }, []);

  if (!motionData) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-white/40 text-sm">No demo available for <span className="text-white">{exerciseId}</span></p>
      </div>
    );
  }

  // Derive current frame — resolveFrame handles precomputed fault frames + offset fallback
  const baseFrame    = getInterpolatedFrame(motionData.frames, currentTimeMs, motionData.frameIntervalMs);
  const currentFrame = resolveFrame(motionData, currentTimeMs, activeFault);

  // Derive current phase config
  const currentPhaseId  = baseFrame?.phase;
  const phaseConfig     = motionData.phases.find(p => p.id === currentPhaseId);
  const highlightJoints = phaseConfig?.keyJoints ?? [];
  const faultJoints     = activeFault?.affectedJoints ?? [];

  const totalMs  = motionData.frames.length * motionData.frameIntervalMs;
  const displayName = motionData.frames[0] ? (exerciseId.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())) : exerciseId;

  const handleTrainNow = () => {
    const focusCue = activeFault ? activeFault.explanation : (asset?.techniqueText?.singleCue ?? phaseConfig?.cue ?? "");
    console.log("DEMO_TRAIN_NOW_PRESSED blueprint=", exerciseId, "cue=", focusCue);
    window.location.href = createPageUrl(`FormCheck?exercise=${exerciseId}`);
  };

  // Embedded mode: render just the motion model, no header/footer
  if (embedded) {
    return (
      <div className="bg-[#0A0A0A] text-white">
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <div className="relative w-full overflow-hidden bg-[#111]" style={{ aspectRatio: '4/3' }}>
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(201,168,76,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <MotionModelCanvas
            currentFrame={currentFrame}
            highlightJoints={activeFault ? [] : highlightJoints}
            faultJoints={faultJoints}
            pathOverlays={motionData.pathOverlays ?? []}
            pulseT={pulseT}
          />
          {currentPhaseId && (
            <div className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none" style={{ zIndex: 3 }}>
              <div className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-[#C9A84C]/30">
                <span className="text-[8px] font-bold text-[#C9A84C] uppercase tracking-[0.2em]" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {currentPhaseId.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          )}
          {/* Auto-play in embedded mode */}
          {!isPlaying && <AutoPlayTrigger onPlay={() => setIsPlaying(true)} />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center gap-3">
          <button onClick={() => window.history.back()} className="p-2 rounded-full hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-white tracking-wide" style={{ fontFamily: "'Syne', sans-serif" }}>
              {displayName}
            </h1>
          </div>
          <div className="px-2.5 py-1 rounded-full border border-[#C9A84C]/40 bg-[#C9A84C]/10">
            <span className="text-[9px] font-bold text-[#C9A84C] tracking-[0.2em] uppercase" style={{ fontFamily: "'DM Mono', monospace" }}>
              IDEAL FORM
            </span>
          </div>
        </div>
      </div>

      {/* Motion Model Visualizer */}
      <div className="max-w-lg mx-auto w-full px-4 pt-4">
        <div
          className="relative w-full rounded-2xl overflow-hidden border border-white/5 bg-[#111]"
          style={{ aspectRatio: "4/3" }}
        >
          {/* Grid background */}
          <div className="absolute inset-0" style={{ backgroundImage:"radial-gradient(circle, rgba(201,168,76,0.06) 1px, transparent 1px)", backgroundSize:"24px 24px" }} />

          {/* Motion Model Canvas — pointer-events none */}
          <MotionModelCanvas
            currentFrame={currentFrame}
            highlightJoints={activeFault ? [] : highlightJoints}
            faultJoints={faultJoints}
            pathOverlays={motionData.pathOverlays ?? []}
            pulseT={pulseT}
          />

          {/* Phase pill — top center */}
          {currentPhaseId && (
            <div className="absolute top-3 left-0 right-0 flex justify-center pointer-events-none" style={{ zIndex: 3 }}>
              <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[#C9A84C]/30">
                <span className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-[0.2em]" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {currentPhaseId.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          )}

          {/* Fault badge */}
          {activeFault && (
            <div className="absolute top-3 right-3 pointer-events-none" style={{ zIndex: 3 }}>
              <div className="px-2.5 py-1 rounded-full bg-[#EF4444]/20 border border-[#EF4444]/50">
                <span className="text-[9px] font-bold text-[#EF4444] tracking-wider uppercase" style={{ fontFamily: "'DM Mono', monospace" }}>FAULT</span>
              </div>
            </div>
          )}

          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(p => !p)}
            className="absolute bottom-3 left-3 p-2.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors"
            style={{ zIndex: 3 }}
          >
            {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
          </button>

          {/* Scrubber */}
          <div className="absolute bottom-3 left-14 right-3 flex items-center gap-2" style={{ zIndex: 3 }}>
            <input
              type="range"
              min={0}
              max={totalMs}
              value={currentTimeMs}
              onChange={(e) => { setIsPlaying(false); setCurrentTimeMs(Number(e.target.value)); }}
              className="flex-1 h-1 accent-[#C9A84C] cursor-pointer"
            />
            <span className="text-[9px] text-white/30 flex-shrink-0" style={{ fontFamily: "'DM Mono', monospace" }}>
              {(currentTimeMs / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-4 space-y-4 overflow-y-auto pb-32">

        {/* Phase cue panel */}
        <PhaseCuePanel
          phase={currentPhaseId}
          cue={activeFault ? activeFault.explanation : (phaseConfig?.cue ?? "")}
        />

        {/* Fault sim toggle */}
        <FaultSimToggle
          faults={motionData.faults ?? []}
          activeFault={activeFault}
          onChange={setActiveFault}
        />

        {/* Technique panel (if asset data exists) */}
        {asset?.techniqueText && (
          <>
            <div className="border-t border-white/5" />
            <TechniquePanel techniqueText={asset.techniqueText} />
          </>
        )}
      </div>

      {/* Train Now — fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/5 px-4 py-4 pb-6">
        <div className="max-w-lg mx-auto space-y-1.5">
          <p className="text-[9px] text-white/25 text-center tracking-widest uppercase" style={{ fontFamily: "'DM Mono', monospace" }}>
            Focus: {activeFault ? activeFault.explanation.split(".")[0] : (phaseConfig?.cue?.split(".")[0] ?? "—")}
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