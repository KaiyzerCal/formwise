/**
 * integrationMap.js
 * Single-source audit of every data flow in the Bioneer pipeline.
 * Not imported by production code — reference document only.
 *
 * CAMERA
 *   useCameraStream (live/useCameraStream.js)
 *     → acquires getUserMedia stream
 *     → attaches to <video> ref in CameraView
 *     → states: idle | requesting | active | failed
 *
 * POSE RUNTIME
 *   usePoseRuntime (live/usePoseRuntime.js)
 *     → downloads MediaPipe Tasks Vision model
 *     → GPU → CPU fallback
 *     → exposes landmarkerRef + poseState
 *     → states: idle | initializing | ready | failed
 *
 * INFERENCE LOOP
 *   usePoseInferenceLoop (live/usePoseInferenceLoop.js)
 *     → reads video frames via RAF
 *     → throttled/adapted by FPSGovernor (pipeline/runtime/FPSGovernor.js)
 *     → calls landmarker.detectForVideo() each allowed frame
 *     → emits { poseLandmarks, poseWorldLandmarks, _fps, _frameMs }
 *     → feeds into CameraView.handleResult()
 *
 * ANALYSIS ENGINE
 *   useLiveAnalysis (motion/hooks/useLiveAnalysis.js)
 *     → wraps LiveSessionOrchestrator
 *     → processFrame() called each inference result
 *     → emits: frameState, repCount, lockState, activeCue, statusMsg
 *
 * PIPELINE (LiveSessionOrchestrator)
 *   PoseNormalizer → SubjectLockEngine → MotionReadinessManager
 *   → StabilizationEngine → KinematicsEngine → MovementContextEngine
 *   → RepDetector → PhaseClassifier → FaultDetector → FaultPersistenceBuffer
 *   → ConfidenceEngine → FeedbackScheduler → SessionLogger → MasteryScoreEngine
 *
 * EXERCISE PROFILES
 *   exerciseLibrary.js (strength)
 *   sportsLibrary.js (sports + athletic)
 *   MovementProfiles.js (RepDetector thresholds)
 *   FaultRuleLibrary.js (FaultDetector rules)
 *   → All consumed via MovementResolver.resolve(exerciseId)
 *
 * SESSION PERSISTENCE
 *   Live path:   LiveSession.handleStop → normalizeSession → saveSession (localStorage)
 *   Check path:  FormCheck.handleStop  → normalizeSession → saveSession (localStorage)
 *                                       + base44.entities.FormSession.create (backend)
 *
 * ANALYTICS
 *   Source:  sessionStore.getAllSessions() (localStorage bioneer_sessions_v1)
 *   Selectors: analytics/selectors.js
 *   Pages:   Analytics.jsx, SessionHistory.jsx
 *   Refresh: tick state on each page mount triggers re-derivation
 *
 * FEEDBACK
 *   Visual:  CameraView → poseEngine.computeFormScore + JointIntelligenceRail
 *   Audio:   audioEngine.beep() gated by TemporalFilterEngine.shouldBeep()
 *   Text:    useLiveAnalysis status/cue → CameraView cue banner
 *
 * SYSTEM HEALTH
 *   SystemHealthMonitor (pipeline/runtime/SystemHealthMonitor.js)
 *     → tracks camera, pose, FPS, frameMs
 *     → passive; onStatus callback available for UI warnings
 *
 * TECHNIQUE MODE
 *   TechniqueCompare page → VideoPanel + MetricRail + SourceSelector
 *   → compare/useTechniqueComparison hook
 *   → processes uploaded video through pose pipeline
 *
 * KNOWN GAPS (non-blocking)
 *   - SystemHealthMonitor.onStatus not wired to UI toast yet
 *   - ROM trend data not written into session (rom_summary field present but null)
 *   - Symmetry summary not wired from MovementContextEngine to session save
 */

export const INTEGRATION_MAP = {
  camera:    'live/useCameraStream.js',
  pose:      'live/usePoseRuntime.js',
  inference: 'live/usePoseInferenceLoop.js + pipeline/runtime/FPSGovernor.js',
  analysis:  'motion/hooks/useLiveAnalysis.js → LiveSessionOrchestrator.jsx',
  exercise:  'exerciseLibrary.js + sportsLibrary.js → MovementResolver.js',
  feedback:  'audioEngine.js + TemporalFilterEngine.js + FeedbackScheduler.js',
  session:   'data/sessionNormalizer.js → data/sessionStore.js (localStorage)',
  analytics: 'analytics/selectors.js ← data/sessionStore.js',
  health:    'pipeline/runtime/SystemHealthMonitor.js',
};