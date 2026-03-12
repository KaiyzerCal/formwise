/**
 * usePoseRuntime.js
 * Loads MediaPipe Tasks Vision, initializes PoseLandmarker with GPU→CPU fallback.
 * States: idle | initializing | ready | failed
 * Exposes retry() to reinitialize without page reload.
 */
import { useRef, useState, useCallback } from 'react';

const VISION_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';
const WASM_URL   = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL  = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task';
const TIMEOUT_MS = 14000;

// Lowered thresholds for real-world lighting and mobile performance
const POSE_OPTIONS = (delegate) => ({
  baseOptions: {
    modelAssetPath: MODEL_URL,
    delegate,
  },
  runningMode:                'VIDEO',
  numPoses:                   1,
  minPoseDetectionConfidence: 0.35,
  minPosePresenceConfidence:  0.35,
  minTrackingConfidence:      0.35,
  outputSegmentationMasks:    false,
});

// Cache the module import so it only downloads once
let visionModulePromise = null;
function getVisionModule() {
  if (!visionModulePromise) {
    visionModulePromise = import(/* @vite-ignore */ VISION_URL).catch((err) => {
      visionModulePromise = null; // allow retry
      throw err;
    });
  }
  return visionModulePromise;
}

export function usePoseRuntime() {
  const [poseState,   setPoseState]   = useState('idle');    // idle|initializing|ready|failed
  const [phase,       setPhase]       = useState('');        // sub-phase label
  const [poseError,   setPoseError]   = useState(null);
  const [delegate,    setDelegate]    = useState(null);      // 'GPU' or 'CPU'
  const landmarkerRef = useRef(null);
  const retryKeyRef   = useRef(0);

  const initialize = useCallback(async () => {
    // Clean up previous
    try { landmarkerRef.current?.close(); } catch (_) {}
    landmarkerRef.current = null;

    setPoseState('initializing');
    setPoseError(null);
    setPhase('Loading runtime…');

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Pose runtime timed out after 14s')), TIMEOUT_MS)
    );

    try {
      const { PoseLandmarker, FilesetResolver } = await Promise.race([
        getVisionModule(),
        timeoutPromise,
      ]);

      setPhase('Loading WASM…');
      const vision = await Promise.race([
        FilesetResolver.forVisionTasks(WASM_URL),
        timeoutPromise,
      ]);

      // Try GPU first
      let landmarker = null;
      let usedDelegate = 'GPU';
      setPhase('Initializing GPU model…');

      try {
        landmarker = await Promise.race([
          PoseLandmarker.createFromOptions(vision, POSE_OPTIONS('GPU')),
          timeoutPromise,
        ]);
      } catch (gpuErr) {
        console.warn('[PoseRuntime] GPU failed, retrying with CPU:', gpuErr);
        usedDelegate = 'CPU';
        setPhase('GPU unavailable — trying CPU…');
        landmarker = await Promise.race([
          PoseLandmarker.createFromOptions(vision, POSE_OPTIONS('CPU')),
          timeoutPromise,
        ]);
      }

      // Warmup: run a blank detect to avoid first-frame stutter
      setPhase('Warming up…');
      const dummy = document.createElement('canvas');
      dummy.width = 64; dummy.height = 64;
      try { landmarker.detectForVideo(dummy, performance.now()); } catch (_) {}

      landmarkerRef.current = landmarker;
      setDelegate(usedDelegate);
      setPhase('');
      setPoseState('ready');

    } catch (err) {
      console.error('[PoseRuntime] Failed:', err);
      setPoseError(err?.message || 'Unknown error');
      setPoseError(err?.message || 'Pose engine failed to start');
      setPhase('');
      setPoseState('failed');
    }
  }, []);

  // Auto-start on mount
  const startedRef = useRef(false);
  if (!startedRef.current) {
    startedRef.current = true;
    // defer so state is mounted first
    Promise.resolve().then(initialize);
  }

  const retry = useCallback(() => {
    retryKeyRef.current += 1;
    initialize();
  }, [initialize]);

  return { poseState, phase, poseError, delegate, landmarkerRef, retry };
}