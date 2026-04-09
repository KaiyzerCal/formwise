/**
 * faultAccumulator.js — Local IndexedDB-backed fault history
 * Works offline, no auth required. Feeds PredictiveCoachingEngine.
 */

const DB_NAME = 'BioneerFaultHistory';
const DB_VERSION = 1;
const STORE = 'faults';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('exerciseId', 'exerciseId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function logFault(exerciseId, faultType, sessionId) {
  const db = await openDB();
  const id = `${exerciseId}__${faultType}`;
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const existing = await new Promise(r => {
    const req = store.get(id);
    req.onsuccess = () => r(req.result);
    req.onerror = () => r(null);
  });
  const record = existing || {
    id, exerciseId, faultType,
    occurrenceCount: 0, lastSeen: null, sessionIds: []
  };
  record.occurrenceCount += 1;
  record.lastSeen = new Date().toISOString();
  if (!record.sessionIds.includes(sessionId)) {
    record.sessionIds.push(sessionId);
  }
  store.put(record);
}

export async function getChronicFaults(exerciseId, threshold = 3) {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readonly');
  const index = tx.objectStore(STORE).index('exerciseId');
  const all = await new Promise(r => {
    const req = index.getAll(exerciseId);
    req.onsuccess = () => r(req.result);
    req.onerror = () => r([]);
  });
  return all.filter(f => f.occurrenceCount >= threshold);
}

export async function getLocalMovementProfile(exerciseId) {
  const faults = await getChronicFaults(exerciseId);
  const issueFrequency = {};
  faults.forEach(f => {
    issueFrequency[f.faultType] = f.occurrenceCount;
  });
  return {
    exerciseId,
    chronicFaults: faults,
    issueFrequency,
    totalSessions: faults.length > 0
      ? Math.max(...faults.map(f => f.sessionIds.length))
      : 0
  };
}