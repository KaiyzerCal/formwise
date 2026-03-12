/**
 * FreestyleCameraView — extends CameraView for freestyle mode
 * Disables form scoring, rep detection, fault detection
 * Records video + pose frames
 * No movement-specific analysis or feedback
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { useCameraStream } from './live/useCameraStream';
import { usePoseRuntime } from './live/usePoseRuntime';
import { usePoseInferenceLoop } from './live/usePoseInferenceLoop';
import SessionReadinessGate from './live/SessionReadinessGate';
import PoseErrorCard from './live/PoseErrorCard';
import { useSessionRecorder } from './session/useSessionRecorder';
import { createFreestyleSession, SESSION_CATEGORIES } from './session/sessionTypes';
import { clearCanvas, drawSkeleton, drawGhostSkeleton, generateGhostPose } from './canvasRenderer';
import { smoothLandmarks, computeJointAngles } from './poseEngine';
import { COLORS, FONT } from './ui/DesignTokens';

const GOLD = '#C9A84C';
const RED = '#EF4444';

export default function FreestyleCameraView({ category = SESSION_CATEGORIES.STRENGTH, onStop }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const prevLandmarksRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const sessionIdRef = useRef(`freestyle-${Date.now()}`);

  const [muted, setMuted] = useState(false);
  const [poseResults, setPoseResults] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [poseConfidence, setPoseConfidence] = useState(0);
  const [visibleJoints, setVisibleJoints] = useState(0);
  const [workflowState, setWorkflowState] = useState('idle'); // idle, recording, finalizing, error
  const [errorMsg, setErrorMsg] = useState(null);

  // ── Camera ───────────────────────────────────────────────────────────────
  const { camState, camError, currentFacing, switchCamera } = useCameraStream(videoRef);
  const [switchingCamera, setSwitchingCamera] = useState(false);

  const handleSwitchCamera = useCallback(async () => {
    setSwitchingCamera(true);
    await switchCamera();
    setSwitchingCamera(false);
  }, [switchCamera]);

  // ── Pose runtime ─────────────────────────────────────────────────────────
  const { poseState, phase, poseError, delegate, landmarkerRef, retry } = usePoseRuntime();

  // ── Session recorder ─────────────────────────────────────────────────────
  const {
    isRecording,
    startRecording,
    stopRecording,
    capturePoseFrame,
    reset: resetRecorder,
  } = useSessionRecorder(videoRef, canvasRef);

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionActive) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setElapsedTime(elapsed);
    }, 100);

    return () => clearInterval(interval);
  }, [sessionActive]);

  // ── Inference loop ────────────────────────────────────────────────────────
  const handleResult = useCallback((result) => {
    setPoseResults(result);

    // Capture pose frame if recording
    if (isRecording && result.poseLandmarks) {
      const angles = {};
      // Simple joint angle calculations for readout only
      if (result.poseLandmarks.length > 0) {
        capturePoseFrame(result.poseLandmarks, angles, result.poseLandmarks[0].visibility || 0);
      }
    }

    // Canvas render
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || canvas.offsetWidth;
    canvas.height = video.videoHeight || canvas.offsetHeight;

    // Composite: draw video frame first
    if (video.readyState >= 2) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } else {
      clearCanvas(ctx, canvas.width, canvas.height);
    }

    if (!result.poseLandmarks) return;

    const smoothed = smoothLandmarks(result.poseLandmarks, prevLandmarksRef.current);
    prevLandmarksRef.current = smoothed;

    // Track confidence and visible joints
    const avgConf = smoothed.reduce((s, p) => s + p.visibility, 0) / smoothed.length;
    const visible = smoothed.filter(p => p.visibility > 0.5).length;
    setPoseConfidence(avgConf);
    setVisibleJoints(visible);

    // Draw skeleton overlay on top of video (no scoring, just visual)
    const ghost = generateGhostPose(smoothed);
    if (ghost) drawGhostSkeleton(ctx, ghost, canvas.width, canvas.height);
    drawSkeleton(ctx, smoothed, [], canvas.width, canvas.height);
  }, [isRecording, capturePoseFrame]);

  usePoseInferenceLoop({
    videoRef,
    landmarkerRef,
    poseState,
    active: camState === 'active' && poseState === 'ready',
    onResult: handleResult,
  });

  // ── Readiness gate ────────────────────────────────────────────────────────
  const lm = poseResults?.poseLandmarks;
  const avgConf = lm ? lm.reduce((s, p) => s + p.visibility, 0) / lm.length : 0;
  const bodyDetected = visibleJoints >= 12;
  const confOk = avgConf >= 0.5;

  const readinessChecks = [
    { label: 'Camera active', ok: camState === 'active' },
    { label: 'Pose engine ready', ok: poseState === 'ready' },
    { label: 'Full body visible', ok: bodyDetected },
    { label: 'Confidence stable', ok: confOk },
  ];

  const allReady = readinessChecks.every(c => c.ok) && bodyDetected && confOk;

  useEffect(() => {
    if (allReady && !sessionActive) setSessionActive(true);
  }, [allReady, sessionActive]);

  const handleForceStart = useCallback(() => {
    if (poseState === 'ready') setSessionActive(true);
  }, [poseState]);

  const guidance = !bodyDetected && poseState === 'ready'
    ? 'Ensure your full body is visible'
    : !confOk && bodyDetected
    ? 'Step back — improve lighting'
    : null;

  // ── Stop session ──────────────────────────────────────────────────────────
  const handleStop = useCallback(async () => {
    // If not recording and no session active, just go back
    if (!isRecording && !sessionActive) {
      onStop(null);
      return;
    }

    // If recording, finalize it
    if (isRecording) {
      setWorkflowState('finalizing');
      setErrorMsg(null);

      try {
        const finalized = await stopRecording();

        // Validate finalized data
        if (!finalized.videoBlob || !(finalized.videoBlob instanceof Blob) || finalized.videoBlob.size === 0) {
          throw new Error('Recording failed to finalize: video blob is invalid.');
        }

        if (!Array.isArray(finalized.poseFrames)) {
          throw new Error('Recording failed to finalize: pose frames are missing.');
        }

        const freestyleSession = createFreestyleSession({
          sessionId: sessionIdRef.current,
          category,
          videoBlob: finalized.videoBlob,
          poseFrames: finalized.poseFrames,
          angleFrames: finalized.angleFrames,
          duration: finalized.duration,
          cameraFacing: currentFacing,
        });

        setWorkflowState('idle');
        onStop(freestyleSession);
      } catch (error) {
        setErrorMsg(error.message || 'Failed to finalize recording');
        setWorkflowState('error');
        console.error('Finalization error:', error);
      }
    } else {
      // Session active but not recording — just exit
      onStop(null);
    }
  }, [isRecording, sessionActive, stopRecording, category, onStop]);

  const handleStartRecording = useCallback(() => {
    startRecording();
  }, [startRecording]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopRecording();
      resetRecorder();
    };
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-40 bg-black">
      {/* Video */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: currentFacing === 'user' ? 'scaleX(-1)' : 'scaleX(1)' }}
      />

      {/* Canvas (video + skeleton overlay) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Camera failed */}
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

      {/* Pose failed */}
      {poseState === 'failed' && camState === 'active' && (
        <PoseErrorCard errorMsg={poseError} onRetry={retry} />
      )}

      {/* Readiness gate */}
      {!sessionActive && poseState !== 'failed' && camState === 'active' && (
        <SessionReadinessGate
          checks={readinessChecks}
          guidance={guidance}
          onForceStart={handleForceStart}
        />
      )}

      {/* Loading overlay */}
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

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}>
        <button onClick={handleStop} className="p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <span className="text-sm font-bold tracking-[0.2em] uppercase"
          style={{ color: GOLD, fontFamily: "'DM Mono', monospace" }}>
          FREESTYLE MODE
        </span>
        <div className="px-3 py-1.5 rounded-full border"
          style={{ background: 'rgba(0,0,0,0.5)', borderColor: isRecording ? GOLD : 'rgba(255,255,255,0.2)' }}>
          <span className="text-sm font-bold" style={{ fontFamily: "'DM Mono', monospace", color: isRecording ? GOLD : 'rgba(255,255,255,0.5)' }}>
            {isRecording ? '● REC' : 'READY'}
          </span>
        </div>
      </div>

      {/* Timer */}
      <div className="absolute top-16 left-4 z-50">
        <div className="px-3 py-2 rounded-xl border"
          style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
          <span className="text-[10px] text-white/40 uppercase tracking-widest block"
            style={{ fontFamily: "'DM Mono', monospace" }}>TIME</span>
          <span className="text-2xl font-bold text-white"
            style={{ fontFamily: "'DM Mono', monospace" }}>{formatTime(elapsedTime)}</span>
        </div>
      </div>

      {/* Camera + Mute */}
      <div className="absolute top-16 right-4 z-50 flex gap-2">
        <button onClick={handleSwitchCamera}
          disabled={switchingCamera || camState !== 'active'}
          className="p-2.5 rounded-full border disabled:opacity-50"
          style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
          title={`Switch to ${currentFacing === 'user' ? 'back' : 'front'} camera`}>
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
          </svg>
        </button>
        <button onClick={() => setMuted(m => !m)}
          className="p-2.5 rounded-full border"
          style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
          {muted
            ? <VolumeX className="w-4 h-4 text-white/50" />
            : <Volume2 className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Confidence + Joints indicator */}
      {sessionActive && (
        <div className="absolute bottom-28 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="px-3 py-2 rounded-xl border"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.08)', fontFamily: FONT.mono }}>
            <div className="flex items-center gap-4 text-xs">
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>CONF: <span style={{ color: GOLD }}>{Math.round(poseConfidence * 100)}%</span></span>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>JOINTS: <span style={{ color: GOLD }}>{visibleJoints}/33</span></span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar with controls */}
      <div className="absolute bottom-0 left-0 right-0 z-50">
        <div className="border-t px-4 py-5 pb-8"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex gap-3">
            {sessionActive && !isRecording && (
              <button onClick={handleStartRecording}
                className="flex-1 py-3.5 rounded-xl border text-white font-bold text-sm tracking-wider transition-colors"
                style={{ background: 'rgba(201,168,76,0.2)', borderColor: GOLD, color: GOLD, fontFamily: "'DM Mono', monospace" }}>
                START RECORDING
              </button>
            )}
            <button onClick={handleStop}
              disabled={workflowState === 'finalizing'}
              className="flex-1 py-3.5 rounded-xl border text-white font-bold text-sm tracking-wider transition-colors disabled:opacity-60"
              style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)', fontFamily: "'DM Mono', monospace" }}>
              {workflowState === 'finalizing' ? 'FINALIZING...' : isRecording ? 'STOP & SAVE' : 'EXIT'}
            </button>
          </div>
          {errorMsg && (
            <div className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3"
              style={{ fontFamily: "'DM Mono', monospace" }}>
              {errorMsg}
            </div>
          )}
        </div>
      </div>
      </div>
      );
      }