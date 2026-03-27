/**
 * Voice Coaching System exports
 * 
 * Session-based coaching (post-session analysis):
 */
export { generateCoachingEvents, filterByIntensity, isRepetitiveMessage } from './CoachingEventGenerator';
export { COACHING_LIBRARY, getCoachingCue, getExerciseCoachingCues } from './coachingLibrary';
export { getVoiceCoachingEngine, resetVoiceCoachingEngine } from './VoiceCoachingEngine';
export { useCoachingPlayer } from './useCoachingPlayer';
export { useCoachingOverlay } from './useCoachingOverlay';
export { default as CoachingControlPanel } from './CoachingControlPanel.jsx';
export { default as TechniqueStudioCoachingPanel } from './TechniqueStudioCoachingPanel.jsx';

/**
 * Real-time coaching (live during capture):
 */
export { detectRealtimeIssues } from './RealtimeIssueDetector';
export { PredictiveCoachingEngine } from './PredictiveCoachingEngine';
export { RealtimeCoachScheduler } from './RealtimeCoachScheduler';
export { getRealtimeVoiceEngine, resetRealtimeVoiceEngine } from './RealtimeVoiceEngine';
export { useLiveCoaching } from './useLiveCoaching';
export { SessionLearningIntegration } from './SessionLearningIntegration';
export { default as LiveCoachingOverlay } from './LiveCoachingOverlay.jsx';
export { default as LiveCoachingControls } from './LiveCoachingControls.jsx';