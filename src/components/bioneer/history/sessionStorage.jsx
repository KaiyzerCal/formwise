/**
 * sessionStorage — IndexedDB-backed persistence for freestyle sessions
 * Handles session save, load, delete, and thumbnail generation
 */

const DB_NAME = 'BioneerFreestyleDB';
const STORE_NAME = 'freestyleSessions';
const DB_VERSION = 1;

let dbInstance = null;

/**
 * Initialize IndexedDB
 */
async function initDB() {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'sessionId' });
      }
    };
  });
}

/**
 * Generate thumbnail from video blob (first frame)
 * Waits for actual first frame to be available before drawing
 */
async function generateThumbnail(videoBlob) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const blobUrl = URL.createObjectURL(videoBlob);

    const cleanup = () => {
      URL.revokeObjectURL(blobUrl);
    };

    const onSuccess = (thumbnailBlob) => {
      cleanup();
      resolve(thumbnailBlob);
    };

    const onError = () => {
      cleanup();
      resolve(null); // Fail gracefully — still save session without thumbnail
    };

    video.onloadedmetadata = () => {
      // Set to first frame and wait for it to load
      video.currentTime = 0;
    };

    video.onseeked = () => {
      // Now the first frame is ready
      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            onSuccess(blob);
          } else {
            onError();
          }
        }, 'image/jpeg', 0.8);
      } catch (error) {
        console.warn('Failed to generate thumbnail:', error);
        onError();
      }
    };

    video.onerror = onError;
    video.src = blobUrl;
  });
}

/**
 * Save freestyle session to IndexedDB
 */
export async function saveFreestyleSession({
  sessionId,
  mode,
  category,
  duration,
  videoBlob,
  poseFrames,
  angleFrames,
}) {
  const db = await initDB();

  // Generate thumbnail from video
  const thumbnail = await generateThumbnail(videoBlob);

  const session = {
    sessionId,
    mode,
    category,
    duration,
    createdAt: new Date().toISOString(),
    videoBlob,
    poseFrames,
    angleFrames,
    thumbnail,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(session);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(session);
  });
}

/**
 * Load session from IndexedDB
 */
export async function loadFreestyleSession(sessionId) {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(sessionId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

/**
 * Get all freestyle sessions
 */
export async function getAllFreestyleSessions() {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const sessions = request.result.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      resolve(sessions);
    };
  });
}

/**
 * Delete session from IndexedDB
 */
export async function deleteFreestyleSession(sessionId) {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(sessionId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Get thumbnail URL for session
 */
export function getThumbnailUrl(thumbnailBlob) {
  if (!thumbnailBlob) return null;
  return URL.createObjectURL(thumbnailBlob);
}

/**
 * Get video URL for playback
 */
export function getVideoUrl(videoBlob) {
  if (!videoBlob) return null;
  return URL.createObjectURL(videoBlob);
}