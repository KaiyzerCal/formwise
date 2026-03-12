/**
 * usePoseInferenceLoop.js
 * Reads frames from a video element, runs detectForVideo, emits results.
 * Throttled to ~20fps. Stops cleanly on unmount/pause.
 */
import { useEffect, useRef } from 'react';

const THROTTLE_MS = 50; // ~20fps

export function usePoseInferenceLoop({ videoRef, landmarkerRef, poseState, active, onResult }) {
  const rafRef     = useRef(null);
  const lastTimeRef = useRef(-1);
  const lastSentMs  = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (poseState !== 'ready' || !active) return;

    const loop = () => {
      const video = videoRef.current;
      const lm    = landmarkerRef.current;
      if (!video || !lm) { rafRef.current = requestAnimationFrame(loop); return; }

      const now = performance.now();
      if (
        video.readyState >= 2 &&
        video.currentTime !== lastTimeRef.current &&
        now - lastSentMs.current >= THROTTLE_MS
      ) {
        lastTimeRef.current = video.currentTime;
        lastSentMs.current  = now;
        try {
          const result = lm.detectForVideo(video, now);
          onResult?.({
            poseLandmarks:      result.landmarks?.[0]      ?? null,
            poseWorldLandmarks: result.worldLandmarks?.[0] ?? null,
          });
        } catch (_) {
          // frame failed — skip, keep looping
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [poseState, active, videoRef, landmarkerRef, onResult]);
}