/**
 * liveVideoStorage.js
 * IndexedDB storage for live session video blobs.
 * Kept separate from freestyle sessionStorage to avoid coupling.
 *
 * Interface:
 *   saveSessionVideoBlob(sessionId, blob, mimeType)
 *   getSessionVideoBlob(sessionId)
 *   getSessionVideoUrl(sessionId)  → object URL (caller must revoke)
 */

const DB_NAME    = 'BioneerLiveVideoDB';
const STORE_NAME = 'liveVideos';
const DB_VERSION = 1;

let _db = null;

async function initDB() {
  if (_db) return _db;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror       = () => reject(req.error);
    req.onsuccess     = () => { _db = req.result; resolve(_db); };
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'sessionId' });
      }
    };
  });
}

/**
 * Persist a video Blob for a live session.
 * @param {string} sessionId
 * @param {Blob}   blob
 * @param {string} mimeType  e.g. 'video/webm'
 */
export async function saveSessionVideoBlob(sessionId, blob, mimeType) {
  if (!sessionId || !(blob instanceof Blob) || blob.size === 0) {
    console.warn('[liveVideoStorage] saveSessionVideoBlob: invalid args', { sessionId, blobSize: blob?.size });
    return null;
  }
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx      = db.transaction([STORE_NAME], 'readwrite');
    const store   = tx.objectStore(STORE_NAME);
    const record  = { sessionId, blob, mimeType, savedAt: new Date().toISOString() };
    const req     = store.put(record);
    req.onerror   = () => reject(req.error);
    req.onsuccess = () => resolve(record);
  });
}

/**
 * Retrieve the stored record for a session.
 * Returns { sessionId, blob, mimeType, savedAt } or null.
 */
export async function getSessionVideoBlob(sessionId) {
  if (!sessionId) return null;
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx      = db.transaction([STORE_NAME], 'readonly');
    const store   = tx.objectStore(STORE_NAME);
    const req     = store.get(sessionId);
    req.onerror   = () => reject(req.error);
    req.onsuccess = () => resolve(req.result || null);
  });
}

/**
 * Convenience: get a playable object URL for a session.
 * Caller is responsible for calling URL.revokeObjectURL() when done.
 * Returns null if no blob is stored.
 */
export async function getSessionVideoUrl(sessionId) {
  const record = await getSessionVideoBlob(sessionId);
  if (!record?.blob) return null;
  return URL.createObjectURL(record.blob);
}

/**
 * Delete stored video blob for a session.
 */
export async function deleteSessionVideoBlob(sessionId) {
  if (!sessionId) return;
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx      = db.transaction([STORE_NAME], 'readwrite');
    const store   = tx.objectStore(STORE_NAME);
    const req     = store.delete(sessionId);
    req.onerror   = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}