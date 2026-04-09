/**
 * faultAccumulator.js — IndexedDB-based local fault history
 * Tracks chronic faults per exercise for unauthenticated/local-first usage.
 * 
 * Schema:
 *   Store: "faults"
 *   Key: "${exerciseId}__${faultType}"
 *   Fields: occurrenceCount, lastSeen, sessionIds[]
 */

const DB_NAME = 'BioneerFaultHistory';
const DB_VERSION = 1;
const STORE_NAME = 'faults';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Log a fault occurrence for a given exercise + fault type.
 * Increments occurrenceCount and appends sessionId.
 */
export async function logFault(exerciseId, faultType, sessionId) {
  const db = await openDB();
  const key = `${exerciseId}__${faultType}`;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(key);

    getReq.onsuccess = () => {
      const existing = getReq.result || {
        key,
        exerciseId,
        faultType,
        occurrenceCount: 0,
        lastSeen: null,
        sessionIds: [],
      };

      existing.occurrenceCount += 1;
      existing.lastSeen = new Date().toISOString();
      if (sessionId && !existing.sessionIds.includes(sessionId)) {
        existing.sessionIds.push(sessionId);
        // Keep last 50 session IDs
        if (existing.sessionIds.length > 50) {
          existing.sessionIds = existing.sessionIds.slice(-50);
        }
      }

      store.put(existing);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get all faults for a given exercise.
 * Returns array of { faultType, occurrenceCount, lastSeen, sessionIds }
 */
export async function getFaultsForExercise(exerciseId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const all = req.result || [];
      resolve(all.filter(f => f.exerciseId === exerciseId));
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get chronic faults (occurrenceCount >= threshold) for an exercise.
 * Returns array sorted by occurrence (most frequent first).
 */
export async function getChronicFaults(exerciseId, threshold = 3) {
  const faults = await getFaultsForExercise(exerciseId);
  return faults
    .filter(f => f.occurrenceCount >= threshold)
    .sort((a, b) => b.occurrenceCount - a.occurrenceCount);
}

/**
 * Build a user movement profile from local fault history for PredictiveCoachingEngine.
 * Returns { issueFrequency: { [faultType]: number } }
 */
export async function getLocalMovementProfile(exerciseId) {
  const faults = await getFaultsForExercise(exerciseId);
  const issueFrequency = {};
  for (const f of faults) {
    issueFrequency[f.faultType] = f.occurrenceCount;
  }
  return { issueFrequency };
}