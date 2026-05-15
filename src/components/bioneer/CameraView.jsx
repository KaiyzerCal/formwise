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
import { useSessionRecorder }    from './session/useSessionRecorder';
import { useGeminiCoach }        from './ai/useGeminiCoach';
import SessionReadinessGate      from './live/SessionReadinessGate';
import LiveSessionHUD            from './live/LiveSessionHUD';
import PoseErrorCard             from './live/PoseErrorCard';
import CameraToggle              from './CameraToggle';
import { useLiveAnalysis }       from '../motion/hooks/useLiveAnalysis';
import { clearCanvas, drawSkeleton, drawGhostSkeleton, generateGhostPose } from './canvasRenderer';
import { smoothLandmarks, computeJointAngles, computeFormScore, setPoseCategory } from './poseEngine';
import { initAudio, destroyAudio, beep, speak } from './audioEngine';
import { detectFatigue } from './learning/FatigueDetector';
import { TemporalFilterEngine } from './pipeline/TemporalFilterEngine';
import { SystemHealthMonitor } from './pipeline/runtime/SystemHealthMonitor';
import JointIntelligenceRail from './live/JointIntelligenceRail';
import FormStabilityRing from './live/FormStabilityRing';
import { checkAndSavePR } from './analytics/PersonalRecordsPanel';
import confetti from 'canvas-confetti';

const GOLD = '#C9A84C';
const RED  = '#EF4444';

export default function CameraView({ exercise, onStop }) {
  const videoRef          = useRef(null);
  const canvasRef         = useRef(null);
  const prevLandmarksRef  = useRef(null);
  const startTimeRef      = useRef(Date.now());
  const sessionIdRef      = useRef(`formcheck-${Date.now()}`);

  const [muted, setMuted]   = useState(false);
  const [poseResults, setPoseResults] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [liveJointResults, setLiveJointResults] = useState([]);
  const [liveFormScore, setLiveFormScore] = useState(100);
  const [isSecure, setIsSecure] = useState(window.isSecureContext || false);
  const [geminiCue, setGeminiCue] = useState(null);
  const [checkInCue, setCheckInCue] = useState(null);
  const geminiCueShownAtRef = useRef(null);
  const lastGeminiCueTextRef = useRef(null);
  const prevRepCountRef = useRef(0);
  // Track recent form scores for fatigue detection
  const recentScoresRef = useRef([]);
  // Track fault history for check-in context
  const faultHistoryRef = useRef([]);
  // Live fatigue warning
  const [fatigueBannerDismissed, setFatigueBannerDismissed] = useState(false);
  const [showFatigueBanner, setShowFatigueBanner] = useState(false);
  const repScoresLiveRef = useRef([]);
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [prToast, setPrToast] = useState(null);

  // Camera facing mode — persisted to localStorage
  const [cameraFacing, setCameraFacing] = useState(() => {
    return localStorage.getItem('bioneer_camera_facing') || 'environment';
  });
  
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

  // ── Gemini coach ──────────────────────────────────────────────────────────
  const { getLiveCue, getCheckInCue, trackRep } = useGeminiCoach();

  // ── Session recorder ──────────────────────────────────────────────────────
  const {
    isRecording,
    startRecording,
    stopRecording,
    capturePoseFrame,
  } = useSessionRecorder(videoRef, canvasRef);

  // Temporal filter engine — persists for the lifetime of this exercise session
  const temporalFilterRef = useRef(null);
  useEffect(() => {
    temporalFilterRef.current = new TemporalFilterEngine(exercise.category || 'strength');
    // Sync EMA alpha to exercise category
    setPoseCategory(exercise.category || 'strength');
    return () => temporalFilterRef.current?.reset();
  }, [exercise.id, exercise.category]);

  // System health monitor — passive watchdog
  const healthRef = useRef(null);
  useEffect(() => {
    healthRef.current = new SystemHealthMonitor();
    return () => healthRef.current?.destroy();
  }, []);

  // ── Camera ───────────────────────────────────────────────────────────────
  const { camState, camError, isSwitching, switchCamera, streamRef } = useCameraStream(videoRef, cameraFacing);

  // Switch camera without reloading — use hook method directly
  const handleToggleCamera = useCallback(async () => {
    if (!isSecure) {
      alert('Camera requires HTTPS or localhost');
      return;
    }
    
    const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    const success = await switchCamera(newFacing);
    
    if (success) {
      setCameraFacing(newFacing);
      localStorage.setItem('bioneer_camera_facing', newFacing);
    }
    // If failed, error is shown in camError state via hook
  }, [cameraFacing, isSecure, switchCamera]);
  useEffect(() => { healthRef.current?.reportCamera(camState); }, [camState]);

  // Start recording as soon as camera canvas is active
  useEffect(() => {
    if (camState === 'active' && canvasRef?.current) {
      startRecording();
    }
  }, [camState]);

  // ── Pose runtime ─────────────────────────────────────────────────────────
  const { poseState, phase, poseError, delegate, delegateBadge, landmarkerRef, retry } = usePoseRuntime();
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
    // Capture pose frame for IndexedDB replay
    if (isRecording && result.poseLandmarks) {
      const angles = computeJointAngles(
        result.poseLandmarks,
        exercise,
        frameRef.current?.phase ?? null
      );
      const angleMap = {};
      for (const j of angles) {
        if (j.name && j.angle != null) angleMap[j.name] = j.angle;
      }
      capturePoseFrame(
        result.poseLandmarks,
        angleMap,
        result.poseLandmarks[0]?.visibility ?? 0
      );
    }
    // Feed health monitor
    healthRef.current?.reportPoseFrame();
    if (result._fps)     healthRef.current?.reportFPS(result._fps);
    if (result._frameMs) healthRef.current?.reportFrameMs(result._frameMs);

    // Canvas render — composite video + skeleton for recording
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = video.videoWidth  || canvas.offsetWidth;
    canvas.height = video.videoHeight || canvas.offsetHeight;
    // Draw video frame first so canvas.captureStream() records video+skeleton
    if (video.readyState >= 2) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } else {
      clearCanvas(ctx, canvas.width, canvas.height);
    }
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

  // ── Readiness gate — weighted visibility by exercise category ───────────
  const lm = poseResults?.poseLandmarks;
  const visibleJoints = lm ? lm.filter(p => p.visibility > 0.5).length : 0;
  const avgConf       = lm ? lm.reduce((s, p) => s + p.visibility, 0) / lm.length : 0;
  const confOk        = avgConf >= 0.5;

  // Weighted gate: check category-specific joints
  const UPPER_JOINTS   = [11, 12, 13, 14, 15, 16]; // shoulders, elbows, wrists
  const LOWER_JOINTS   = [23, 24, 25, 26, 27, 28]; // hips, knees, ankles
  const UPPER_CATS     = ['bench', 'ohp', 'push', 'pull'];
  const LOWER_CATS     = ['squat', 'deadlift', 'lunge', 'hinge'];
  const cat            = (exercise.category || exercise.id || '').toLowerCase();
  const isUpperFocus   = UPPER_CATS.some(k => cat.includes(k));
  const isLowerFocus   = LOWER_CATS.some(k => cat.includes(k));

  function jointsMissing(indices, threshold) {
    if (!lm) return indices;
    return indices.filter(i => !lm[i] || lm[i].visibility < threshold);
  }

  let bodyDetected = false;
  let guidance = null;

  if (lm) {
    if (isUpperFocus) {
      const missing = jointsMissing(UPPER_JOINTS, 0.6);
      bodyDetected = missing.length === 0;
      if (!bodyDetected) {
        const hasWrist = [15, 16].some(i => missing.includes(i));
        const hasElbow = [13, 14].some(i => missing.includes(i));
        guidance = hasWrist ? 'Step back — we can\'t see your hands'
          : hasElbow ? 'Move away from the wall — arm blocked'
          : 'Ensure upper body is fully visible';
      }
    } else if (isLowerFocus) {
      const missing = jointsMissing(LOWER_JOINTS, 0.6);
      bodyDetected = missing.length === 0;
      if (!bodyDetected) {
        const hasFeet = [27, 28].some(i => missing.includes(i));
        const hasKnee = [25, 26].some(i => missing.includes(i));
        guidance = hasFeet ? 'Step back — we can\'t see your feet'
          : hasKnee ? 'Step back — knees not visible'
          : 'Ensure lower body is fully visible';
      }
    } else {
      // Full body: 16+ joints > 0.5
      bodyDetected = visibleJoints >= 16;
      if (!bodyDetected) {
        const missing = jointsMissing(LOWER_JOINTS.slice(-2), 0.5); // ankles
        guidance = missing.length > 0 ? 'Step back — we can\'t see your feet'
          : 'Step back so your full body is visible';
      }
    }
    if (!guidance && !confOk) guidance = 'Step back — improve lighting';
  }

  const readinessChecks = [
    { label: 'Camera active',     ok: camState === 'active' },
    { label: 'Pose engine ready', ok: poseState === 'ready' },
    { label: 'Full body visible', ok: bodyDetected },
    { label: 'Confidence stable', ok: confOk },
  ];
  const allReady = readinessChecks.every(c => c.ok);

  useEffect(() => {
    if (allReady && !sessionActive) setSessionActive(true);
  }, [allReady, sessionActive]);

  const handleForceStart = useCallback(() => {
    if (poseState === 'ready') setSessionActive(true);
  }, [poseState]);

  const formScore = liveFormScore;

  // ── Track calibration state via repCount ─────────────────────────────────
  useEffect(() => {
    if (repCount >= 2) setIsCalibrating(false);
  }, [repCount]);

  // ── Stop session ──────────────────────────────────────────────────────────
  const handleStop = useCallback(async () => {
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

    // Finalize recording — wait for onstop to fire so all chunks are flushed
    const recorded    = await stopRecording();
    const videoBlob   = recorded?.videoBlob   ?? null;
    const poseFrames  = recorded?.poseFrames  ?? [];
    const angleFrames = recorded?.angleFrames ?? [];

    // ── PR check
    if (avgMasteryScore > 0) {
      const isNewPR = checkAndSavePR(exercise.id, avgMasteryScore);
      if (isNewPR) {
        setPrToast(`NEW PR — ${(exercise.displayName || exercise.name || exercise.id).toUpperCase()} ${avgMasteryScore}`);
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#C9A84C', '#fff', '#ffd700'] });
        setTimeout(() => setPrToast(null), 4000);
      }
    }

    onStop({
      exercise_id:        exercise.id,
      category:           exercise.category || 'strength',
      duration_seconds:   Math.round(elapsed),
      started_at:         new Date(startTimeRef.current).toISOString(),
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
      // Camera metadata for history tracking
      cameraFacing:       cameraFacing,
      // Recording data — passed to FormCheck for IndexedDB persistence
      sessionId:          sessionIdRef.current,
      videoBlob,
      poseFrames,
      angleFrames,
    });
  }, [stopSession, repCount, formScore, onStop, exercise, stopRecording, isRecording, capturePoseFrame]);

  // ── Gemini live cue: fire after each rep ─────────────────────────────────
  useEffect(() => {
    if (repCount <= prevRepCountRef.current) return;
    prevRepCountRef.current = repCount;
    trackRep();

    // Track recent scores for trend analysis
    recentScoresRef.current = [...recentScoresRef.current.slice(-4), liveFormScore];

    // Live fatigue detection (rep 6+)
    repScoresLiveRef.current = [...repScoresLiveRef.current, liveFormScore];
    if (repCount >= 6 && !fatigueBannerDismissed) {
      const last3 = repScoresLiveRef.current.slice(-3);
      if (last3.length === 3) {
        const decline = last3[0] - last3[2]; // drop over last 3 reps
        if (decline > 10) {
          const sessionElapsed = (Date.now() - startTimeRef.current) / 1000;
          const avgRepDuration = repScoresLiveRef.current.length > 0
            ? sessionElapsed / repScoresLiveRef.current.length
            : 2;

          const realMetrics = {
            allMetrics: repScoresLiveRef.current.map((s, i) => ({
              formScore: s,
              repDuration: avgRepDuration,
              kneeAngleMin: frameRef.current?.angles?.kneeL ?? 90,
              kneeAngleMax: frameRef.current?.angles?.kneeL
                ? frameRef.current.angles.kneeL + 70
                : 160,
              stabilityVariance: i > 0
                ? Math.abs(repScoresLiveRef.current[i] - repScoresLiveRef.current[i - 1])
                : 0,
            })),
          };
          const result = detectFatigue(realMetrics);
          if (result.severity === 'high' || result.severity === 'medium') {
            setShowFatigueBanner(true);
          }
        }
      }
    }

    // ── Check-in every 5 reps ────────────────────────────────────────────
    if (repCount > 0 && repCount % 5 === 0) {
      getCheckInCue({
        exerciseId: exercise.id,
        repNumber: repCount,
        recentScores: recentScoresRef.current,
        recurringFaults: faultHistoryRef.current.slice(-5),
      }).then(cue => {
        if (!cue) return;
        setCheckInCue(cue);
        speak(cue);
        setTimeout(() => setCheckInCue(null), 7000);
      });
      return; // don't also fire per-rep cue on check-in reps
    }

    // ── Per-rep fault cue ─────────────────────────────────────────────────
    const cueIsStale = !activeCue || (geminiCueShownAtRef.current && Date.now() - geminiCueShownAtRef.current > 4000);
    if (!cueIsStale) return;

    const faults = frameRef.current?.faults ?? [];
    if (!faults.length) return;

    // Track fault history
    faults.forEach(f => {
      const id = typeof f === 'string' ? f : f?.id;
      if (id) faultHistoryRef.current = [...faultHistoryRef.current.slice(-9), id];
    });

    const payload = {
      exercise:            exercise.id,
      repNumber:           repCount,
      exercisePhase:       frameRef.current?.phase ?? null,
      active_faults:       faults,
      sessionFaultHistory: faultHistoryRef.current.slice(-5),
      formScoreTrend:      recentScoresRef.current,
      form_score:          liveFormScore,
      knee_angle:          frameRef.current?.angles?.kneeL ?? null,
      hip_angle:           frameRef.current?.angles?.hipL ?? null,
      torso_angle:         frameRef.current?.angles?.torso ?? null,
      fatigue_index:       1 - (liveFormScore / 100),
      athleteLevel:        localStorage.getItem('formwise_athlete_level') || 'Intermediate',
    };

    getLiveCue(payload).then(result => {
      if (!result || result.confidence < 0.7) return;
      lastGeminiCueTextRef.current = result.cue;
      setGeminiCue(result.cue);
      geminiCueShownAtRef.current = Date.now();
      speak(result.cue);
      setTimeout(() => setGeminiCue(null), 5000);
    });
  }, [repCount]);

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

  // ── Space key stops session ───────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' && sessionActive && !e.target.matches('input,textarea,button')) {
        e.preventDefault();
        handleStop();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sessionActive, handleStop]);

  // ── Reduced motion preference ─────────────────────────────────────────────
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="fixed inset-0 z-40 bg-black" role="main" aria-label={`Live session — ${exercise.displayName || exercise.name}`}>
      {/* Screen reader live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {sessionActive ? `Live session active — form analysis running. Form score: ${formScore} percent. Reps: ${repCount}.` : ''}
      </div>
      {/* Score live region */}
      <div aria-live="polite" aria-atomic="true" aria-label={`Form score ${formScore} percent`} className="sr-only">
        {formScore}
      </div>

      {/* Secure context error — shown before camera attempt */}
      {!isSecure && (
        <div className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.92)' }}>
          <div className="w-80 rounded-2xl border p-6 space-y-4 text-center"
            style={{ background: '#0c0c0c', borderColor: `${RED}40` }}>
            <p className="text-sm font-bold" style={{ color: RED, fontFamily: "'DM Mono', monospace" }}>
              Insecure Context
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Mono', monospace" }}>
              Camera requires HTTPS or localhost. Please access this app from a secure connection.
            </p>
            <button onClick={handleStop}
              className="w-full py-3 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'white', fontFamily: "'DM Mono', monospace" }}>
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* Video — mirror when using front camera, playsInline for iOS */}
      <video ref={videoRef} playsInline muted autoPlay
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none' }} />

      {/* Canvas — mirror when using front camera (including skeleton/annotations) */}
      <canvas ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none' }} />

      {/* ── Camera failed or switch error ────────────────────────────────── */}
      {(camState === 'failed' || camError) && isSecure && !isSwitching && (
        <div className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.92)' }}>
          <div className="w-80 rounded-2xl border p-6 space-y-4 text-center"
            style={{ background: '#0c0c0c', borderColor: `${RED}40` }}>
            <p className="text-sm font-bold" style={{ color: RED, fontFamily: "'DM Mono', monospace" }}>
              Camera Error
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Mono', monospace" }}>
              {camError}
            </p>
            <div className="space-y-2">
              <button onClick={() => {
                window.location.reload();
              }}
                className="w-full py-2 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(201,168,76,0.2)', color: GOLD, border: `1px solid ${GOLD}40` }}>
                Retry
              </button>
              <button onClick={async () => {
                const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
                const success = await switchCamera(newFacing);
                if (success) {
                  setCameraFacing(newFacing);
                  localStorage.setItem('bioneer_camera_facing', newFacing);
                }
              }}
                className="w-full py-2 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(201,168,76,0.2)', color: GOLD, border: `1px solid ${GOLD}40` }}>
                Switch Camera
              </button>
              <button onClick={handleStop}
                className="w-full py-2 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}>
                Go Back
              </button>
            </div>
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
          exercise={exercise}
          poseLandmarks={poseResults?.poseLandmarks?.[0] ?? null}
        />
      )}

      {/* ── Loading overlay while pose initializing or camera switching ──── */}
      {(poseState === 'initializing' && camState === 'active') || (isSwitching || isSwitchingCamera) && (
        <div className="absolute top-20 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-full border"
            style={{ background: 'rgba(0,0,0,0.75)', borderColor: `${GOLD}40`, backdropFilter: 'blur(8px)' }}>
            <div className="w-3 h-3 rounded-full border-2 animate-spin"
              style={{ borderColor: GOLD, borderTopColor: 'transparent' }} />
            <span className="text-[10px] tracking-widest uppercase"
              style={{ color: GOLD, fontFamily: "'DM Mono', monospace" }}>
              {isSwitching || isSwitchingCamera ? 'Switching camera…' : phase || 'Initializing pose…'}
            </span>
          </div>
        </div>
      )}

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}>
        <button onClick={handleStop} aria-label="End session and go back" className="p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <ArrowLeft className="w-5 h-5 text-white" aria-hidden="true" />
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

      {/* ── Camera Toggle (Mobile-Safe) ──────────────────────────────────── */}
      {/* Place above video with high z-index, larger touch target for mobile */}
      <div className="absolute top-4 right-4 z-[100]">
        <CameraToggle
          cameraFacing={cameraFacing}
          onToggle={handleToggleCamera}
          isLoading={isSwitching || isSwitchingCamera}
          className="px-3 py-2 rounded-lg border text-sm md:text-xs"
          style={{
            background: 'rgba(0,0,0,0.7)',
            borderColor: GOLD,
            backdropFilter: 'blur(12px)',
            color: GOLD,
            minWidth: '44px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </div>

      {/* ── Mute ─────────────────────────────────────────────────────────── */}
      <div className="absolute top-16 right-4 z-50">
        <button onClick={() => setMuted(m => !m)}
          aria-label={muted ? 'Unmute audio cues' : 'Mute audio cues'}
          aria-pressed={muted}
          className="p-2.5 rounded-full border"
          style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
          {muted
            ? <VolumeX className="w-4 h-4 text-white/50" aria-hidden="true" />
            : <Volume2 className="w-4 h-4 text-white" aria-hidden="true" />}
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
          delegateBadge={delegateBadge}
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

      {/* ── Gemini AI cue banner ───────────────────────────────────────────── */}
      {geminiCue && sessionActive && !checkInCue && (
        <div className="absolute left-4 right-4 z-50 flex justify-center pointer-events-none"
          style={{ top: activeCue ? '10.5rem' : '8rem' }}>
          <div className="px-4 py-2.5 rounded-xl border text-center max-w-xs"
            style={{ background: 'rgba(201,168,76,0.08)', borderColor: `${GOLD}60`, backdropFilter: 'blur(8px)' }}>
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <span className="text-[9px] font-bold tracking-[0.15em]" style={{ color: GOLD, fontFamily: "'DM Mono', monospace" }}>✦ AI</span>
            </div>
            <p className="text-sm font-bold tracking-wide uppercase"
              style={{ color: GOLD, fontFamily: "'DM Mono', monospace" }}>
              {geminiCue}
            </p>
          </div>
        </div>
      )}

      {/* ── Fatigue Warning Banner ───────────────────────────────────────── */}
      {showFatigueBanner && !fatigueBannerDismissed && sessionActive && (
        <div className="absolute left-4 right-4 z-50 flex justify-center pointer-events-auto"
          style={{ bottom: '7rem' }}>
          <div className="w-full max-w-sm px-4 py-3 rounded-xl border flex items-center justify-between gap-3"
            style={{ background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.5)', backdropFilter: 'blur(8px)' }}>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] font-bold tracking-[0.12em]" style={{ color: '#f59e0b', fontFamily: "'DM Mono', monospace" }}>
                  ⚠ FATIGUE DETECTED
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: 'rgba(245,158,11,0.8)', fontFamily: "'DM Mono', monospace" }}>
                Consider ending set
              </p>
            </div>
            <button onClick={() => { setFatigueBannerDismissed(true); setShowFatigueBanner(false); }}
              aria-label="Dismiss fatigue warning"
              className="text-[9px] px-2 py-1 rounded border flex-shrink-0"
              style={{ borderColor: 'rgba(245,158,11,0.4)', color: '#f59e0b', fontFamily: "'DM Mono', monospace" }}>
              DISMISS
            </button>
          </div>
        </div>
      )}

      {/* ── Calibration HUD banner ───────────────────────────────────────── */}
      {sessionActive && isCalibrating && (
        <div className="absolute left-4 right-4 z-50 flex justify-center pointer-events-none"
          style={{ bottom: '7.5rem' }}>
          <div className="px-4 py-2 rounded-xl border text-center"
            style={{ background: 'rgba(201,168,76,0.12)', borderColor: `${GOLD}50`, backdropFilter: 'blur(8px)' }}>
            <div className="flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GOLD }} />
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase"
                style={{ color: GOLD, fontFamily: "'DM Mono', monospace" }}>
                CALIBRATING — COMPLETE {Math.max(0, 2 - repCount)} MORE {Math.max(0, 2 - repCount) === 1 ? 'REP' : 'REPS'} NORMALLY
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── PR Toast ─────────────────────────────────────────────────────── */}
      {prToast && (
        <div className="absolute top-20 left-0 right-0 z-[60] flex justify-center pointer-events-none">
          <div className="px-5 py-3 rounded-xl border text-center"
            style={{ background: 'rgba(201,168,76,0.15)', borderColor: GOLD, backdropFilter: 'blur(10px)' }}>
            <span className="text-sm font-bold tracking-[0.15em]"
              style={{ color: GOLD, fontFamily: "'DM Mono', monospace" }}>🏆 {prToast}</span>
          </div>
        </div>
      )}

      {/* ── Coach Check-In banner (every 5 reps) ─────────────────────────── */}
      {checkInCue && sessionActive && (
        <div className="absolute left-4 right-4 z-50 flex justify-center pointer-events-none"
          style={{ top: activeCue ? '10.5rem' : '8rem' }}>
          <div className="px-4 py-3 rounded-xl border text-center max-w-xs"
            style={{ background: 'rgba(56,132,220,0.12)', borderColor: 'rgba(56,132,220,0.5)', backdropFilter: 'blur(8px)' }}>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="text-[9px] font-bold tracking-[0.15em]" style={{ color: '#60a5fa', fontFamily: "'DM Mono', monospace" }}>
                ◈ COACH CHECK-IN · REP {repCount}
              </span>
            </div>
            <p className="text-sm font-bold tracking-wide uppercase"
              style={{ color: '#93c5fd', fontFamily: "'DM Mono', monospace" }}>
              {checkInCue}
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
            aria-label="Stop session and view results"
            className="w-full py-3.5 rounded-xl border text-white font-bold text-sm tracking-wider transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)', fontFamily: "'DM Mono', monospace" }}>
            STOP SESSION
          </button>
        </div>
      </div>
    </div>
  );
}