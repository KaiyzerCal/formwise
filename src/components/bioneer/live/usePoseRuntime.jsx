/**
 * usePoseRuntime.jsx
 * Loads MediaPipe Tasks Vision with tiered model selection + GPU→CPU fallback.
 * Model tiers: full (default) | heavy (high-accuracy) | lite (performance/CPU fallback)
 * States: idle | initializing | ready | failed
 */
import { useRef, useState, useCallback } from 'react';

const VISION_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';
const WASM_URL   = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';

const MODEL_URLS = {
  heavy: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task',
  full:  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task',
  lite:  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
};

const TIMEOUT_MS = 18000; // heavy model needs more time

// Improved thresholds — reduce false positives in gym lighting
const POSE_OPTIONS = (modelAssetPath, delegate) => ({
  baseOptions: { modelAssetPath, delegate },
  runningMode:                'VIDEO',
  numPoses:                   1,
  minPoseDetectionConfidence: 0.5,
  minPosePresenceConfidence:  0.5,
  minTrackingConfidence:      0.45,
  outputSegmentationMasks:    false,
});

// Cache the module import so it only downloads once
let visionModulePromise = null;
function getVisionModule() {
  if (!visionModulePromise) {
    visionModulePromise = import(/* @vite-ignore */ VISION_URL).catch((err) => {
      visionModulePromise = null;
      throw err;
    });
  }
  return visionModulePromise;
}

function getModelTier() {
  const stored = localStorage.getItem('bioneer_pose_model');
  if (stored === 'heavy' || stored === 'lite') return stored;
  return 'full';
}

export function usePoseRuntime() {
  const [poseState, setPoseState] = useState('idle');
  const [phase,     setPhase]     = useState('');
  const [poseError, setPoseError] = useState(null);
  const [delegate,  setDelegate]  = useState(null);  // 'GPU' or 'CPU'
  const [modelTier, setModelTier] = useState(null);  // 'heavy' | 'full' | 'lite'
  const landmarkerRef = useRef(null);
  const retryKeyRef   = useRef(0);

  const initialize = useCallback(async () => {
    try { landmarkerRef.current?.close(); } catch (_) {}
    landmarkerRef.current = null;

    setPoseState('initializing');
    setPoseError(null);
    setPhase('Loading runtime…');

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Pose runtime timed out')), TIMEOUT_MS)
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

      const tier = getModelTier();
      const modelUrl = MODEL_URLS[tier];

      // Try GPU first (lite falls through to CPU directly)
      let landmarker = null;
      let usedDelegate = 'GPU';
      let usedTier = tier;

      setPhase(`Initializing ${tier.toUpperCase()} model…`);

      if (tier !== 'lite') {
        try {
          landmarker = await Promise.race([
            PoseLandmarker.createFromOptions(vision, POSE_OPTIONS(modelUrl, 'GPU')),
            timeoutPromise,
          ]);
        } catch (gpuErr) {
          console.warn('[PoseRuntime] GPU failed, retrying with CPU lite:', gpuErr);
          usedDelegate = 'CPU';
          usedTier = 'lite';
          setPhase('GPU unavailable — trying CPU lite…');
          landmarker = await Promise.race([
            PoseLandmarker.createFromOptions(vision, POSE_OPTIONS(MODEL_URLS.lite, 'CPU')),
            timeoutPromise,
          ]);
        }
      } else {
        // lite explicitly chosen — use CPU
        usedDelegate = 'CPU';
        setPhase('Initializing CPU lite model…');
        landmarker = await Promise.race([
          PoseLandmarker.createFromOptions(vision, POSE_OPTIONS(modelUrl, 'CPU')),
          timeoutPromise,
        ]);
      }

      // Improved warmup: 256×256 gradient canvas, 3 frames
      setPhase('Warming up…');
      const dummy = document.createElement('canvas');
      dummy.width = 256; dummy.height = 256;
      const ctx = dummy.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 256, 256);
      grad.addColorStop(0, '#c8a882');
      grad.addColorStop(1, '#8a6852');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      for (let i = 0; i < 3; i++) {
        try { landmarker.detectForVideo(dummy, performance.now() + i); } catch (_) {}
      }

      landmarkerRef.current = landmarker;
      setDelegate(usedDelegate);
      setModelTier(usedTier);
      setPhase('');
      setPoseState('ready');

    } catch (err) {
      console.error('[PoseRuntime] Failed:', err);
      setPoseError(err?.message || 'Pose engine failed to start');
      setPhase('');
      setPoseState('failed');
    }
  }, []);

  // Auto-start on mount
  const startedRef = useRef(false);
  if (!startedRef.current) {
    startedRef.current = true;
    Promise.resolve().then(initialize);
  }

  const retry = useCallback(() => {
    retryKeyRef.current += 1;
    initialize();
  }, [initialize]);

  // delegateBadge: 'GPU·HEAVY' | 'GPU·FULL' | 'GPU·LITE' | 'CPU·LITE'
  const delegateBadge = delegate && modelTier
    ? `${delegate}·${modelTier.toUpperCase()}`
    : null;

  return { poseState, phase, poseError, delegate, modelTier, delegateBadge, landmarkerRef, retry };
}