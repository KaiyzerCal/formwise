/**
 * useLiveCoaching.js
 * 
 * React hook for real-time coaching during active capture
 * 
 * Integrates:
 * - RealtimeIssueDetector (current frame analysis)
 * - PredictiveCoachingEngine (future trajectory)
 * - RealtimeCoachScheduler (decision logic)
 * - RealtimeVoiceEngine (ultra-low latency speech)
 * 
 * Call this in FreestyleCameraView or LiveSessionHUD
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { detectRealtimeIssues } from './RealtimeIssueDetector';
import { PredictiveCoachingEngine } from './PredictiveCoachingEngine';
import { RealtimeCoachScheduler } from './RealtimeCoachScheduler';
import { getRealtimeVoiceEngine } from './RealtimeVoiceEngine';

export function useLiveCoaching(
  isCapturing = false,
  userMovementProfile = null,
  enabled = true
) {
  const [currentCue, setCurrentCue] = useState(null);
  const [isCoachingEnabled, setIsCoachingEnabled] = useState(enabled);
  const [volume, setVolume] = useState(1);
  const [intensity, setIntensity] = useState('moderate'); // minimal|moderate|detailed

  // Engines
  const predictiveEngineRef = useRef(new PredictiveCoachingEngine(userMovementProfile));
  const schedulerRef = useRef(new RealtimeCoachScheduler(userMovementProfile));
  const voiceEngineRef = useRef(getRealtimeVoiceEngine());

  // Frame history
  const frameHistoryRef = useRef([]);
  const lastCoachingFrameRef = useRef(0);

  /**
   * Process a new frame from pose detector
   * Call this from the pose inference loop (~30-60fps)
   */
  const processFrame = useCallback(
    (frame, timestamp) => {
      if (!isCapturing || !isCoachingEnabled || !enabled) {
        return;
      }

      // Keep recent history
      frameHistoryRef.current.push({ frame, timestamp });
      if (frameHistoryRef.current.length > 15) {
        frameHistoryRef.current.shift();
      }

      // Every 50-100ms, run detection (not every frame)
      const now = Date.now();
      if (now - lastCoachingFrameRef.current < 50) {
        return;
      }
      lastCoachingFrameRef.current = now;

      // Detect issues in current frame
      const detected = detectRealtimeIssues(
        frame,
        frameHistoryRef.current.slice(0, -1),
        userMovementProfile
      );

      // Predict upcoming issues
      predictiveEngineRef.current.update(frame, now);
      const predicted = predictiveEngineRef.current.predictUpcomingIssues(200);

      // Decide what to coach
      const decision = schedulerRef.current.decide(detected, predicted, now);

      if (decision.shouldSpeak) {
        // Filter by intensity
        if (shouldPassIntensityFilter(decision.priority, intensity)) {
          // Trigger voice + visual
          voiceEngineRef.current.speak(decision.message, {
            priority: decision.priority,
            duration: decision.duration,
            volume: volume,
            interruptCurrent: decision.priority === 'high',
          });

          // Update UI
          setCurrentCue({
            message: decision.message,
            shortMessage: decision.shortMessage,
            duration: decision.duration,
            priority: decision.priority,
            bodyParts: decision.bodyParts,
            issueType: decision.issueType,
          });

          // Auto-clear cue after duration
          setTimeout(() => {
            setCurrentCue(null);
          }, decision.duration + 200);
        }
      }
    },
    [isCapturing, isCoachingEnabled, enabled, intensity, volume, userMovementProfile]
  );

  /**
   * Handle capture stop
   */
  useEffect(() => {
    if (!isCapturing) {
      voiceEngineRef.current.stop();
      schedulerRef.current.reset();
      predictiveEngineRef.current.reset();
      frameHistoryRef.current = [];
      setCurrentCue(null);
    }
  }, [isCapturing]);

  /**
   * Filter cue by user intensity preference
   */
  const shouldPassIntensityFilter = (priority, intensityLevel) => {
    const intensityMap = {
      minimal: ['high'], // Only critical
      moderate: ['high', 'medium'], // High + medium (default)
      detailed: ['high', 'medium', 'low'], // Everything
    };

    return intensityMap[intensityLevel]?.includes(priority) ?? true;
  };

  return {
    // Frame processing
    processFrame,

    // State
    currentCue,
    isCoachingEnabled,
    volume,
    intensity,

    // Controls
    setCoachingEnabled: setIsCoachingEnabled,
    setVolume: (v) => {
      setVolume(v);
      voiceEngineRef.current.setVolume(v);
    },
    setIntensity,

    // Utils
    stop: () => voiceEngineRef.current.stop(),
    isSpeaking: () => voiceEngineRef.current.isSpeaking(),
  };
}