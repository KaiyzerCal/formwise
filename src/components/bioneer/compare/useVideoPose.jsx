/**
 * useVideoPose.js
 * Generic single-video pose analysis hook.
 * Replaces useUserVideoPose — works for both user and reference video.
 */

import { useEffect, useRef, useState } from 'react';

const POSE_CDN  = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js';
const POSE_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/';
const THROTTLE_MS = 120; // ~8fps analysis — stable on most devices

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.crossOrigin = 'anonymous';
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

// Singleton promise so the CDN script only loads once
let scriptPromise = null;
function ensureScript() {
  if (!scriptPromise) scriptPromise = loadScript(POSE_CDN);
  return scriptPromise;
}

export function useVideoPose({ videoRef, isPlaying, enabled = true, id = 'default' }) {
  const [poseState, setPoseState] = useState('idle');
  const [landmarks, setLandmarks] = useState(null);

  const poseRef     = useRef(null);
  const rafRef      = useRef(null);
  const mountedRef  = useRef(true);
  const lastSentMs  = useRef(0);
  const sendingRef  = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    mountedRef.current = true;
    setPoseState('loading');

    ensureScript().then(() => {
      if (!mountedRef.current || !window.Pose) { setPoseState('error'); return; }

      const pose = new window.Pose({
        locateFile: (file) => `${POSE_BASE}${file}`,
      });

      pose.setOptions({
        modelComplexity:        1,
        smoothLandmarks:        true,
        enableSegmentation:     false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence:  0.5,
      });

      pose.onResults((results) => {
        sendingRef.current = false;
        if (!mountedRef.current) return;
        setLandmarks(results.poseLandmarks ?? null);
      });

      const init = pose.initialize ? pose.initialize() : Promise.resolve();
      init
        .then(() => { if (mountedRef.current) { poseRef.current = pose; setPoseState('ready'); } })
        .catch(() => { if (mountedRef.current) setPoseState('error'); });

    }).catch(() => { if (mountedRef.current) setPoseState('error'); });

    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(rafRef.current);
      try { poseRef.current?.close?.(); } catch (_) {}
      poseRef.current = null;
    };
  }, [enabled]);

  // Analysis loop — throttled, only while playing
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (!isPlaying || poseState !== 'ready') return;

    const loop = async () => {
      if (!mountedRef.current) return;
      const now   = performance.now();
      const video = videoRef.current;

      if (
        video && !video.paused && !video.ended &&
        poseRef.current && !sendingRef.current &&
        now - lastSentMs.current >= THROTTLE_MS
      ) {
        lastSentMs.current = now;
        sendingRef.current = true;
        try { await poseRef.current.send({ image: video }); }
        catch (_) { sendingRef.current = false; }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, poseState, videoRef]);

  // Clear on pause
  useEffect(() => {
    if (!isPlaying) setLandmarks(null);
  }, [isPlaying]);

  return { poseState, landmarks };
}