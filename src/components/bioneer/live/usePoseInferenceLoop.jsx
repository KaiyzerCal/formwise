/**
 * usePoseInferenceLoop.js
 * Reads frames from a video element, runs detectForVideo, emits results.
 * Throttled to ~20fps. Stops cleanly on unmount/pause.
 *
 * FIX: Use stable onResult ref to prevent stale closure restarts
 * FIX: Require video dimensions > 0 before inferring
 * FIX: Use performance.now() consistently as monotonic timestamp for MediaPipe
 * FIX: Skip frame if currentTime hasn't advanced (paused video)
 */
import { useEffect, useRef } from 'react';
import { FPSGovernor } from '../pipeline/runtime/FPSGovernor';

export function usePoseInferenceLoop({ videoRef, landmarkerRef, poseState, active, onResult }) {
  const rafRef      = useRef(null);
  const onResultRef = useRef(onResult);
  const govRef      = useRef(null);

  // Keep callback ref fresh without retriggering the loop effect
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (poseState !== 'ready' || !active) return;

    // Create a fresh governor for this session
    govRef.current = new FPSGovernor({ target: 30, minFPS: 15 });

    const loop = () => {
      const video = videoRef.current;
      const lm    = landmarkerRef.current;

      if (!video || !lm) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const now = performance.now();

      // Gate: video must have valid dimensions and be playing
      if (
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        !video.paused &&
        !video.ended &&
        govRef.current.tick(now)   // adaptive throttle replaces fixed THROTTLE_MS
      ) {
        try {
          const t0     = performance.now();
          const result = lm.detectForVideo(video, now);
          const frameMs = performance.now() - t0;
          // Expose frame timing on the governor for external monitoring
          govRef.current._lastFrameMs = frameMs;
          onResultRef.current?.({
            poseLandmarks:      result.landmarks?.[0]      ?? null,
            poseWorldLandmarks: result.worldLandmarks?.[0] ?? null,
            _fps:               govRef.current.fps,
            _frameMs:           frameMs,
          });
        } catch (err) {
          // frame failed — skip, keep looping
          console.warn('[InferenceLoop] frame error:', err?.message);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      govRef.current?.reset();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poseState, active]);
}