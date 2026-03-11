/**
 * useTechniqueCompare — core hook for Technique Compare page.
 *
 * Responsibilities:
 *  - Load and synchronize two <video> elements (user + reference)
 *  - Run MediaPipe Pose on each video when paused / on seek
 *  - Cache per-frame angle analysis
 *  - Expose playback controls and comparison metrics
 *
 * MediaPipe is loaded lazily from CDN (same as CameraView pattern).
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { extractAngles } from './poseUtils';
import { buildMetricsFromAngles, buildCuesFromMetrics } from './compareProfiles';

const MP_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js';

export function useTechniqueCompare({ profile, videoLeftRef, videoRightRef }) {
  const [loaded, setLoaded] = useState({ left: false, right: false });
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [compareMode, setCompareMode] = useState('sidebyside'); // 'sidebyside' | 'overlay'
  const [leftLandmarks, setLeftLandmarks] = useState(null);
  const [rightLandmarks, setRightLandmarks] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [cues, setCues] = useState([]);
  const [poseReady, setPoseReady] = useState(false);
  const [poseError, setPoseError] = useState(null);

  const poseLeftRef  = useRef(null);
  const poseRightRef = useRef(null);
  const rafRef       = useRef(null);
  const analysisCache = useRef({}); // key: `${side}_${timeMs}` → landmarks

  // ── Load MediaPipe lazily ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!window.Pose) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = MP_CDN;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        if (cancelled) return;

        const makePose = (onResults) => {
          const p = new window.Pose({
            locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${f}`,
          });
          p.setOptions({ modelComplexity: 1, smoothLandmarks: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
          p.onResults(onResults);
          return p;
        };

        poseLeftRef.current  = makePose((r) => handlePoseResults('left',  r));
        poseRightRef.current = makePose((r) => handlePoseResults('right', r));
        if (!cancelled) setPoseReady(true);
      } catch (e) {
        if (!cancelled) setPoseError('MediaPipe unavailable — pose overlay disabled.');
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // ── Process pose results ──────────────────────────────────────────────────
  const handlePoseResults = useCallback((side, results) => {
    const lms = results.poseLandmarks || null;
    if (side === 'left')  setLeftLandmarks(lms);
    if (side === 'right') setRightLandmarks(lms);
  }, []);

  // ── Re-compute metrics whenever landmarks change ──────────────────────────
  useEffect(() => {
    if (!profile?.keyAngles) return;
    const lAngles = leftLandmarks  ? extractAngles(leftLandmarks,  profile.keyAngles) : {};
    const rAngles = rightLandmarks ? extractAngles(rightLandmarks, profile.keyAngles) : {};
    const m = buildMetricsFromAngles(lAngles, rAngles, profile);
    const c = buildCuesFromMetrics(m, profile);
    setMetrics(m);
    setCues(c);
  }, [leftLandmarks, rightLandmarks, profile]);

  // ── Analyze a video frame (called on seek / pause) ────────────────────────
  const analyzeFrame = useCallback(async (side) => {
    const pose = side === 'left' ? poseLeftRef.current : poseRightRef.current;
    const video = side === 'left' ? videoLeftRef.current : videoRightRef.current;
    if (!pose || !video || video.readyState < 2) return;

    const key = `${side}_${Math.round(video.currentTime * 10)}`;
    if (analysisCache.current[key]) {
      const cached = analysisCache.current[key];
      if (side === 'left')  setLeftLandmarks(cached);
      if (side === 'right') setRightLandmarks(cached);
      return;
    }

    try {
      await pose.send({ image: video });
    } catch (_) { /* ignore */ }
  }, [videoLeftRef, videoRightRef]);

  // ── Playback time tracker ─────────────────────────────────────────────────
  const trackTime = useCallback(() => {
    const vl = videoLeftRef.current;
    if (!vl) return;
    setCurrentTime(vl.currentTime);
    if (!vl.paused) {
      rafRef.current = requestAnimationFrame(trackTime);
    }
  }, [videoLeftRef]);

  // ── Play ──────────────────────────────────────────────────────────────────
  const play = useCallback(() => {
    const vl = videoLeftRef.current;
    const vr = videoRightRef.current;
    if (!vl) return;
    const playVideo = (v) => { if (v) { v.playbackRate = speed; v.play().catch(() => {}); } };
    playVideo(vl);
    playVideo(vr);
    setPlaying(true);
    rafRef.current = requestAnimationFrame(trackTime);
  }, [speed, trackTime, videoLeftRef, videoRightRef]);

  // ── Pause ─────────────────────────────────────────────────────────────────
  const pause = useCallback(() => {
    const vl = videoLeftRef.current;
    const vr = videoRightRef.current;
    if (vl) vl.pause();
    if (vr) vr.pause();
    setPlaying(false);
    cancelAnimationFrame(rafRef.current);
    // Analyze paused frame
    setTimeout(() => { analyzeFrame('left'); analyzeFrame('right'); }, 80);
  }, [analyzeFrame, videoLeftRef, videoRightRef]);

  // ── Seek ──────────────────────────────────────────────────────────────────
  const seek = useCallback((time) => {
    const vl = videoLeftRef.current;
    const vr = videoRightRef.current;
    if (vl) vl.currentTime = time;
    if (vr) vr.currentTime = time; // sync reference to same relative time
    setCurrentTime(time);
    if (playing) return; // already playing, no need to re-analyze
    setTimeout(() => { analyzeFrame('left'); analyzeFrame('right'); }, 120);
  }, [playing, analyzeFrame, videoLeftRef, videoRightRef]);

  // ── Step frame ────────────────────────────────────────────────────────────
  const stepFrame = useCallback((dir) => {
    const vl = videoLeftRef.current;
    const vr = videoRightRef.current;
    if (!vl) return;
    const delta = dir > 0 ? 1 / 30 : -1 / 30;
    const t = Math.max(0, Math.min(vl.duration || 0, vl.currentTime + delta));
    if (vl) vl.currentTime = t;
    if (vr) vr.currentTime = t;
    setCurrentTime(t);
    setTimeout(() => { analyzeFrame('left'); analyzeFrame('right'); }, 120);
  }, [analyzeFrame, videoLeftRef, videoRightRef]);

  // ── Set playback rate ─────────────────────────────────────────────────────
  const setPlaybackRate = useCallback((rate) => {
    setSpeed(rate);
    const vl = videoLeftRef.current;
    const vr = videoRightRef.current;
    if (vl) vl.playbackRate = rate;
    if (vr) vr.playbackRate = rate;
  }, [videoLeftRef, videoRightRef]);

  // ── Video load handlers ───────────────────────────────────────────────────
  const onLoadedLeft = useCallback(() => {
    const vl = videoLeftRef.current;
    if (vl) setDuration(vl.duration || 0);
    setLoaded(prev => ({ ...prev, left: true }));
    setTimeout(() => analyzeFrame('left'), 200);
  }, [analyzeFrame, videoLeftRef]);

  const onLoadedRight = useCallback(() => {
    setLoaded(prev => ({ ...prev, right: true }));
    setTimeout(() => analyzeFrame('right'), 200);
  }, [analyzeFrame]);

  // ── Sync right video when left emits timeupdate ───────────────────────────
  const onTimeUpdateLeft = useCallback(() => {
    const vl = videoLeftRef.current;
    const vr = videoRightRef.current;
    if (!vl || !vr || !playing) return;
    const drift = Math.abs(vl.currentTime - vr.currentTime);
    if (drift > 0.15) vr.currentTime = vl.currentTime;
    setCurrentTime(vl.currentTime);
  }, [playing, videoLeftRef, videoRightRef]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return {
    // State
    loaded, playing, speed, currentTime, duration, compareMode,
    leftLandmarks, rightLandmarks, metrics, cues,
    poseReady, poseError,
    // Controls
    play, pause, seek, stepFrame, setPlaybackRate,
    setCompareMode,
    // Video event handlers
    onLoadedLeft, onLoadedRight, onTimeUpdateLeft,
  };
}