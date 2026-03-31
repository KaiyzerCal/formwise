import { deleteSession } from './unifiedSessionStore';
import { deleteSessionVideoBlob } from './liveVideoStorage';
import { deleteFreestyleSession } from '../history/sessionStorage';

/**
 * Delete a session permanently — removes from cloud (soft-delete),
 * local cache, IndexedDB video, and freestyle storage.
 */
export async function deleteSessionPermanently(sessionId) {
  if (!sessionId) throw new Error('sessionId is required');
  
  // Delete from cloud + cache via unified store
  await deleteSession(sessionId);
  
  // Clean up local video/freestyle data
  try { await deleteSessionVideoBlob(sessionId); } catch {}
  try { await deleteFreestyleSession(sessionId); } catch {}
}

export async function deleteSessionsPermanently(sessionIds) {
  if (!Array.isArray(sessionIds) || !sessionIds.length) return { success: 0, failed: 0 };
  const results = await Promise.allSettled(sessionIds.map(id => deleteSessionPermanently(id)));
  return {
    success: results.filter(r => r.status === 'fulfilled').length,
    failed:  results.filter(r => r.status === 'rejected').length,
  };
}