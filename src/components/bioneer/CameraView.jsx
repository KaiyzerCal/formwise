import React, { useRef, useEffect, useState, useCallback } from "react";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import {
  smoothLandmarks,
  computeJointAngles,
  computeFormScore,
} from "./poseEngine";
import {
  clearCanvas,
  drawSkeleton,
  drawGhostSkeleton,
  generateGhostPose,
} from "./canvasRenderer";
import { initAudio, beep, destroyAudio } from "./audioEngine";
import { createRepCounter } from "./repCounter";
import { detectPhase } from "./phaseDetector";
import { LiveSessionOrchestrator } from "./LiveSessionOrchestrator";

const DANGER_FRAME_THRESHOLD = 8;

export default function CameraView({ exercise, onStop }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseRef = useRef(null);
  const prevLandmarksRef = useRef(null);
  const dangerFramesRef = useRef({});
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const repCounterRef = useRef(null);
  const orchestratorRef = useRef(null);
  const sessionDataRef = useRef({
    alerts: [],
    scores: [],
    peakScore: 0,
    lowestScore: 100,
  });

  const [formScore, setFormScore] = useState(100);
  const [reps, setReps] = useState(0);
  const [statusMsg, setStatusMsg] = useState("Initializing camera...");
  const [statusColor, setStatusColor] = useState("#C9A84C");
  const [muted, setMuted] = useState(false);
  const [bodyVisible, setBodyVisible] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [poseReady, setPoseReady] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [showMotionPrompt, setShowMotionPrompt] = useState(exercise.cameraMode === "motion");
  const [activeCueText, setActiveCueText] = useState(null);
  const [lockState, setLockState] = useState('SEARCHING');
  const bodyLostTimerRef = useRef(null);
  const mutedRef = useRef(false);
  const currentPhaseRef = useRef(null);
  const jointDataRef = useRef({});

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // Initialize rep counter (legacy) + orchestrator
  useEffect(() => {
    if (exercise.repAngle) {
      repCounterRef.current = createRepCounter(exercise.repAngle);
    }

    // Boot the new orchestrator
    const orch = new LiveSessionOrchestrator(exercise.id, 'local');
    orch.onRep = ({ repNumber }) => setReps(repNumber);
    orch.onCue = ({ text, severity }) => {
      setActiveCueText(text);
      setStatusMsg(text.toUpperCase());
      setStatusColor(severity === 'HIGH' ? '#EF4444' : severity === 'MODERATE' ? '#F97316' : '#EAB308');
      // Auto-clear cue text display after 15s
      clearTimeout(orch._cueTimer);
      orch._cueTimer = setTimeout(() => setActiveCueText(null), 15000);
    };
    orch.onLockState = (state) => {
      setLockState(state);
      if (state === 'LOST') {
        setBodyVisible(false);
        setStatusMsg("Step into frame");
        setStatusColor("#EF4444");
      } else if (state === 'LOCKED') {
        setBodyVisible(true);
      }
    };
    orchestratorRef.current = orch;

    return () => {
      if (orch._cueTimer) clearTimeout(orch._cueTimer);
    };
  }, [exercise]);

  // Load MediaPipe and start camera
  useEffect(() => {
    let stream = null;
    let cancelled = false;

    async function init() {
      // Start camera
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: 1280, height: 720 },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
          setStatusMsg("Loading pose detection...");
        }
      } catch (err) {
        setStatusMsg("Camera access denied. Please allow camera.");
        return;
      }

      // Load MediaPipe via CDN scripts
      try {
        const BASE = "https://unpkg.com/@mediapipe/pose@0.5.1675469404";

        // Preload the assets loader so locateFile override takes effect first
        await loadScript(`${BASE}/pose_solution_packed_assets_loader.js`);
        await loadScript(`${BASE}/pose_solution_simd_wasm_bin.js`);
        await loadScript(`${BASE}/pose.js`);
        if (cancelled) return;

        const pose = new window.Pose({
          locateFile: (file) => `${BASE}/${file}`,
        });

        pose.setOptions({
          modelComplexity:        1,
          smoothLandmarks:        false,  // CRITICAL: we apply our own superior smoothing
          enableSegmentation:     false,
          minDetectionConfidence: 0.65,
          minTrackingConfidence:  0.60,
        });

        pose.onResults((results) => {
          if (cancelled) return;
          processResults(results);
        });

        // Initialize the pose model (loads WASM + assets)
        await pose.initialize();
        if (cancelled) return;

        poseRef.current = pose;
        setPoseReady(true);
        setStatusMsg("FORM LOCKED IN");

        // Init audio
        initAudio();

        // Start detection loop
        function detect() {
          if (cancelled) return;
          if (videoRef.current && poseRef.current && videoRef.current.readyState >= 2) {
            poseRef.current.send({ image: videoRef.current });
          }
          animFrameRef.current = requestAnimationFrame(detect);
        }
        detect();
      } catch (err) {
        console.error("Pose init error:", err);
        setStatusMsg("Failed to load pose detection: " + err.message);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (poseRef.current) { poseRef.current.close(); poseRef.current = null; }
      destroyAudio();
      if (bodyLostTimerRef.current) clearTimeout(bodyLostTimerRef.current);
    };
  }, []);

  const processResults = useCallback(
    (results) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      clearCanvas(ctx, canvas.width, canvas.height);

      if (!results.poseLandmarks) {
        // No body detected
        if (bodyLostTimerRef.current === null) {
          bodyLostTimerRef.current = setTimeout(() => {
            setBodyVisible(false);
            setStatusMsg("Step back — full body not visible");
            setStatusColor("#EF4444");
          }, 2000);
        }
        return;
      }

      // Body found
      if (bodyLostTimerRef.current) {
        clearTimeout(bodyLostTimerRef.current);
        bodyLostTimerRef.current = null;
      }
      setBodyVisible(true);

      const raw = results.poseLandmarks;

      // ── NEW PIPELINE: Feed results to orchestrator ──────────────────────
      orchestratorRef.current?.processFrame(results, Date.now());

      // ── EXISTING: canvas rendering pipeline (unchanged) ─────────────────
      const smoothed = smoothLandmarks(raw, prevLandmarksRef.current);
      prevLandmarksRef.current = smoothed;

      const ghost = generateGhostPose(smoothed);
      if (ghost) drawGhostSkeleton(ctx, ghost, canvas.width, canvas.height);

      const jointResults = computeJointAngles(smoothed, exercise);
      drawSkeleton(ctx, smoothed, jointResults, canvas.width, canvas.height);

      const score = computeFormScore(jointResults);
      setFormScore(score);

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      sessionDataRef.current.scores.push({ time: elapsed, score });
      if (score > sessionDataRef.current.peakScore) sessionDataRef.current.peakScore = score;
      if (score < sessionDataRef.current.lowestScore) sessionDataRef.current.lowestScore = score;

      // Legacy rep counter (fallback)
      if (repCounterRef.current && exercise.repAngle) {
        const primaryJoint = jointResults[exercise.repAngle.jointIndex];
        if (primaryJoint && primaryJoint.angle !== null) {
          repCounterRef.current.update(primaryJoint.angle);
        }
      }

      // Phase display (orchestrator-driven for supported movements, legacy fallback)
      const orchPhase = orchestratorRef.current?.lastPhaseId;
      if (orchPhase && orchPhase !== currentPhaseRef.current) {
        currentPhaseRef.current = orchPhase;
        setCurrentPhase(orchPhase);
      } else if (exercise.phases && !orchPhase) {
        const newPhase = detectPhase(exercise.id, jointResults, currentPhaseRef.current);
        if (newPhase && newPhase !== currentPhaseRef.current) {
          currentPhaseRef.current = newPhase;
          setCurrentPhase(newPhase);
        }
      }

      // Track joint data for session summary
      for (const jr of jointResults) {
        if (jr.angle !== null && jr.label) {
          if (!jointDataRef.current[jr.label]) jointDataRef.current[jr.label] = { angles: [], optimalFrames: 0, totalFrames: 0 };
          jointDataRef.current[jr.label].angles.push(jr.angle);
          jointDataRef.current[jr.label].totalFrames++;
          if (jr.state === "OPTIMAL") jointDataRef.current[jr.label].optimalFrames++;
        }
      }
      if (exercise.phases && currentPhaseRef.current) {
        if (!sessionDataRef.current.phaseData) sessionDataRef.current.phaseData = {};
        if (!sessionDataRef.current.phaseData[currentPhaseRef.current]) {
          sessionDataRef.current.phaseData[currentPhaseRef.current] = { frames: 0, scores: [] };
        }
        sessionDataRef.current.phaseData[currentPhaseRef.current].frames++;
        sessionDataRef.current.phaseData[currentPhaseRef.current].scores.push(score);
      }

      // Motion mode: subject tracking box
      if (exercise.cameraMode === "motion") {
        const xs = raw.map(l => l.x);
        const ys = raw.map(l => l.y);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const pad = 0.05;
        ctx.strokeStyle = "rgba(201,168,76,0.5)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(
          (minX - pad) * canvas.width,
          (minY - pad) * canvas.height,
          (maxX - minX + pad * 2) * canvas.width,
          (maxY - minY + pad * 2) * canvas.height
        );
        ctx.setLineDash([]);
      }

      // Worst-state status (only update if no active orchestrator cue)
      const hasActiveCue = !!orchestratorRef.current?.scheduler?.getActiveCue();
      if (!hasActiveCue) {
        let worstState = "OPTIMAL";
        let worstJoint = "";
        const stateOrder = ["OPTIMAL", "ACCEPTABLE", "WARNING", "DANGER"];
        for (const jr of jointResults) {
          if (jr.state && stateOrder.indexOf(jr.state) > stateOrder.indexOf(worstState)) {
            worstState = jr.state;
            worstJoint = jr.name;
          }
        }

        // Danger frame tracking & audio
        for (const jr of jointResults) {
          const key = jr.label;
          if (jr.state === "DANGER") {
            dangerFramesRef.current[key] = (dangerFramesRef.current[key] || 0) + 1;
            if (dangerFramesRef.current[key] >= DANGER_FRAME_THRESHOLD) {
              beep(mutedRef.current);
              sessionDataRef.current.alerts.push({
                timestamp: parseFloat(elapsed.toFixed(1)),
                joint: jr.name.toLowerCase().replace(/\s/g, "_"),
                angle: jr.angle,
              });
              dangerFramesRef.current[key] = 0;
            }
          } else {
            dangerFramesRef.current[key] = 0;
          }
        }

        const msgMap = {
          OPTIMAL:    { msg: "FORM LOCKED IN",          color: "#22C55E" },
          ACCEPTABLE: { msg: "MINOR ADJUSTMENT",        color: "#EAB308" },
          WARNING:    { msg: `CHECK YOUR ${worstJoint.toUpperCase()}`, color: "#F97316" },
          DANGER:     { msg: "⚠ DANGER — CORRECT NOW",  color: "#EF4444" },
        };
        const status = msgMap[worstState];
        setStatusMsg(status.msg);
        setStatusColor(status.color);
      }
    },
    [exercise]
  );

  const handleStop = () => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const scores = sessionDataRef.current.scores;
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((s, v) => s + v.score, 0) / scores.length)
        : 0;

    // Compute movement score
    const jd = jointDataRef.current;
    const jointKeys = Object.keys(jd);
    let accuracyScore = 0;
    let consistencyScore = 0;
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
        const std = Math.sqrt(angles.reduce((a, b) => a + (b - mean) ** 2, 0) / angles.length);
        return s + Math.min(std / 30, 1); // normalize std
      }, 0) / jointKeys.length;
      consistencyScore = (1 - avgStd) * 25;
    }
    const dangerPenalty = Math.min((sessionDataRef.current.alerts.length || 0) * 3, 15);
    const safetyScore = 15 - dangerPenalty;
    const movementScore = Math.round(Math.max(0, Math.min(100, accuracyScore + consistencyScore + safetyScore)));

    // Build phase summary
    const phases = {};
    const pd = sessionDataRef.current.phaseData || {};
    for (const [phase, data] of Object.entries(pd)) {
      const avg = data.scores.length > 0
        ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
        : 0;
      phases[phase] = { frames: data.frames, avgScore: avg };
    }

    onStop({
      exercise_id: exercise.id,
      category: exercise.category || "strength",
      duration_seconds: Math.round(elapsed),
      form_score_overall: avgScore,
      form_score_peak: sessionDataRef.current.peakScore,
      form_score_lowest: sessionDataRef.current.lowestScore,
      movement_score: movementScore,
      reps_detected: repCounterRef.current ? repCounterRef.current.getCount() : reps,
      alerts: sessionDataRef.current.alerts,
      form_timeline: scores.filter((_, i) => i % 10 === 0),
      phases,
      joint_data: jd,
      exercise_def: exercise, // pass along for coaching
    });
  };

  return (
    <div className="fixed inset-0 z-40 bg-black">
      {/* Video feed */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Canvas overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={handleStop} className="p-2 rounded-full bg-white/10 backdrop-blur-md">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        <span
          className="text-[#C9A84C] text-sm font-bold tracking-[0.2em] uppercase"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {exercise.name}
        </span>

        <div
          className="px-3 py-1.5 rounded-full backdrop-blur-md border"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            borderColor: formScore >= 80 ? "#22C55E" : formScore >= 65 ? "#EAB308" : "#EF4444",
          }}
        >
          <span
            className="text-sm font-bold"
            style={{
              fontFamily: "'DM Mono', monospace",
              color: formScore >= 80 ? "#22C55E" : formScore >= 65 ? "#EAB308" : "#EF4444",
            }}
          >
            {formScore}%
          </span>
        </div>
      </div>

      {/* Rep counter */}
      <div className="absolute top-16 left-4 z-50">
        <div className="px-3 py-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/10">
          <span className="text-[10px] text-white/40 uppercase tracking-widest block" style={{ fontFamily: "'DM Mono', monospace" }}>
            REPS
          </span>
          <span className="text-2xl font-bold text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
            {reps}
          </span>
        </div>
      </div>

      {/* Mute button */}
      <div className="absolute top-16 right-4 z-50">
        <button
          onClick={() => { initAudio(); setMuted(!muted); }}
          className="p-2.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10"
        >
          {muted ? (
            <VolumeX className="w-4 h-4 text-white/50" />
          ) : (
            <Volume2 className="w-4 h-4 text-white" />
          )}
        </button>
      </div>

      {/* Motion mode prompt */}
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
          <div
            className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[#C9A84C]/30"
            style={{ animation: "fadein 0.12s ease" }}
          >
            <span
              className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-[0.2em]"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {currentPhase.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      )}

      {/* Body not visible warning */}
      {!bodyVisible && (
        <div className="absolute inset-0 z-45 flex items-center justify-center">
          <div className="px-6 py-4 rounded-xl bg-black/70 backdrop-blur-md border border-[#EF4444]/30">
            <p className="text-[#EF4444] text-sm font-medium text-center">
              Step back — full body not visible
            </p>
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

      {/* Bottom panel */}
      <div className="absolute bottom-0 left-0 right-0 z-50">
        <div className="bg-white/[0.05] backdrop-blur-xl border-t border-white/10 px-4 py-5 pb-8">
          {/* Status message */}
          <div className="text-center mb-4">
            <span
              className="text-xs font-bold tracking-[0.25em] uppercase"
              style={{ fontFamily: "'DM Mono', monospace", color: statusColor }}
            >
              {statusMsg}
            </span>
          </div>

          {/* Stop button */}
          <button
            onClick={handleStop}
            className="w-full py-3.5 rounded-xl bg-white/10 border border-white/10 text-white font-bold text-sm tracking-wider hover:bg-white/15 transition-colors"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            STOP SESSION
          </button>
        </div>
      </div>
    </div>
  );
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      // Already loaded — wait a tick to ensure module is ready
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