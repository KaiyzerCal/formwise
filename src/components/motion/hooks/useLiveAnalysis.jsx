/**
 * motion/hooks/useLiveAnalysis.js
 *
 * React hook — the single bridge between the UI and the motion engine.
 * Pages and feature components call this hook; they never touch pipeline modules directly.
 *
 * Usage:
 *   const { frameState, repCount, lockState, activeCue, startSession, stopSession }
 *     = useLiveAnalysis(exerciseId);
 *
 * Returns:
 *   frameState   — latest MotionFrame payload (phase, faults, confidence, etc.)
 *   repCount     — current rep count
 *   lockState    — subject tracking state string
 *   activeCue    — { text, severity } | null
 *   statusMsg    — current human-readable status string
 *   statusColor  — hex color for status indicator
 *   startSession — fn(videoEl, canvasEl?) → Promise<void>
 *   stopSession  — fn() → SessionSummary
 *   resetSession — fn() → void
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { LiveSessionOrchestrator } from '../../bioneer/LiveSessionOrchestrator.jsx';

const PHASE_COLORS = {
  descent: '#60A5FA', lowering: '#60A5FA', lower: '#60A5FA', pull: '#60A5FA', step: '#60A5FA',
  bottom:  '#A78BFA', hang: '#A78BFA',
  ascent:  '#34D399', press: '#34D399', concentric: '#34D399',
  lockout: '#22C55E', top: '#22C55E',
  setup:   '#C9A84C', start: '#C9A84C',
};

const PHASE_LABELS = {
  descent: 'ECCENTRIC', lowering: 'ECCENTRIC', lower: 'LOWERING', pull: 'PULLING',
  bottom:  'HOLD',      hang:     'HOLD',
  ascent:  'CONCENTRIC',press:    'PRESSING',
  lockout: 'LOCKOUT',   top:      'TOP',
  start:   'READY',     setup:    'SETUP',    step: 'STEPPING',
};

export function useLiveAnalysis(exerciseId, userId = 'local') {
  const orchRef       = useRef(null);
  const cueTimerRef   = useRef(null);
  // Sync ref — updated on every frame BEFORE React batches the state update.
  // CameraView reads this in the canvas draw callback for zero-lag rendering.
  const frameRef      = useRef(null);

  const [frameState,      setFrameState]      = useState(null);
  const [repCount,        setRepCount]        = useState(0);
  const [lockState,       setLockState]       = useState('SEARCHING');
  const [activeCue,       setActiveCue]       = useState(null);
  const [statusMsg,       setStatusMsg]       = useState('Initializing...');
  const [statusColor,     setStatusColor]     = useState('#C9A84C');
  const [lastRepMastery,  setLastRepMastery]  = useState(null); // { score, repNumber }

  // Build or rebuild the orchestrator when exerciseId changes
  useEffect(() => {
    const orch = new LiveSessionOrchestrator(exerciseId, userId);

    orch.onRep = ({ repNumber, masteryScore }) => {
      setRepCount(repNumber);
      if (masteryScore != null) {
        setLastRepMastery({ score: masteryScore, repNumber });
      }
    };

    orch.onCue = ({ text, severity }) => {
      setActiveCue({ text, severity });
      clearTimeout(cueTimerRef.current);
      cueTimerRef.current = setTimeout(() => setActiveCue(null), 12000);
    };

    orch.onLockState = (state) => {
      setLockState(state);
      if (state === 'LOST') {
        setStatusMsg('Step into frame');
        setStatusColor('#EF4444');
      } else if (state === 'LOCKED') {
        setStatusMsg('FORM LOCKED IN');
        setStatusColor('#22C55E');
      }
    };

    orch.onFrame = (payload) => {
      if (!payload) return;
      frameRef.current = payload;   // sync update for canvas renderer
      setFrameState(payload);

      const { phase, faults, lockState: ls } = payload;
      if (ls === 'LOST' || ls === 'SEARCHING') return;

      const highFault = faults?.find(f => f.severity === 'HIGH');
      const modFault  = faults?.find(f => f.severity === 'MODERATE');

      if (highFault) {
        setStatusColor('#EF4444');
        setStatusMsg(highFault.cue.toUpperCase());
      } else if (modFault) {
        setStatusColor('#F97316');
        setStatusMsg(modFault.cue.toUpperCase());
      } else {
        const color = (phase && PHASE_COLORS[phase]) ?? '#C9A84C';
        const label = (phase && PHASE_LABELS[phase]) ?? (phase ? phase.replace(/_/g,'').toUpperCase() : 'FORM LOCKED IN');
        setStatusColor(color);
        setStatusMsg(label);
      }
    };

    orchRef.current = orch;

    return () => {
      clearTimeout(cueTimerRef.current);
      // Use local reference so cleanup always targets THIS orchestrator,
      // not whatever orchRef.current points to after a new one is created
      orch.reset?.();
    };
  }, [exerciseId, userId]);

  /**
   * Feed a raw MediaPipe results frame into the engine.
   * CameraView calls this once per animation frame.
   */
  const processFrame = useCallback((results, tMs) => {
    orchRef.current?.processFrame(results, tMs);
  }, []);

  /**
   * Finalize and return the session summary.
   */
  const stopSession = useCallback(() => {
    return orchRef.current?.finalize() ?? null;
  }, []);

  /**
   * Reset the engine state (e.g. on re-start).
   */
  const updateJointResults = useCallback((jointResults) => {
    orchRef.current?.updateJointResults(jointResults);
  }, []);

  const resetSession = useCallback(() => {
    orchRef.current?.reset();
    setRepCount(0);
    setLockState('SEARCHING');
    setActiveCue(null);
    setFrameState(null);
    setStatusMsg('Initializing...');
    setStatusColor('#C9A84C');
    setLastRepMastery(null);
  }, []);

  return {
    frameState,
    frameRef,
    repCount,
    lockState,
    activeCue,
    statusMsg,
    statusColor,
    lastRepMastery,
    processFrame,
    updateJointResults,
    stopSession,
    resetSession,
  };
}