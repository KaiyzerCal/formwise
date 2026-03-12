/**
 * Technique Draft Storage — IndexedDB-backed persistence for technique drafts
 * Stores recorded videos and metadata for editable technique analysis
 */

const DB_NAME = 'BioneerTechnique';
const DB_VERSION = 1;
const STORE_NAME = 'techniqueDrafts';

/**
 * Initialize or get IndexedDB connection
 */
function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'techniqueId' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('sourceSessionId', 'sourceSessionId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a technique draft
 */
export async function saveTechniqueDraft(draft) {
  if (!draft.techniqueId) {
    throw new Error('Draft must have a techniqueId');
  }

  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(draft);

    request.onsuccess = () => resolve(draft);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a technique draft by ID
 */
export async function getTechniqueDraft(techniqueId) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(techniqueId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * List all technique drafts
 */
export async function listTechniqueDrafts() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a technique draft
 */
export async function deleteTechniqueDraft(techniqueId) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(techniqueId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}