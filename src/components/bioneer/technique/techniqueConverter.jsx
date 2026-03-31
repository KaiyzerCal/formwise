/**
 * Technique Converter — transforms history sessions into technique drafts.
 * Supports both freestyle sessions (videoBlob) and live sessions (videoSrc from IndexedDB).
 */
import { saveTechniqueDraft } from './techniqueStorage';
import { getSessionVideoBlob } from '../data/liveVideoStorage';

/**
 * Create a technique draft from a freestyle history session.
 */
export async function createTechniqueDraftFromFreestyleSession(session) {
  if (!session) throw new Error('Unable to send to Technique: session is missing.');

  if (!session.videoBlob || !(session.videoBlob instanceof Blob) || session.videoBlob.size === 0) {
    throw new Error('Unable to send to Technique: saved freestyle video is missing or invalid.');
  }
  if (!Array.isArray(session.poseFrames)) {
    throw new Error('Unable to send to Technique: pose data is missing.');
  }

  const techniqueId = `technique-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

  await saveTechniqueDraft(draft);
  return draft;
}

/**
 * Create a technique draft from a saved live (strength/sports) session.
 * Tries IndexedDB first for the video blob, falls back to cloud video_url.
 */
export async function createTechniqueDraftFromLiveSession(session) {
  if (!session) throw new Error('Unable to send to Technique: session is missing.');

  const storageKey = session.video_storage_key || session.session_id;
  let videoBlob = null;
  let videoUrl = null;

  // Try local IndexedDB first
  try {
    const record = await getSessionVideoBlob(storageKey);
    videoBlob = record?.blob || null;
  } catch (err) {
    console.warn('[techniqueConverter] Could not load video blob from IndexedDB:', err);
  }

  // Fall back to cloud video_url
  if (!videoBlob && session.video_url) {
    videoUrl = session.video_url;
  }

  if (!videoBlob && !videoUrl) {
    throw new Error('Unable to send to Technique: no video found for this session. The video may not have been recorded.');
  }

  const techniqueId = `technique-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const draft = {
    techniqueId,
    sourceSessionId: session.session_id,
    sourceType: 'history_live',
    createdAt: new Date().toISOString(),
    category: session.category || session.movement_name || 'live',
    duration: session.duration_seconds || 0,
    videoBlob,
    videoUrl,
    thumbnail: null,
    poseFrames: session.poseFrames || [],
    angleFrames: [],
    compositedVideo: false,
    annotations: session.annotations || [],
    timelineMarkers: [],
    coachNotes: '',
    importedFromHistory: true,
    metrics: {
      average_form_score:  session.average_form_score,
      rep_count:           session.rep_count,
      top_faults:          session.top_faults,
      movement_name:       session.movement_name,
    },
  };

  await saveTechniqueDraft(draft);
  return draft;
}