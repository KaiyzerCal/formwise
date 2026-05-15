/**
 * persistRecordedSessionVideo.js
 * Shared helper: validate chunks → build Blob → persist to IndexedDB → return videoSrc.
 *
 * Usage:
 *   const result = await persistRecordedSessionVideo({ recordedChunks, mimeType, sessionId })
 *   // result: { videoBlob, videoSrc, mimeType, storageKey } or null on failure
 */
import { saveSessionVideoBlob } from './liveVideoStorage';
import { base44 } from '@/api/base44Client';

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
 * Persist a recorded session video: upload to cloud storage + save to IndexedDB as fallback.
 *
 * Accepts EITHER:
 *   - recordedChunks (Blob[]) — raw MediaRecorder chunks that will be assembled into a Blob
 *   - videoBlob (Blob) — a pre-built video Blob (from useSessionRecorder / useVideoRecorder)
 *
 * @param {object} options
 * @param {Blob[]}  [options.recordedChunks]  - raw MediaRecorder chunks
 * @param {Blob}    [options.videoBlob]        - pre-built video Blob (takes priority)
 * @param {string}  options.mimeType           - mime type used during recording
 * @param {string}  options.sessionId          - canonical session ID
 * @returns {Promise<{videoBlob, videoSrc, mimeType, storageKey, fileUrl} | null>}
 */
export async function persistRecordedSessionVideo({ recordedChunks, videoBlob: preBuiltBlob, mimeType, sessionId }) {
   if (!sessionId) {
     console.warn('[persistVideo] sessionId is required');
     return null;
   }

   const safeMime = mimeType || getBestMimeType();

   // Use pre-built blob if available, otherwise assemble from chunks
   let videoBlob = null;
   if (preBuiltBlob instanceof Blob && preBuiltBlob.size > 0) {
     videoBlob = preBuiltBlob;
   } else if (Array.isArray(recordedChunks) && recordedChunks.length > 0) {
     videoBlob = new Blob(recordedChunks, { type: safeMime });
   }

   if (!videoBlob || videoBlob.size === 0) {
     console.warn('[persistVideo] No video data to persist (no blob and no chunks)');
     return null;
   }

   if (videoBlob.size === 0) {
     console.warn('[persistVideo] Blob is empty after building');
     return null;
   }

   const videoSrc    = URL.createObjectURL(videoBlob);
   const storageKey  = sessionId;
   let fileUrl       = null;

   // Upload to cloud storage (persistent, survives IndexedDB clears)
   try {
     const ext = safeMime.includes('mp4') ? 'mp4' : 'webm';
     const file = new File([videoBlob], `session_${sessionId}.${ext}`, { type: safeMime });
     const result = await base44.integrations.Core.UploadFile({ file });
     fileUrl = result.file_url;
     console.log('[persistVideo] Uploaded to cloud:', fileUrl);
   } catch (err) {
     console.warn('[persistVideo] Cloud upload failed, falling back to IndexedDB only:', err.message);
   }

   // Also persist to IndexedDB as a local cache/fallback
   try {
     await saveSessionVideoBlob(sessionId, videoBlob, safeMime);
   } catch (err) {
     console.warn('[persistVideo] IndexedDB save failed:', err.message);
   }

   console.log('[SESSION_VIDEO_PERSISTED]', { sessionId, size: videoBlob.size, mime: safeMime, fileUrl });
   return { videoBlob, videoSrc, mimeType: safeMime, storageKey, fileUrl };
 }