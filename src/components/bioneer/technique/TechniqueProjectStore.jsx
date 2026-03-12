/**
 * TechniqueProjectStore
 * Lightweight persistence for technique session state
 * Stores project metadata, annotations, and playback state
 */

const DB_NAME = 'BioneerTechniqueProjects';
const STORE_NAME = 'projects';

/**
 * Open IndexedDB connection
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);

    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('videoId', 'videoId', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
  });
}

/**
 * Save a technique project
 */
export async function saveTechniqueProject(project) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const projectToSave = {
      id: project.id || `project-${Date.now()}`,
      videoId: project.videoId,
      videoURL: project.videoURL,
      annotations: project.annotations || [],
      selectedReference: project.selectedReference || null,
      playbackSpeed: project.playbackSpeed || 1,
      coachNotes: project.coachNotes || '',
      focusTags: project.focusTags || [],
      metadata: project.metadata || {},
      createdAt: project.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const req = store.put(projectToSave);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(projectToSave);
    });
  } catch (error) {
    console.error('Failed to save technique project:', error);
    throw error;
  }
}

/**
 * Load a technique project by ID
 */
export async function getTechniqueProject(projectId) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const req = store.get(projectId);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result || null);
    });
  } catch (error) {
    console.error('Failed to get technique project:', error);
    return null;
  }
}

/**
 * List all projects for a video
 */
export async function listProjectsForVideo(videoId) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('videoId');

    return new Promise((resolve, reject) => {
      const req = index.getAll(videoId);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result || []);
    });
  } catch (error) {
    console.error('Failed to list projects:', error);
    return [];
  }
}

/**
 * Delete a technique project
 */
export async function deleteTechniqueProject(projectId) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const req = store.delete(projectId);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(true);
    });
  } catch (error) {
    console.error('Failed to delete technique project:', error);
    throw error;
  }
}

/**
 * Export project state for sharing
 * Strips large blobs, includes only essential data
 */
export function prepareProjectExportPayload(project) {
  return {
    id: project.id,
    videoId: project.videoId,
    videoURL: project.videoURL,
    annotations: project.annotations || [],
    selectedReference: project.selectedReference || null,
    focusTags: project.focusTags || [],
    coachNotes: project.coachNotes || '',
    metadata: project.metadata || {},
    exportedAt: new Date().toISOString(),
    appVersion: '1.0',
  };
}