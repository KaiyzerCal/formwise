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

/**
 * Create a technique draft from a saved live session (Strength or Sports).
 * Loads video blob from IndexedDB using videoStorageKey.
 */
export async function createTechniqueDraftFromLiveSession({ session, videoSrc, videoStorageKey }) {
  if (!session) throw new Error('Unable to send to Technique: session is missing.');

  const key = videoStorageKey || session.videoStorageKey;
  let resolvedVideoBlob = null;
  let resolvedVideoSrc = videoSrc || session.videoSrc || null;
  let poseFrames = [];
  let angleFrames = [];

  if (key) {
    try {
      const stored = await getLiveSessionVideo(key);
      if (stored) {
        resolvedVideoBlob = stored.videoBlob;
        resolvedVideoSrc = stored.videoSrc;
        poseFrames = stored.poseFrames ?? [];
        angleFrames = stored.angleFrames ?? [];
      }
    } catch (err) {
      console.warn('[techniqueConverter] Failed to load live session video from IndexedDB:', err);
    }
  }

  if (!resolvedVideoBlob && !resolvedVideoSrc) {
    throw new Error('Unable to send to Technique: no video available for this session.');
  }

  const techniqueId = `technique-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const draft = {
    techniqueId,
    sourceSessionId: session.session_id,
    sourceType: 'history_live',
    createdAt: new Date().toISOString(),
    category: session.category || 'strength',
    movementName: session.movement_name || session.movement_id || 'Live Session',
    duration: session.duration_seconds || 0,
    videoBlob: resolvedVideoBlob,
    videoSrc: resolvedVideoSrc,
    thumbnail: null,
    poseFrames,
    angleFrames,
    annotations: [],
    timelineMarkers: [],
    coachNotes: '',
    importedFromHistory: true,
    // Carry over metrics for reference
    metrics: {
      average_form_score: session.average_form_score,
      rep_count: session.rep_count,
      top_faults: session.top_faults,
    },
  };

  await saveTechniqueDraft(draft);
  return draft;
}