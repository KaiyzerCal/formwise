/**
 * useUserVideoPose.js
 * Loads MediaPipe Pose from CDN, analyzes the LEFT/USER video only.
 * Exposes landmarks, computed metrics, and pose state.
 * Self-contained — does not touch the live camera pipeline.
 */

import { useEffect, useRef, useState } from 'react';

const POSE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js';
const POSE_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/';
const THROTTLE_MS = 100; // ~10fps analysis

// ── MediaPipe landmark indices ──────────────────────────────────────────────
const LM = {
  NOSE: 0,
  L_SHOULDER: 11, R_SHOULDER: 12,
  L_ELBOW: 13,    R_ELBOW: 14,
  L_WRIST: 15,    R_WRIST: 16,
  L_HIP: 23,      R_HIP: 24,
  L_KNEE: 25,     R_KNEE: 26,
  L_ANKLE: 27,    R_ANKLE: 28,
};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.crossOrigin = 'anonymous';
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

function angle3(a, b, c) {
  const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let deg = Math.abs(rad * 180 / Math.PI);
  if (deg > 180) deg = 360 - deg;
  return Math.round(deg);
}

function safeAngle(lm, a, b, c, minVis = 0.4) {
  const pa = lm[a], pb = lm[b], pc = lm[c];
  if (!pa || !pb || !pc) return null;
  if (pa.visibility < minVis || pb.visibility < minVis || pc.visibility < minVis) return null;
  return angle3(pa, pb, pc);
}

function computeMetrics(lm) {
  const visCount = lm.filter(l => l.visibility > 0.5).length;
  const avgConf  = lm.reduce((s, l) => s + l.visibility, 0) / lm.length;

  const leftKnee  = safeAngle(lm, LM.L_HIP, LM.L_KNEE, LM.L_ANKLE);
  const rightKnee = safeAngle(lm, LM.R_HIP, LM.R_KNEE, LM.R_ANKLE);
  const leftHip   = safeAngle(lm, LM.L_SHOULDER, LM.L_HIP, LM.L_KNEE);
  const rightHip  = safeAngle(lm, LM.R_SHOULDER, LM.R_HIP, LM.R_KNEE);

  // Torso lean vs vertical
  let torsoLean = null;
  const ls = lm[LM.L_SHOULDER], rs = lm[LM.R_SHOULDER];
  const lh = lm[LM.L_HIP],      rh = lm[LM.R_HIP];
  if (ls && rs && lh && rh && ls.visibility > 0.4 && lh.visibility > 0.4) {
    const msX = (ls.x + rs.x) / 2, msY = (ls.y + rs.y) / 2;
    const mhX = (lh.x + rh.x) / 2, mhY = (lh.y + rh.y) / 2;
    torsoLean = Math.round(Math.atan2(msX - mhX, mhY - msY) * 180 / Math.PI);
  }

  const status = avgConf > 0.65 ? 'locked' : avgConf > 0.4 ? 'weak' : 'lost';

  return {
    confidence: Math.round(avgConf * 100),
    visibleJoints: visCount,
    status,
    leftKnee, rightKnee, leftHip, rightHip, torsoLean,
  };
}

export function useUserVideoPose({ videoRef, isPlaying, enabled = true }) {
  const [poseState, setPoseState] = useState('idle'); // idle | loading | ready | error
  const [landmarks, setLandmarks] = useState(null);
  const [metrics,   setMetrics]   = useState(null);

  const poseRef    = useRef(null);
  const rafRef     = useRef(null);
  const mountedRef = useRef(true);
  const lastSentMs = useRef(0);
  const sendingRef = useRef(false);

  // ── Load MediaPipe ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    mountedRef.current = true;
    setPoseState('loading');

    loadScript(POSE_CDN).then(() => {
      if (!mountedRef.current || !window.Pose) { setPoseState('error'); return; }

      const pose = new window.Pose({
        locateFile: (file) => `${POSE_BASE}${file}`,
      });

      pose.setOptions({
        modelComplexity:       1,
        smoothLandmarks:       true,
        enableSegmentation:    false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence:  0.5,
      });

      pose.onResults((results) => {
        sendingRef.current = false;
        if (!mountedRef.current) return;
        const lm = results.poseLandmarks ?? null;
        setLandmarks(lm);
        setMetrics(lm ? computeMetrics(lm) : null);
      });

      // initialize() exists in some versions; catch if not
      const initPromise = pose.initialize ? pose.initialize() : Promise.resolve();
      initPromise
        .then(() => { if (mountedRef.current) { poseRef.current = pose; setPoseState('ready'); } })
        .catch(() => { if (mountedRef.current) setPoseState('error'); });

    }).catch(() => {
      if (mountedRef.current) setPoseState('error');
    });

    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(rafRef.current);
      try { poseRef.current?.close?.(); } catch (_) {}
      poseRef.current = null;
    };
  }, [enabled]);

  // ── Analysis loop (throttled, only while playing) ─────────────────────────
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (!isPlaying || poseState !== 'ready') return;

    const loop = async () => {
      if (!mountedRef.current) return;
      const now  = performance.now();
      const video = videoRef.current;

      if (
        video && !video.paused && !video.ended &&
        poseRef.current && !sendingRef.current &&
        now - lastSentMs.current >= THROTTLE_MS
      ) {
        lastSentMs.current  = now;
        sendingRef.current  = true;
        try { await poseRef.current.send({ image: video }); }
        catch (_) { sendingRef.current = false; }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, poseState, videoRef]);

  // Clear landmarks on pause so stale pose doesn't persist
  useEffect(() => {
    if (!isPlaying) {
      setLandmarks(null);
      setMetrics(null);
    }
  }, [isPlaying]);

  return { poseState, landmarks, metrics };
}