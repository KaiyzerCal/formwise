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

const THROTTLE_MS = 50; // ~20fps

export function usePoseInferenceLoop({ videoRef, landmarkerRef, poseState, active, onResult }) {
  const rafRef      = useRef(null);
  const lastTimeRef = useRef(-1);
  const lastSentMs  = useRef(0);
  const onResultRef = useRef(onResult);

  // Keep callback ref fresh without retriggering the loop effect
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (poseState !== 'ready' || !active) return;

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
        now - lastSentMs.current >= THROTTLE_MS
      ) {
        lastSentMs.current = now;
        try {
          const result = lm.detectForVideo(video, now);
          onResultRef.current?.({
            poseLandmarks:      result.landmarks?.[0]      ?? null,
            poseWorldLandmarks: result.worldLandmarks?.[0] ?? null,
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
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poseState, active]);
}