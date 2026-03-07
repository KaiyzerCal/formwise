import React, { useRef, useEffect, useState, useCallback } from "react";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";

// Layer 2
import { normalizeLandmarks, frameConfidence } from "./pipeline/PoseNormalizer";
// Layer 3
import { StabilizationEngine } from "./pipeline/StabilizationEngine";
// Layer 4
import { RepDetector } from "./pipeline/RepDetector";
import { FaultDetector } from "./pipeline/FaultDetector";
// Layer 5
import { FeedbackScheduler } from "./pipeline/FeedbackScheduler";
import LiveFeedbackBanner from "./LiveFeedbackBanner";

// Existing engines (unchanged)
import { computeJointAngles, computeFormScore, calcAngle } from "./poseEngine";
import { clearCanvas, drawSkeleton, drawGhostSkeleton, generateGhostPose } from "./canvasRenderer";
import { initAudio, beep, destroyAudio } from "./audioEngine";
import { detectPhase } from "./phaseDetector";

// --- Canvas skeleton using named joints from stabilizer ---
const STATE_COLORS = {
  OPTIMAL:    "#22C55E",
  ACCEPTABLE: "#EAB308",
  WARNING:    "#F97316",
  DANGER:     "#EF4444",
};

// MediaPipe index order for raw landmark array used by existing drawSkeleton
const SKELETON_CONNECTIONS = [
  [11,12],[11,13],[13,15],[12,14],[14,16],
  [11,23],[12,24],[23,24],
  [23,25],[25,27],[24,26],[26,28],
];

const DANGER_FRAME_THRESHOLD = 8;

export default function CameraView({ exercise, onStop }) {
  const videoRef          = useRef(null);
  const canvasRef         = useRef(null);
  const poseRef           = useRef(null);
  const animFrameRef      = useRef(null);
  const startTimeRef      = useRef(Date.now());
  const mutedRef          = useRef(false);

  // Pipeline instances (stable across renders)
  const stabilizerRef     = useRef(new StabilizationEngine());
  const repDetectorRef    = useRef(new RepDetector(exercise.id));
  const faultDetectorRef  = useRef(new FaultDetector(exercise.id));
  const feedbackRef       = useRef(new FeedbackScheduler());

  // Session data
  const sessionDataRef    = useRef({ alerts: [], scores: [], peakScore: 0, lowestScore: 100, phaseData: {} });
  const dangerFramesRef   = useRef({});
  const prevLandmarksRef  = useRef(null);
  const bodyLostTimerRef  = useRef(null);
  const currentPhaseRef   = useRef(null);
  const jointDataRef      = useRef({});

  // UI state
  const [formScore,     setFormScore]     = useState(100);
  const [reps,          setReps]          = useState(0);
  const [statusMsg,     setStatusMsg]     = useState("Initializing camera...");
  const [statusColor,   setStatusColor]   = useState("#C9A84C");
  const [muted,         setMuted]         = useState(false);
  const [bodyVisible,   setBodyVisible]   = useState(true);
  const [cameraReady,   setCameraReady]   = useState(false);
  const [poseReady,     setPoseReady]     = useState(false);
  const [currentPhase,  setCurrentPhase]  = useState(null);
  const [activeCue,     setActiveCue]     = useState(null);
  const [confidence,    setConfidence]    = useState(0);
  const [showMotionPrompt, setShowMotionPrompt] = useState(exercise.cameraMode === "motion");

  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // Wire feedback scheduler → UI
  useEffect(() => {
    feedbackRef.current.onUIReady((cue) => {
      setActiveCue({ ...cue, tMs: Date.now() });
    });
  }, []);

  // --- Main init: camera + MediaPipe ---
  useEffect(() => {
    let stream    = null;
    let cancelled = false;

    async function init() {
      // Layer 1: Camera capture
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, min: 24 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          // Wait for metadata before play() to avoid race condition
          await new Promise((resolve) => {
            video.onloadedmetadata = resolve;
          });
          await video.play().catch(err => console.warn('[CameraView] play():', err));
          setCameraReady(true);
          setStatusMsg("Loading pose detection...");
        }
      } catch (err) {
        setStatusMsg("Camera access denied. Please allow camera.");
        console.error('[CameraView] getUserMedia:', err);
        return;
      }

      // Layer 2: MediaPipe pose
      try {
        const BASE = "https://unpkg.com/@mediapipe/pose@0.5.1675469404";
        await loadScript(`${BASE}/pose_solution_packed_assets_loader.js`);
        await loadScript(`${BASE}/pose_solution_simd_wasm_bin.js`);
        await loadScript(`${BASE}/pose.js`);
        if (cancelled) return;

        const pose = new window.Pose({
          locateFile: (file) => `${BASE}/${file}`,
        });
        pose.setOptions({
          modelComplexity:        1,
          smoothLandmarks:        false,  // Layer 3 handles smoothing
          enableSegmentation:     false,
          minDetectionConfidence: 0.6,
          minTrackingConfidence:  0.6,
        });
        pose.onResults((results) => { if (!cancelled) processResults(results); });
        await pose.initialize();
        if (cancelled) return;

        poseRef.current = pose;
        setPoseReady(true);
        setStatusMsg("FORM LOCKED IN");
        initAudio();

        // Reset pipeline for fresh session
        stabilizerRef.current.reset();
        feedbackRef.current.reset();

        function detect() {
          if (cancelled) return;
          if (videoRef.current && poseRef.current && videoRef.current.readyState >= 2) {
            poseRef.current.send({ image: videoRef.current });
          }
          animFrameRef.current = requestAnimationFrame(detect);
        }
        detect();
      } catch (err) {
        setStatusMsg("Failed to load pose detection: " + err.message);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (poseRef.current) { poseRef.current.close(); poseRef.current = null; }
      destroyAudio();
      if (bodyLostTimerRef.current) clearTimeout(bodyLostTimerRef.current);
    };
  }, []);

  const processResults = useCallback((results) => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    clearCanvas(ctx, canvas.width, canvas.height);

    if (!results.poseLandmarks) {
      if (bodyLostTimerRef.current === null) {
        bodyLostTimerRef.current = setTimeout(() => {
          setBodyVisible(false);
          setStatusMsg("Step back — full body not visible");
          setStatusColor("#EF4444");
        }, 2000);
      }
      return;
    }

    if (bodyLostTimerRef.current) { clearTimeout(bodyLostTimerRef.current); bodyLostTimerRef.current = null; }
    setBodyVisible(true);

    const tMs = performance.now();

    // --- Layer 2: Normalize landmarks ---
    const { joints: rawJoints, visibility } = normalizeLandmarks(results.poseLandmarks);
    const conf = frameConfidence(results.poseLandmarks);
    setConfidence(conf);

    // --- Layer 3: Stabilize ---
    const smoothedJoints = stabilizerRef.current.process(rawJoints, visibility, tMs);

    // --- Layer 4: Rep detection (named-joint space) ---
    const repEvent = repDetectorRef.current.ingest(smoothedJoints, tMs);
    const repState = repDetectorRef.current.getState();

    if (repEvent) {
      if (repEvent.type === 'REP_COMPLETE') {
        setReps(repDetectorRef.current.getCount());
      }
    }

    // --- Phase detection (existing phaseDetector, using raw landmarks for compat) ---
    const rawLms = results.poseLandmarks;
    const jointResults = computeJointAngles(rawLms, exercise);
    if (exercise.phases) {
      const newPhase = detectPhase(exercise.id, jointResults, currentPhaseRef.current);
      if (newPhase && newPhase !== currentPhaseRef.current) {
        currentPhaseRef.current = newPhase;
        setCurrentPhase(newPhase);
        if (!sessionDataRef.current.phaseData[newPhase])
          sessionDataRef.current.phaseData[newPhase] = { frames: 0, scores: [] };
      }
    }

    // --- Layer 4: Fault detection ---
    const faults = faultDetectorRef.current.evaluate(smoothedJoints, currentPhaseRef.current, tMs);

    // --- Layer 5: Feedback ---
    const phaseId  = currentPhaseRef.current;
    const phaseCue = exercise.phases?.find?.(p => p.id === phaseId)?.cue ?? null;
    feedbackRef.current.ingest(faults, phaseId, phaseCue, tMs);

    // --- Form score (existing engine, raw lms) ---
    const score = computeFormScore(jointResults);
    setFormScore(score);

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    sessionDataRef.current.scores.push({ time: elapsed, score });
    if (score > sessionDataRef.current.peakScore)   sessionDataRef.current.peakScore   = score;
    if (score < sessionDataRef.current.lowestScore) sessionDataRef.current.lowestScore = score;

    // Track per-phase data
    if (currentPhaseRef.current && sessionDataRef.current.phaseData[currentPhaseRef.current]) {
      sessionDataRef.current.phaseData[currentPhaseRef.current].frames++;
      sessionDataRef.current.phaseData[currentPhaseRef.current].scores.push(score);
    }

    // Track joint data for movement score
    for (const jr of jointResults) {
      if (jr.angle !== null && jr.label) {
        if (!jointDataRef.current[jr.label]) jointDataRef.current[jr.label] = { angles: [], optimalFrames: 0, totalFrames: 0 };
        jointDataRef.current[jr.label].angles.push(jr.angle);
        jointDataRef.current[jr.label].totalFrames++;
        if (jr.state === "OPTIMAL") jointDataRef.current[jr.label].optimalFrames++;
      }
    }

    // --- Danger frame tracking + audio ---
    for (const jr of jointResults) {
      const key = jr.label;
      if (jr.state === "DANGER") {
        dangerFramesRef.current[key] = (dangerFramesRef.current[key] || 0) + 1;
        if (dangerFramesRef.current[key] >= DANGER_FRAME_THRESHOLD) {
          beep(mutedRef.current);
          sessionDataRef.current.alerts.push({
            timestamp: parseFloat(elapsed.toFixed(1)),
            joint:     jr.name?.toLowerCase().replace(/\s/g, "_"),
            angle:     jr.angle,
          });
          dangerFramesRef.current[key] = 0;
        }
      } else {
        dangerFramesRef.current[key] = 0;
      }
    }

    // --- Draw skeleton (existing renderer — takes raw lms) ---
    const ghost = generateGhostPose(rawLms);
    if (ghost) drawGhostSkeleton(ctx, ghost, canvas.width, canvas.height);
    drawSkeleton(ctx, rawLms, jointResults, canvas.width, canvas.height);

    // Motion mode tracking box
    if (exercise.cameraMode === "motion") {
      const xs = rawLms.map(l => l.x), ys = rawLms.map(l => l.y);
      const pad = 0.05;
      ctx.strokeStyle = "rgba(201,168,76,0.5)";
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(
        (Math.min(...xs) - pad) * canvas.width,
        (Math.min(...ys) - pad) * canvas.height,
        (Math.max(...xs) - Math.min(...xs) + pad * 2) * canvas.width,
        (Math.max(...ys) - Math.min(...ys) + pad * 2) * canvas.height,
      );
      ctx.setLineDash([]);
    }

    // --- Status message from worst joint state ---
    let worstState = "OPTIMAL", worstJoint = "";
    const stateOrder = ["OPTIMAL", "ACCEPTABLE", "WARNING", "DANGER"];
    for (const jr of jointResults) {
      if (jr.state && stateOrder.indexOf(jr.state) > stateOrder.indexOf(worstState)) {
        worstState = jr.state; worstJoint = jr.name;
      }
    }
    const msgMap = {
      OPTIMAL:    { msg: "FORM LOCKED IN",           color: "#22C55E" },
      ACCEPTABLE: { msg: "MINOR ADJUSTMENT",         color: "#EAB308" },
      WARNING:    { msg: `CHECK YOUR ${worstJoint?.toUpperCase()}`, color: "#F97316" },
      DANGER:     { msg: "⚠ DANGER — CORRECT NOW",  color: "#EF4444" },
    };
    const st = msgMap[worstState];
    setStatusMsg(st.msg);
    setStatusColor(st.color);
  }, [exercise]);

  const handleStop = () => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const scores  = sessionDataRef.current.scores;
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((s, v) => s + v.score, 0) / scores.length)
      : 0;

    // Movement score
    const jd = jointDataRef.current;
    const jointKeys = Object.keys(jd);
    let accuracyScore = 0, consistencyScore = 0;
    if (jointKeys.length > 0) {
      const avgOptimal = jointKeys.reduce((s, k) => {
        const d = jd[k];
        return s + (d.totalFrames > 0 ? d.optimalFrames / d.totalFrames : 0);
      }, 0) / jointKeys.length;
      accuracyScore = avgOptimal * 60;
      const avgStd = jointKeys.reduce((s, k) => {
        const angles = jd[k].angles;
        if (angles.length < 2) return s;
        const mean = angles.reduce((a, b) => a + b, 0) / angles.length;
        const std  = Math.sqrt(angles.reduce((a, b) => a + (b - mean) ** 2, 0) / angles.length);
        return s + Math.min(std / 30, 1);
      }, 0) / jointKeys.length;
      consistencyScore = (1 - avgStd) * 25;
    }
    const dangerPenalty  = Math.min((sessionDataRef.current.alerts.length || 0) * 3, 15);
    const movementScore  = Math.round(Math.max(0, Math.min(100, accuracyScore + consistencyScore + (15 - dangerPenalty))));

    // Phase summary
    const phases = {};
    for (const [phase, data] of Object.entries(sessionDataRef.current.phaseData)) {
      phases[phase] = {
        frames:   data.frames,
        avgScore: data.scores.length > 0
          ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
          : 0,
      };
    }

    onStop({
      exercise_id:       exercise.id,
      category:          exercise.category || "strength",
      duration_seconds:  Math.round(elapsed),
      form_score_overall: avgScore,
      form_score_peak:   sessionDataRef.current.peakScore,
      form_score_lowest: sessionDataRef.current.lowestScore,
      movement_score:    movementScore,
      reps_detected:     repDetectorRef.current.getCount(),
      alerts:            sessionDataRef.current.alerts,
      form_timeline:     scores.filter((_, i) => i % 10 === 0),
      phases,
      feedback_history:  feedbackRef.current.getHistory(),
      joint_data:        jointDataRef.current,
      exercise_def:      exercise,
    });
  };

  // Confidence bar color
  const confColor = confidence > 0.75 ? "#22C55E" : confidence > 0.5 ? "#EAB308" : "#EF4444";

  return (
    <div className="fixed inset-0 z-40 bg-black">
      {/* Video feed — z:1 always below canvas */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 1 }}
      />

      {/* Canvas overlay — z:2, transparent background, pointer-events: none */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 2, pointerEvents: 'none', objectFit: 'cover' }}
      />

      {/* Confidence bar — 3px top edge */}
      <div
        style={{
          position:   'absolute', top: 0, left: 0, right: 0,
          height:     3, zIndex: 50, pointerEvents: 'none',
          backgroundColor: 'rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ width: `${Math.round(confidence * 100)}%`, height: '100%', backgroundColor: confColor, transition: 'width 200ms ease, background-color 300ms ease' }} />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={handleStop} className="p-2 rounded-full bg-white/10 backdrop-blur-md">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <span className="text-[#C9A84C] text-sm font-bold tracking-[0.2em] uppercase" style={{ fontFamily: "'DM Mono', monospace" }}>
          {exercise.name}
        </span>
        <div className="px-3 py-1.5 rounded-full backdrop-blur-md border" style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          borderColor: formScore >= 80 ? "#22C55E" : formScore >= 65 ? "#EAB308" : "#EF4444",
        }}>
          <span className="text-sm font-bold" style={{ fontFamily: "'DM Mono', monospace", color: formScore >= 80 ? "#22C55E" : formScore >= 65 ? "#EAB308" : "#EF4444" }}>
            {formScore}%
          </span>
        </div>
      </div>

      {/* Rep counter */}
      <div className="absolute top-16 left-4 z-50">
        <div className="px-3 py-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/10">
          <span className="text-[10px] text-white/40 uppercase tracking-widest block" style={{ fontFamily: "'DM Mono', monospace" }}>REPS</span>
          <span className="text-2xl font-bold text-white" style={{ fontFamily: "'DM Mono', monospace" }}>{reps}</span>
        </div>
      </div>

      {/* Mute button */}
      <div className="absolute top-16 right-4 z-50">
        <button onClick={() => { initAudio(); setMuted(m => !m); }} className="p-2.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
          {muted ? <VolumeX className="w-4 h-4 text-white/50" /> : <Volume2 className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Motion prompt */}
      {showMotionPrompt && (
        <div className="absolute inset-0 z-45 flex items-center justify-center" onClick={() => setShowMotionPrompt(false)}>
          <div className="px-6 py-4 rounded-xl bg-black/80 backdrop-blur-md border border-[#C9A84C]/30 text-center max-w-xs">
            <p className="text-[#C9A84C] text-sm font-medium mb-1">Move Freely</p>
            <p className="text-white/50 text-xs">Camera will track you as you move</p>
            <p className="text-white/25 text-[10px] mt-3">Tap to dismiss</p>
          </div>
        </div>
      )}

      {/* Phase badge */}
      {currentPhase && (
        <div className="absolute top-20 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[#C9A84C]/30">
            <span className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-[0.2em]" style={{ fontFamily: "'DM Mono', monospace" }}>
              {currentPhase.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      )}

      {/* Body not visible warning */}
      {!bodyVisible && (
        <div className="absolute inset-0 z-45 flex items-center justify-center">
          <div className="px-6 py-4 rounded-xl bg-black/70 backdrop-blur-md border border-[#EF4444]/30">
            <p className="text-[#EF4444] text-sm font-medium text-center">Step back — full body not visible</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {!poseReady && cameraReady && (
        <div className="absolute inset-0 z-45 flex items-center justify-center">
          <div className="px-6 py-4 rounded-xl bg-black/70 backdrop-blur-md border border-[#C9A84C]/30">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#C9A84C] text-sm">Loading pose detection...</p>
            </div>
          </div>
        </div>
      )}

      {/* Layer 5: Live feedback banner — pointer-events: none, slides up */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
        <LiveFeedbackBanner cue={activeCue} />
      </div>

      {/* Bottom panel */}
      <div className="absolute bottom-0 left-0 right-0 z-50">
        <div className="bg-white/[0.05] backdrop-blur-xl border-t border-white/10 px-4 py-5 pb-8">
          <div className="text-center mb-4">
            <span className="text-xs font-bold tracking-[0.25em] uppercase" style={{ fontFamily: "'DM Mono', monospace", color: statusColor }}>
              {statusMsg}
            </span>
          </div>
          <button onClick={handleStop} className="w-full py-3.5 rounded-xl bg-white/10 border border-white/10 text-white font-bold text-sm tracking-wider hover:bg-white/15 transition-colors" style={{ fontFamily: "'Syne', sans-serif" }}>
            STOP SESSION
          </button>
        </div>
      </div>
    </div>
  );
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { setTimeout(resolve, 100); return; }
    const s = document.createElement("script");
    s.src     = src;
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}