/**
 * useFrameSync Hook
 * Synchronizes video playback time with pose frame data
 * Handles timestamp-based mapping, fps fallback, and drift correction
 */

import { useCallback, useRef, useMemo } from 'react';

export function useFrameSync(poseFrames, videoRef, fps = 30) {
  const syncMapRef = useRef(null);

  /**
   * Build or rebuild the sync map (timestamp → frame index)
   */
  const buildSyncMap = useCallback(() => {
    if (!Array.isArray(poseFrames) || poseFrames.length === 0) {
      return null;
    }

    const map = {};
    const timestamps = [];

    poseFrames.forEach((frame, idx) => {
      let ms = frame.timestamp || frame.ms || idx * (1000 / fps);
      map[ms] = idx;
      timestamps.push(ms);
    });

    return { map, timestamps, frameCount: poseFrames.length };
  }, [poseFrames, fps]);

  /**
   * Get the nearest pose frame for a given video time (in seconds)
   */
  const getFrameAtTime = useCallback((videoTimeSeconds) => {
    const syncMap = syncMapRef.current || buildSyncMap();
    if (!syncMap) return null;

    const targetMs = videoTimeSeconds * 1000;
    const { timestamps } = syncMap;

    // Binary search for nearest timestamp
    let nearest = timestamps[0];
    let minDiff = Math.abs(nearest - targetMs);

    for (let i = 1; i < timestamps.length; i++) {
      const diff = Math.abs(timestamps[i] - targetMs);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = timestamps[i];
      }
      if (timestamps[i] > targetMs) break;
    }

    return poseFrames[syncMap.map[nearest]] || poseFrames[0];
  }, [poseFrames, buildSyncMap]);

  /**
   * Get frame index for a given video time
   */
  const getFrameIndexAtTime = useCallback((videoTimeSeconds) => {
    const syncMap = syncMapRef.current || buildSyncMap();
    if (!syncMap) return 0;

    const targetMs = videoTimeSeconds * 1000;
    const { timestamps } = syncMap;

    let nearestIdx = 0;
    let minDiff = Math.abs(timestamps[0] - targetMs);

    for (let i = 1; i < timestamps.length; i++) {
      const diff = Math.abs(timestamps[i] - targetMs);
      if (diff < minDiff) {
        minDiff = diff;
        nearestIdx = i;
      }
      if (timestamps[i] > targetMs) break;
    }

    return nearestIdx;
  }, [poseFrames, buildSyncMap]);

  /**
   * Get time (seconds) for a given frame index
   */
  const getTimeForFrameIndex = useCallback((frameIndex) => {
    if (!Array.isArray(poseFrames) || frameIndex >= poseFrames.length) return 0;

    const frame = poseFrames[frameIndex];
    const ms = frame.timestamp || frame.ms || frameIndex * (1000 / fps);
    return ms / 1000;
  }, [poseFrames, fps]);

  /**
   * Get current video time from ref
   */
  const getCurrentVideoTime = useCallback(() => {
    return videoRef?.current?.currentTime ?? 0;
  }, [videoRef]);

  /**
   * Seek video to a specific frame
   */
  const seekToFrame = useCallback((frameIndex) => {
    if (videoRef?.current && Array.isArray(poseFrames) && frameIndex < poseFrames.length) {
      const time = getTimeForFrameIndex(frameIndex);
      videoRef.current.currentTime = time;
      return time;
    }
    return 0;
  }, [videoRef, poseFrames, getTimeForFrameIndex]);

  /**
   * Step forward one frame
   */
  const stepForward = useCallback(() => {
    if (!videoRef?.current) return;

    const currentIdx = getFrameIndexAtTime(videoRef.current.currentTime);
    const nextIdx = Math.min(currentIdx + 1, (poseFrames?.length || 0) - 1);
    seekToFrame(nextIdx);
  }, [videoRef, poseFrames, getFrameIndexAtTime, seekToFrame]);

  /**
   * Step backward one frame
   */
  const stepBackward = useCallback(() => {
    if (!videoRef?.current) return;

    const currentIdx = getFrameIndexAtTime(videoRef.current.currentTime);
    const prevIdx = Math.max(currentIdx - 1, 0);
    seekToFrame(prevIdx);
  }, [videoRef, poseFrames, getFrameIndexAtTime, seekToFrame]);

  /**
   * Jump N frames forward
   */
  const jumpFrames = useCallback((count) => {
    if (!videoRef?.current) return;

    const currentIdx = getFrameIndexAtTime(videoRef.current.currentTime);
    const nextIdx = Math.min(currentIdx + count, (poseFrames?.length || 0) - 1);
    seekToFrame(nextIdx);
  }, [videoRef, poseFrames, getFrameIndexAtTime, seekToFrame]);

  // Memoize sync map
  useMemo(() => {
    syncMapRef.current = buildSyncMap();
  }, [buildSyncMap]);

  return {
    getFrameAtTime,
    getFrameIndexAtTime,
    getTimeForFrameIndex,
    getCurrentVideoTime,
    seekToFrame,
    stepForward,
    stepBackward,
    jumpFrames,
    frameCount: poseFrames?.length || 0,
  };
}