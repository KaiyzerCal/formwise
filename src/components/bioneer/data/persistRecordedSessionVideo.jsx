/**
 * persistRecordedSessionVideo.js
 * Shared helper: validate chunks → build Blob → persist to IndexedDB → return videoSrc.
 *
 * Usage:
 *   const result = await persistRecordedSessionVideo({ recordedChunks, mimeType, sessionId })
 *   // result: { videoBlob, videoSrc, mimeType, storageKey } or null on failure
 */
import { saveSessionVideoBlob } from './liveVideoStorage';

/**
 * Pick best available mime type for recording.
 * Returns the first supported type, fallback to 'video/webm'.
 */
export function getBestMimeType() {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'video/webm';
}

/**
 * Build a Blob from recorded chunks and persist to IndexedDB.
 *
 * @param {object} options
 * @param {Blob[]}  options.recordedChunks  - raw MediaRecorder chunks
 * @param {string}  options.mimeType        - mime type used during recording
 * @param {string}  options.sessionId       - canonical session ID
 * @returns {Promise<{videoBlob, videoSrc, mimeType, storageKey} | null>}
 */
export async function persistRecordedSessionVideo({ recordedChunks, mimeType, sessionId }) {
   if (!Array.isArray(recordedChunks) || recordedChunks.length === 0) {
     console.warn('[persistVideo] No recorded chunks to persist');
     console.log('[SESSION_INCOMPLETE] Missing video chunks');
     return null;
   }
   if (!sessionId) {
     console.warn('[persistVideo] sessionId is required');
     console.log('[SESSION_INCOMPLETE] Missing sessionId');
     return null;
   }

   const safeMime    = mimeType || getBestMimeType();
   const videoBlob   = new Blob(recordedChunks, { type: safeMime });

   if (videoBlob.size === 0) {
     console.warn('[persistVideo] Blob is empty after building');
     console.log('[SESSION_INCOMPLETE] Empty video blob');
     return null;
   }

   const videoSrc    = URL.createObjectURL(videoBlob);
   const storageKey  = sessionId;

   try {
     await saveSessionVideoBlob(sessionId, videoBlob, safeMime);
   } catch (err) {
     console.error('[persistVideo] Failed to persist to IndexedDB:', err);
     // Still return blob/url — replay will work this session even without persistence
   }

   console.log('[SESSION_VIDEO_PERSISTED]', { sessionId, size: videoBlob.size, mime: safeMime });
   return { videoBlob, videoSrc, mimeType: safeMime, storageKey };
 }