/**
 * Technique Converter — transforms freestyle and live history sessions into technique drafts
 */
import { saveTechniqueDraft } from './techniqueStorage';
import { getLiveSessionVideo } from '../history/sessionStorage';

/**
 * Create a technique draft from a freestyle history session
 * Validates session data and initializes blank annotation workspace
 */
export async function createTechniqueDraftFromFreestyleSession(session) {
  // Validate session exists
  if (!session) {
    throw new Error('Unable to send to Technique: session is missing.');
  }

  // Validate video blob
  if (!session.videoBlob || !(session.videoBlob instanceof Blob) || session.videoBlob.size === 0) {
    throw new Error('Unable to send to Technique: saved freestyle video is missing or invalid.');
  }

  // Validate pose frames
  if (!Array.isArray(session.poseFrames)) {
    throw new Error('Unable to send to Technique: pose data is missing.');
  }

  // Generate unique technique ID
  const techniqueId = `technique-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Create draft object
  const draft = {
    techniqueId,
    sourceSessionId: session.sessionId,
    sourceType: 'history_freestyle',
    createdAt: new Date().toISOString(),
    category: session.category || 'freestyle',
    duration: session.duration || 0,
    videoBlob: session.videoBlob,
    thumbnail: session.thumbnail || null,
    poseFrames: session.poseFrames || [],
    angleFrames: session.angleFrames || [],
    compositedVideo: session.compositedVideo || false,
    annotations: [],
    timelineMarkers: [],
    coachNotes: '',
    importedFromHistory: true,
  };

  // Save to storage
  await saveTechniqueDraft(draft);

  return draft;
}