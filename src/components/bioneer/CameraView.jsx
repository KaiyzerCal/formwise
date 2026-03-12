/**
 * CameraView.jsx — Live Session Engine (rebuilt)
 * Uses modular hooks: useCameraStream, usePoseRuntime, usePoseInferenceLoop
 * Camera and pose are independent — pose failure never kills camera.
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { useCameraStream }       from './live/useCameraStream';
import { usePoseRuntime }        from './live/usePoseRuntime';
import { usePoseInferenceLoop }  from './live/usePoseInferenceLoop';
import SessionReadinessGate      from './live/SessionReadinessGate';
import LiveSessionHUD            from './live/LiveSessionHUD';
import PoseErrorCard             from './live/PoseErrorCard';
import CameraToggle              from './CameraToggle';
import { useLiveAnalysis }       from '../motion/hooks/useLiveAnalysis';
import { clearCanvas, drawSkeleton, drawGhostSkeleton, generateGhostPose } from './canvasRenderer';
import { smoothLandmarks, computeJointAngles, computeFormScore } from './poseEngine';
import { initAudio, destroyAudio, beep } from './audioEngine';
import { TemporalFilterEngine } from './pipeline/TemporalFilterEngine';
import { SystemHealthMonitor } from './pipeline/runtime/SystemHealthMonitor';
import JointIntelligenceRail from './live/JointIntelligenceRail';
import FormStabilityRing from './live/FormStabilityRing';

const GOLD = '#C9A84C';
const RED  = '#EF4444';

export default function CameraView({ exercise, onStop }) {
  const videoRef          = useRef(null);
  const canvasRef         = useRef(null);
  const prevLandmarksRef  = useRef(null);
  const startTimeRef      = useRef(Date.now());

  const [muted, setMuted]   = useState(false);
  const [poseResults, setPoseResults] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [liveJointResults, setLiveJointResults] = useState([]);
  const [liveFormScore, setLiveFormScore] = useState(100);

  // Camera facing mode — persisted to localStorage
  const [cameraFacing, setCameraFacing] = useState(() => {
    return localStorage.getItem('bioneer_camera_facing') || 'environment';
  });
  
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

  // Persist camera choice to localStorage
  const handleToggleCamera = useCallback(async () => {
    setIsSwitchingCamera(true);
    const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(newFacing);
    localStorage.setItem('bioneer_camera_facing', newFacing);
    // useCameraStream will re-run with new facingMode and restart stream
    setIsSwitchingCamera(false);
  }, [cameraFacing]);

  // Temporal filter engine — persists for the lifetime of this exercise session
  const temporalFilterRef = useRef(null);
  useEffect(() => {
    temporalFilterRef.current = new TemporalFilterEngine(exercise.category || 'strength');
    return () => temporalFilterRef.current?.reset();
  }, [exercise.id, exercise.category]);

  // System health monitor — passive watchdog
  const healthRef = useRef(null);
  useEffect(() => {
    healthRef.current = new SystemHealthMonitor();
    return () => healthRef.current?.destroy();
  }, []);

  // ── Camera ───────────────────────────────────────────────────────────────
  const { camState, camError } = useCameraStream(videoRef, cameraFacing);
  useEffect(() => { healthRef.current?.reportCamera(camState); }, [camState]);

  // ── Pose runtime ─────────────────────────────────────────────────────────
  const { poseState, phase, poseError, delegate, landmarkerRef, retry } = usePoseRuntime();
  useEffect(() => { healthRef.current?.reportPose(poseState); }, [poseState]);

  // ── Audio ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (poseState === 'ready') initAudio();
    return () => destroyAudio();
  }, [poseState]);

  // ── Analysis engine ───────────────────────────────────────────────────────
  const {
    frameState, frameRef, repCount, lockState, activeCue, statusMsg, statusColor,
    lastRepMastery, processFrame, updateJointResults, stopSession,
  } = useLiveAnalysis(exercise.id);

  // (beep hysteresis is now managed by TemporalFilterEngine.shouldBeep)

  // ── Inference loop ────────────────────────────────────────────────────────
  const handleResult = useCallback((result) => {
    setPoseResults(result);
    // FIX: Use performance.now() to match MediaPipe's timestamp domain
    processFrame(result, performance.now());
    // Feed health monitor
    healthRef.current?.reportPoseFrame();
    if (result._fps)     healthRef.current?.reportFPS(result._fps);
    if (result._frameMs) healthRef.current?.reportFrameMs(result._frameMs);

    // Canvas render
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = video.videoWidth  || canvas.offsetWidth;
    canvas.height = video.videoHeight || canvas.offsetHeight;
    clearCanvas(ctx, canvas.width, canvas.height);
    if (!result.poseLandmarks) return;

    const smoothed = smoothLandmarks(result.poseLandmarks, prevLandmarksRef.current);
    prevLandmarksRef.current = smoothed;

    // ── Build joint results from exercise definition (green/yellow/red + angle badges)
    const livePhase  = frameRef.current?.phase ?? null;
    const rawResults = exercise.joints?.length
      ? computeJointAngles(smoothed, exercise, livePhase)
      : [];

    // ── Temporal filtering: smooth angles + stabilize zone states + beep hysteresis
    const tNow      = performance.now();
    const poseConf  = frameRef.current?.confidence ?? 0.7;
    const temporal  = temporalFilterRef.current;
    const jointResults = temporal
      ? temporal.filter(rawResults, tNow, poseConf)
      : rawResults;

    // ── Beep: fires only on confirmed DANGER transitions (with hysteresis)
    if (!muted && temporal && temporal.shouldBeep(jointResults, tNow)) {
      beep(false);
    }

    // ── Update React state for HUD panels
    setLiveJointResults(jointResults);
    setLiveFormScore(computeFormScore(jointResults));
    // Feed joint results to orchestrator for mastery scoring
    updateJointResults(jointResults);

    const ghost = generateGhostPose(smoothed);
    if (ghost) drawGhostSkeleton(ctx, ghost, canvas.width, canvas.height);
    drawSkeleton(ctx, smoothed, jointResults, canvas.width, canvas.height);

    if (exercise.cameraMode === 'motion') {
      const xs = result.poseLandmarks.map(l => l.x);
      const ys = result.poseLandmarks.map(l => l.y);
      const pad = 0.05;
      ctx.strokeStyle = 'rgba(201,168,76,0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(
        (Math.min(...xs) - pad) * canvas.width,
        (Math.min(...ys) - pad) * canvas.height,
        (Math.max(...xs) - Math.min(...xs) + pad * 2) * canvas.width,
        (Math.max(...ys) - Math.min(...ys) + pad * 2) * canvas.height
      );
      ctx.setLineDash([]);
    }
  }, [exercise.cameraMode, exercise.joints, processFrame, muted]);

  usePoseInferenceLoop({
    videoRef, landmarkerRef,
    poseState,
    active: camState === 'active' && poseState === 'ready',
    onResult: handleResult,
  });

  // ── Readiness gate ────────────────────────────────────────────────────────
  const lm = poseResults?.poseLandmarks;
  // FIX: Stricter thresholds — require stable tracking before allowing analysis start
  const visibleJoints = lm ? lm.filter(p => p.visibility > 0.5).length : 0;
  const avgConf       = lm ? lm.reduce((s, p) => s + p.visibility, 0) / lm.length : 0;
  const bodyDetected  = visibleJoints >= 12;  // require 12+ joints visible for confidence
  const confOk        = avgConf >= 0.5;       // require 50% average confidence (was 0.25)

  const readinessChecks = [
    { label: 'Camera active',     ok: camState === 'active' },
    { label: 'Pose engine ready', ok: poseState === 'ready' },
    { label: 'Full body visible', ok: bodyDetected },
    { label: 'Confidence stable', ok: confOk },
  ];
  // All checks must pass for automatic readiness
  const allReady = readinessChecks.every(c => c.ok) && bodyDetected && confOk;

  useEffect(() => {
    if (allReady && !sessionActive) setSessionActive(true);
  }, [allReady, sessionActive]);

  // Manual override — let user force-start when pose is ready but body detection stalls
  const handleForceStart = useCallback(() => {
    if (poseState === 'ready') setSessionActive(true);
  }, [poseState]);

  const guidance = !bodyDetected && poseState === 'ready'
    ? 'Ensure your full body is visible'
    : !confOk && bodyDetected
    ? 'Step back — improve lighting'
    : null;

  const formScore = liveFormScore;

  // ── Stop session ──────────────────────────────────────────────────────────
  const handleStop = useCallback(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const session = stopSession(); // full session object from SessionLogger.finalize()
    const summary = session?.summary;
    const reps = session?.reps ?? [];
    
    // Compute mastery-derived scores for this session
    const repScores = reps.map(r => r.score).filter(s => s != null);
    const avgMasteryScore = repScores.length
      ? Math.round(repScores.reduce((a, b) => a + b, 0) / repScores.length)
      : Math.round(formScore);
    const peakMasteryScore = repScores.length
      ? Math.max(...repScores)
      : Math.round(formScore);
    const lowestMasteryScore = repScores.length
      ? Math.min(...repScores)
      : Math.round(formScore);

    onStop({
      exercise_id:        exercise.id,
      category:           exercise.category || 'strength',
      duration_seconds:   Math.round(elapsed),
      form_score_overall: avgMasteryScore,
      form_score_peak:    peakMasteryScore,
      form_score_lowest:  lowestMasteryScore,
      movement_score:     avgMasteryScore,
      reps_detected:      repCount,
      alerts:             session?.faultLog      ?? [],
      form_timeline:      summary?.formTimeline  ?? [],
      phases:             summary?.phases        ?? {},
      reps:               reps,
      // Additional fields for analytics
      exercise_def:       exercise,
      joint_data:         {},
    });
  }, [stopSession, repCount, formScore, onStop, exercise]);

  // ── Cleanup on unmount or phase change ───────────────────────────────────────
  useEffect(() => {
    return () => {
      // Hard reset all pipeline engines to prevent stale state leakage
      if (temporalFilterRef.current) temporalFilterRef.current.reset();
      if (healthRef.current) healthRef.current.destroy();
      // Cleanup inference loop is handled by usePoseInferenceLoop
      // Audio cleanup is already in the audio effect above
    };
  }, []);

  // On stop, reset session to prevent leftover state from corrupting next session
  useEffect(() => {
    return () => {
      if (sessionActive) {
        // Session was active — cleanup orchestrator on unmount
        // (useLiveAnalysis handles this via the exerciseId dependency)
      }
    };
  }, [sessionActive]);

  return (
    <div className="fixed inset-0 z-40 bg-black">

      {/* Video — mirror when using front camera */}
      <video ref={videoRef} playsInline muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none' }} />

      {/* Canvas — mirror when using front camera (including skeleton/annotations) */}
      <canvas ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none' }} />

      {/* ── Camera failed ──────────────────────────────────────────────────── */}
      {camState === 'failed' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.92)' }}>
          <div className="w-80 rounded-2xl border p-6 space-y-4 text-center"
            style={{ background: '#0c0c0c', borderColor: `${RED}40` }}>
            <p className="text-sm font-bold" style={{ color: RED, fontFamily: "'DM Mono', monospace" }}>
              Camera Unavailable
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Mono', monospace" }}>
              {camError}
            </p>
            <button onClick={handleStop}
              className="w-full py-3 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'white', fontFamily: "'DM Mono', monospace" }}>
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* ── Pose failed ────────────────────────────────────────────────────── */}
      {poseState === 'failed' && camState === 'active' && (
        <PoseErrorCard errorMsg={poseError} onRetry={retry} />
      )}

      {/* ── Readiness gate (only shown before session starts) ─────────────── */}
      {!sessionActive && poseState !== 'failed' && camState === 'active' && (
        <SessionReadinessGate
          checks={readinessChecks}
          guidance={guidance}
          onForceStart={handleForceStart}
        />
      )}

      {/* ── Loading overlay while pose initializing ───────────────────────── */}
      {poseState === 'initializing' && camState === 'active' && (
        <div className="absolute top-20 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-full border"
            style={{ background: 'rgba(0,0,0,0.75)', borderColor: `${GOLD}40`, backdropFilter: 'blur(8px)' }}>
            <div className="w-3 h-3 rounded-full border-2 animate-spin"
              style={{ borderColor: GOLD, borderTopColor: 'transparent' }} />
            <span className="text-[10px] tracking-widest uppercase"
              style={{ color: GOLD, fontFamily: "'DM Mono', monospace" }}>
              {phase || 'Initializing pose…'}
            </span>
          </div>
        </div>
      )}

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}>
        <button onClick={handleStop} className="p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <span className="text-sm font-bold tracking-[0.2em] uppercase"
          style={{ color: GOLD, fontFamily: "'DM Mono', monospace" }}>
          {exercise.displayName || exercise.name}
        </span>
        <div className="px-3 py-1.5 rounded-full border"
          style={{
            background: 'rgba(0,0,0,0.5)',
            borderColor: formScore >= 80 ? '#22C55E' : formScore >= 65 ? '#EAB308' : RED,
          }}>
          <span className="text-sm font-bold" style={{
            fontFamily: "'DM Mono', monospace",
            color: formScore >= 80 ? '#22C55E' : formScore >= 65 ? '#EAB308' : RED,
          }}>
            {formScore}%
          </span>
        </div>
      </div>

      {/* ── Rep counter ───────────────────────────────────────────────────── */}
      <div className="absolute top-16 left-4 z-50">
        <div className="px-3 py-2 rounded-xl border"
          style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
          <span className="text-[10px] text-white/40 uppercase tracking-widest block"
            style={{ fontFamily: "'DM Mono', monospace" }}>REPS</span>
          <span className="text-2xl font-bold text-white"
            style={{ fontFamily: "'DM Mono', monospace" }}>{repCount}</span>
        </div>
      </div>

      {/* ── Mute ─────────────────────────────────────────────────────────── */}
      <div className="absolute top-16 right-4 z-50">
        <button onClick={() => setMuted(m => !m)}
          className="p-2.5 rounded-full border"
          style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
          {muted
            ? <VolumeX className="w-4 h-4 text-white/50" />
            : <Volume2 className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* ── Rep Mastery Badge ────────────────────────────────────────────── */}
      {sessionActive && lastRepMastery && (() => {
        const { score, repNumber } = lastRepMastery;
        const color = score >= 90 ? '#C9A84C' : score >= 80 ? '#22C55E' : score >= 70 ? '#EAB308' : '#EF4444';
        return (
          <div className="absolute top-16 left-4 z-50">
            <div className="px-3 py-2 rounded-xl border"
              style={{ background: 'rgba(0,0,0,0.65)', borderColor: `${color}50`, backdropFilter: 'blur(8px)' }}>
              <span className="text-[8px] text-white/40 uppercase tracking-widest block"
                style={{ fontFamily: "'DM Mono', monospace" }}>REP {repNumber} MASTERY</span>
              <span className="text-xl font-bold tabular-nums"
                style={{ fontFamily: "'DM Mono', monospace", color }}>{score}</span>
            </div>
          </div>
        );
      })()}

      {/* ── Joint Intelligence Rail (left side) ─────────────────────────── */}
      {sessionActive && liveJointResults.length > 0 && (
        <JointIntelligenceRail jointResults={liveJointResults} />
      )}

      {/* ── Form Stability Ring (bottom center) ──────────────────────────── */}
      {sessionActive && (
        <div className="absolute bottom-28 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="px-3 py-2 rounded-xl border"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <FormStabilityRing score={formScore} />
          </div>
        </div>
      )}

      {/* ── HUD (only when session active) ───────────────────────────────── */}
      {sessionActive && (
        <LiveSessionHUD
          confidence={avgConf}
          visibleJoints={visibleJoints}
          startMs={startTimeRef.current}
          delegate={delegate}
        />
      )}

      {/* ── Movement State Indicator (top center) ────────────────────────── */}
      {sessionActive && (
        <div className="absolute top-16 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl border"
            style={{ background: 'rgba(0,0,0,0.7)', borderColor: `${GOLD}30`, backdropFilter: 'blur(10px)' }}>
            {frameState?.phase && (
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: GOLD, fontFamily: "'DM Mono', monospace" }}>
                {frameState.phase.replace(/_/g, ' ')}
              </span>
            )}
            {frameState?.phase && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>|</span>}
            <span className="text-[10px] uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Mono', monospace" }}>
              {avgConf > 0.7 ? 'HIGH CONF' : avgConf > 0.45 ? 'MED CONF' : 'LOW CONF'}
            </span>
          </div>
        </div>
      )}

      {/* ── Cue banner ────────────────────────────────────────────────────── */}
      {activeCue && sessionActive && (
        <div className="absolute top-32 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="px-4 py-2.5 rounded-xl border text-center max-w-xs"
            style={{ background: 'rgba(0,0,0,0.8)', borderColor: `${RED}40`, backdropFilter: 'blur(8px)' }}>
            <p className="text-sm font-bold tracking-wide uppercase"
              style={{ color: RED, fontFamily: "'DM Mono', monospace" }}>
              {activeCue.text}
            </p>
          </div>
        </div>
      )}

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-50">
        <div className="border-t px-4 py-5 pb-8"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="text-center mb-4">
            <span className="text-xs font-bold tracking-[0.25em] uppercase"
              style={{ fontFamily: "'DM Mono', monospace", color: statusColor }}>
              {statusMsg}
            </span>
          </div>
          <button onClick={handleStop}
            className="w-full py-3.5 rounded-xl border text-white font-bold text-sm tracking-wider transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)', fontFamily: "'DM Mono', monospace" }}>
            STOP SESSION
          </button>
        </div>
      </div>
    </div>
  );
}