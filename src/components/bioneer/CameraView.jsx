import React, { useRef, useEffect, useState, useCallback } from "react";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { useLiveAnalysis } from "../motion/hooks/useLiveAnalysis";
import {
  clearCanvas,
  drawSkeleton,
  drawGhostSkeleton,
  generateGhostPose,
} from "./canvasRenderer";
import { smoothLandmarks } from "./poseEngine";
import { initAudio, destroyAudio } from "./audioEngine";

export default function CameraView({ exercise, onStop }) {
  const videoRef        = useRef(null);
  const canvasRef       = useRef(null);
  const animFrameRef    = useRef(null);
  const startTimeRef    = useRef(Date.now());
  const prevLandmarksRef = useRef(null);
  const sessionScoresRef = useRef({ scores: [], alerts: [], peak: 100, lowest: 100 });

  const [cameraReady,  setCameraReady]  = useState(false);
  const [poseReady,    setPoseReady]    = useState(false);
  const [muted,        setMuted]        = useState(false);
  const [bodyVisible,  setBodyVisible]  = useState(true);
  const [showPrompt,   setShowPrompt]   = useState(exercise.cameraMode === "motion");

  const {
    frameState,
    repCount,
    lockState,
    activeCue,
    statusMsg,
    statusColor,
    processFrame,
    stopSession,
  } = useLiveAnalysis(exercise.id);

  // Derive a display form score from frameState confidence (0-100)
  const formScore = frameState
    ? Math.round((frameState.confidence ?? 1) * 100)
    : 100;

  // Sync body visibility from lockState
  useEffect(() => {
    setBodyVisible(lockState !== 'LOST');
  }, [lockState]);

  // Camera + MediaPipe bootstrap
  useEffect(() => {
    let stream = null;
    let cancelled = false;

    async function init() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: 1280, height: 720 },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch {
        return;
      }

      try {
        const { PoseLandmarker, FilesetResolver } = await import(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs"
        );
        if (cancelled) return;

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );

        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task",
            delegate: "GPU",
          },
          runningMode:                "VIDEO",
          numPoses:                   1,
          minPoseDetectionConfidence: 0.65,
          minPosePresenceConfidence:  0.60,
          minTrackingConfidence:      0.60,
          outputSegmentationMasks:    false,
        });

        if (cancelled) { landmarker.close(); return; }

        initAudio();
        setPoseReady(true);

        let lastVideoTime = -1;

        function detect() {
          if (cancelled) return;
          const video = videoRef.current;
          if (video && video.readyState >= 2 && video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;
            const result = landmarker.detectForVideo(video, performance.now());
            const payload = {
              poseLandmarks:      result.landmarks?.[0]      ?? null,
              poseWorldLandmarks: result.worldLandmarks?.[0] ?? null,
            };

            // Feed into engine
            processFrame(payload, Date.now());

            // Canvas rendering
            renderCanvas(payload);
          }
          animFrameRef.current = requestAnimationFrame(detect);
        }
        detect();
      } catch (err) {
        console.error("Pose init error:", err);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (stream) stream.getTracks().forEach(t => t.stop());
      destroyAudio();
    };
  }, []);

  const renderCanvas = useCallback((results) => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    clearCanvas(ctx, canvas.width, canvas.height);

    if (!results.poseLandmarks) return;

    const smoothed = smoothLandmarks(results.poseLandmarks, prevLandmarksRef.current);
    prevLandmarksRef.current = smoothed;

    const ghost = generateGhostPose(smoothed);
    if (ghost) drawGhostSkeleton(ctx, ghost, canvas.width, canvas.height);

    // Minimal skeleton draw — no scoring logic here
    drawSkeleton(ctx, smoothed, [], canvas.width, canvas.height);

    // Motion tracking box
    if (exercise.cameraMode === "motion") {
      const raw = results.poseLandmarks;
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
  }, [exercise.cameraMode]);

  const handleStop = () => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const summary = stopSession();
    onStop({
      exercise_id:        exercise.id,
      category:           exercise.category || "strength",
      duration_seconds:   Math.round(elapsed),
      form_score_overall: summary?.avgFormScore  ?? formScore,
      form_score_peak:    summary?.peakScore     ?? formScore,
      form_score_lowest:  summary?.lowestScore   ?? formScore,
      movement_score:     summary?.movementScore ?? 0,
      reps_detected:      repCount,
      alerts:             summary?.alerts        ?? [],
      form_timeline:      summary?.formTimeline  ?? [],
      phases:             summary?.phases        ?? {},
    });
  };

  return (
    <div className="fixed inset-0 z-40 bg-black">
      {/* Video */}
      <video ref={videoRef} playsInline muted
        className="absolute inset-0 w-full h-full object-cover" />

      {/* Canvas */}
      <canvas ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={handleStop} className="p-2 rounded-full bg-white/10 backdrop-blur-md">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <span className="text-[#C9A84C] text-sm font-bold tracking-[0.2em] uppercase"
          style={{ fontFamily: "'DM Mono', monospace" }}>
          {exercise.name}
        </span>
        <div className="px-3 py-1.5 rounded-full backdrop-blur-md border"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            borderColor: formScore >= 80 ? "#22C55E" : formScore >= 65 ? "#EAB308" : "#EF4444",
          }}>
          <span className="text-sm font-bold" style={{
            fontFamily: "'DM Mono', monospace",
            color: formScore >= 80 ? "#22C55E" : formScore >= 65 ? "#EAB308" : "#EF4444",
          }}>
            {formScore}%
          </span>
        </div>
      </div>

      {/* Rep counter */}
      <div className="absolute top-16 left-4 z-50">
        <div className="px-3 py-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/10">
          <span className="text-[10px] text-white/40 uppercase tracking-widest block"
            style={{ fontFamily: "'DM Mono', monospace" }}>REPS</span>
          <span className="text-2xl font-bold text-white"
            style={{ fontFamily: "'DM Mono', monospace" }}>{repCount}</span>
        </div>
      </div>

      {/* Mute */}
      <div className="absolute top-16 right-4 z-50">
        <button onClick={() => { initAudio(); setMuted(!muted); }}
          className="p-2.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
          {muted
            ? <VolumeX className="w-4 h-4 text-white/50" />
            : <Volume2 className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Motion mode prompt */}
      {showPrompt && (
        <div className="absolute inset-0 z-45 flex items-center justify-center"
          onClick={() => setShowPrompt(false)}>
          <div className="px-6 py-4 rounded-xl bg-black/80 backdrop-blur-md border border-[#C9A84C]/30 text-center max-w-xs">
            <p className="text-[#C9A84C] text-sm font-medium mb-1">Move Freely</p>
            <p className="text-white/50 text-xs">Camera will track you as you move</p>
            <p className="text-white/25 text-[10px] mt-3">Tap to dismiss</p>
          </div>
        </div>
      )}

      {/* Phase badge */}
      {frameState?.phase && (
        <div className="absolute top-20 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[#C9A84C]/30">
            <span className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-[0.2em]"
              style={{ fontFamily: "'DM Mono', monospace" }}>
              {frameState.phase.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      )}

      {/* Cue banner */}
      {activeCue && (
        <div className="absolute top-32 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="px-4 py-2.5 rounded-xl bg-black/80 backdrop-blur-md border border-[#EF4444]/40 text-center max-w-xs">
            <p className="text-[#EF4444] text-sm font-bold tracking-wide uppercase"
              style={{ fontFamily: "'DM Mono', monospace" }}>{activeCue.text}</p>
          </div>
        </div>
      )}

      {/* Body lost */}
      {!bodyVisible && (
        <div className="absolute inset-0 z-45 flex items-center justify-center">
          <div className="px-6 py-4 rounded-xl bg-black/70 backdrop-blur-md border border-[#EF4444]/30">
            <p className="text-[#EF4444] text-sm font-medium text-center">
              Step back — full body not visible
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
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
          <div className="text-center mb-4">
            <span className="text-xs font-bold tracking-[0.25em] uppercase"
              style={{ fontFamily: "'DM Mono', monospace", color: statusColor }}>
              {statusMsg}
            </span>
          </div>
          <button onClick={handleStop}
            className="w-full py-3.5 rounded-xl bg-white/10 border border-white/10 text-white font-bold text-sm tracking-wider hover:bg-white/15 transition-colors"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            STOP SESSION
          </button>
        </div>
      </div>
    </div>
  );
}