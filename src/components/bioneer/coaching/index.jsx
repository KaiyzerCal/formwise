/**
 * Voice Coaching System exports
 */

export { generateCoachingEvents, filterByIntensity, isRepetitiveMessage } from './CoachingEventGenerator';
export { COACHING_LIBRARY, getCoachingCue, getExerciseCoachingCues } from './coachingLibrary';
export { getVoiceCoachingEngine, resetVoiceCoachingEngine } from './VoiceCoachingEngine';
export { useCoachingPlayer } from './useCoachingPlayer';
export { useCoachingOverlay } from './useCoachingOverlay';
export { default as CoachingControlPanel } from './CoachingControlPanel.jsx';
export { default as TechniqueStudioCoachingPanel } from './TechniqueStudioCoachingPanel.jsx';