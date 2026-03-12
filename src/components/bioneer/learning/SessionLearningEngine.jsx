/**
 * SessionLearningEngine.js
 * Captures and persists movement metrics after each session
 * Uses IndexedDB for local-first storage, non-blocking
 */

const DB_NAME = 'BioneerLearning';
const DB_VERSION = 1;
const STORE_NAME = 'movement_sessions';

let db = null;

/**
 * Initialize IndexedDB connection
 */
export async function initLearningDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('movement', 'movement', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('movement_timestamp', ['movement', 'timestamp'], { unique: false });
      }
    };
  });
}

/**
 * Capture rep-level metrics during session
 * Called by session orchestrator after each rep is detected
 */
export function captureRepMetrics(repData) {
  if (!db) return console.warn('Learning DB not initialized');

  const metrics = {
    movement: repData.movement,
    rep: repData.repNumber,
    kneeAngleMin: repData.kneeAngleMin || 0,
    kneeAngleMax: repData.kneeAngleMax || 0,
    hipAngleMin: repData.hipAngleMin || 0,
    hipAngleMax: repData.hipAngleMax || 0,
    shoulderAngleMin: repData.shoulderAngleMin || 0,
    shoulderAngleMax: repData.shoulderAngleMax || 0,
    spineAngle: repData.spineAngle || 0,
    repDuration: repData.repDuration || 0,
    stabilityVariance: repData.stabilityVariance || 0,
    faultsDetected: repData.faultsDetected || [],
    formScore: repData.formScore || 0,
    timestamp: Date.now(),
  };

  return saveRepMetric(metrics);
}

/**
 * Save individual rep metric to IndexedDB
 */
function saveRepMetric(metric) {
  if (!db) return Promise.reject('DB not initialized');

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(metric);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Retrieve all metrics for a specific movement
 */
export async function getMovementMetrics(movement, limit = 100) {
  if (!db) {
    await initLearningDB();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('movement');
    const range = IDBKeyRange.only(movement);
    const request = index.getAll(range);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const results = request.result.sort((a, b) => b.timestamp - a.timestamp);
      resolve(results.slice(0, limit));
    };
  });
}

/**
 * Retrieve session-level summary metrics
 */
export async function getSessionSummaryMetrics(movement, sessionStartTime) {
  const metrics = await getMovementMetrics(movement, 200);
  const sessionMetrics = metrics.filter(m => m.timestamp >= sessionStartTime);

  if (sessionMetrics.length === 0) return null;

  const formScores = sessionMetrics.map(m => m.formScore);
  const durations = sessionMetrics.map(m => m.repDuration);
  const stabilityScores = sessionMetrics.map(m => 1 - m.stabilityVariance);

  return {
    movement,
    repCount: sessionMetrics.length,
    avgFormScore: Math.round(formScores.reduce((a, b) => a + b, 0) / formScores.length),
    peakFormScore: Math.max(...formScores),
    lowestFormScore: Math.min(...formScores),
    avgRepDuration: (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2),
    avgStability: (stabilityScores.reduce((a, b) => a + b, 0) / stabilityScores.length).toFixed(2),
    allMetrics: sessionMetrics,
  };
}

/**
 * Get all movements tracked
 */
export async function getTrackedMovements() {
  if (!db) {
    await initLearningDB();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const movements = [...new Set(request.result.map(m => m.movement))];
      resolve(movements);
    };
  });
}

/**
 * Clear all learning data for a movement
 */
export async function clearMovementHistory(movement) {
  if (!db) return;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('movement');
    const range = IDBKeyRange.only(movement);
    const request = index.openCursor(range);

    request.onerror = () => reject(request.error);
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      } else {
        resolve();
      }
    };
  });
}

/**
 * Export learning data as JSON
 */
export async function exportLearningData() {
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const data = {
        exported: new Date().toISOString(),
        recordCount: request.result.length,
        records: request.result,
      };
      resolve(data);
    };
  });
}

export default {
  initLearningDB,
  captureRepMetrics,
  getMovementMetrics,
  getSessionSummaryMetrics,
  getTrackedMovements,
  clearMovementHistory,
  exportLearningData,
};