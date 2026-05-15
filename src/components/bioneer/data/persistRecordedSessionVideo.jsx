/**
 * persistRecordedSessionVideo.js
 * Validate → build Blob → upload to Supabase Storage → IndexedDB fallback.
 */
import { saveSessionVideoBlob } from './liveVideoStorage';
import { supabase, getCurrentUser } from '@/api/supabaseClient';

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024; // 500 MB
const ALLOWED_MIME_PREFIXES = ['video/webm', 'video/mp4', 'video/quicktime'];

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

function validateBlob(blob, mimeType) {
  if (!blob || blob.size === 0) {
    return 'No video data (empty blob)';
  }
  if (blob.size > MAX_UPLOAD_BYTES) {
    return `Video exceeds maximum size of ${MAX_UPLOAD_BYTES / 1024 / 1024} MB`;
  }
  const baseMime = mimeType?.split(';')[0] ?? '';
  if (!ALLOWED_MIME_PREFIXES.some(p => baseMime.startsWith(p))) {
    return `Unsupported video format: ${mimeType}`;
  }
  return null; // valid
}

/**
 * Persist a recorded session video: upload to Supabase Storage + IndexedDB fallback.
 *
 * @param {object} options
 * @param {Blob[]}  [options.recordedChunks]  - raw MediaRecorder chunks
 * @param {Blob}    [options.videoBlob]        - pre-built Blob (takes priority)
 * @param {string}  options.mimeType
 * @param {string}  options.sessionId
 * @returns {Promise<{videoBlob, videoSrc, mimeType, storageKey, fileUrl} | null>}
 */
export async function persistRecordedSessionVideo({ recordedChunks, videoBlob: preBuiltBlob, mimeType, sessionId }) {
  if (!sessionId) {
    console.warn('[persistVideo] sessionId is required');
    return null;
  }

  const safeMime = mimeType || getBestMimeType();

  let videoBlob = null;
  if (preBuiltBlob instanceof Blob && preBuiltBlob.size > 0) {
    videoBlob = preBuiltBlob;
  } else if (Array.isArray(recordedChunks) && recordedChunks.length > 0) {
    videoBlob = new Blob(recordedChunks, { type: safeMime });
  }

  const validationError = validateBlob(videoBlob, safeMime);
  if (validationError) {
    console.warn('[persistVideo]', validationError);
    return null;
  }

  const videoSrc   = URL.createObjectURL(videoBlob);
  const storageKey = sessionId;
  let fileUrl      = null;

  // Upload to Supabase Storage
  try {
    const user = await getCurrentUser();
    const ext  = safeMime.includes('mp4') ? 'mp4' : 'webm';
    const path = `${user?.id ?? 'anon'}/${sessionId}.${ext}`;

    const { data, error } = await supabase.storage
      .from('session-videos')
      .upload(path, videoBlob, { contentType: safeMime, upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('session-videos').getPublicUrl(data.path);
    fileUrl = publicUrl;
  } catch (err) {
    console.warn('[persistVideo] Cloud upload failed, falling back to IndexedDB only:', err.message);
  }

  // IndexedDB fallback / local cache
  try {
    await saveSessionVideoBlob(sessionId, videoBlob, safeMime);
  } catch (err) {
    console.warn('[persistVideo] IndexedDB save failed:', err.message);
  }

  return { videoBlob, videoSrc, mimeType: safeMime, storageKey, fileUrl };
}
