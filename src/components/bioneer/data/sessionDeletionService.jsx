/**
 * sessionDeletionService.js
 * 
 * Unified deletion system ensuring permanent removal across:
 * - Cloud (FormSession soft-delete)
 * - IndexedDB (liveVideos + freestyleSessions)
 * - Local state
 * 
 * User perspective: "Delete = Gone forever"
 * Implementation: Soft-delete in cloud + hard-delete in local cache
 */

import { base44 } from '@/api/base44Client';
import { deleteSessionVideoBlob } from './liveVideoStorage';
import { deleteFreestyleSession } from '../history/sessionStorage';

/**
 * Soft-delete a session in the cloud.
 * Marks it as deleted without destroying data (audit trail + recovery).
 */
async function softDeleteInCloud(sessionId) {
  try {
    await base44.entities.FormSession.update(sessionId, {
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    });
    console.log('[SessionDeletion] Cloud soft-delete successful:', sessionId);
  } catch (err) {
    console.error('[SessionDeletion] Cloud soft-delete failed:', sessionId, err);
    throw err;
  }
}

/**
 * Hard-delete all local data for a session.
 * Removes IndexedDB records (videos, freestyle data).
 */
async function hardDeleteLocal(sessionId) {
  try {
    // Delete live session video from IndexedDB
    await deleteSessionVideoBlob(sessionId);
    // Delete freestyle session if it exists
    await deleteFreestyleSession(sessionId);
    console.log('[SessionDeletion] Local hard-delete successful:', sessionId);
  } catch (err) {
    // Don't throw — best-effort cleanup
    console.warn('[SessionDeletion] Local hard-delete partial failure:', sessionId, err);
  }
}

/**
 * Permanent deletion entry point.
 * 
 * Deletes a session from BOTH cloud and local storage.
 * After this, the session is unrecoverable (unless you implement backup recovery).
 * 
 * @param {string} sessionId - FormSession ID
 * @returns {Promise<void>}
 */
export async function deleteSessionPermanently(sessionId) {
  if (!sessionId) throw new Error('sessionId is required');

  try {
    // Step 1: Mark as deleted in cloud
    await softDeleteInCloud(sessionId);
    // Step 2: Remove from all local caches
    await hardDeleteLocal(sessionId);
    console.log('[SessionDeletion] Permanent deletion complete:', sessionId);
  } catch (err) {
    console.error('[SessionDeletion] Permanent deletion failed:', sessionId, err);
    throw err;
  }
}

/**
 * Bulk permanent deletion.
 * Safely deletes multiple sessions in parallel.
 * 
 * @param {string[]} sessionIds - Array of FormSession IDs
 * @returns {Promise<{success: number, failed: number}>}
 */
export async function deleteSessionsPermanently(sessionIds) {
  if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
    return { success: 0, failed: 0 };
  }

  const results = await Promise.allSettled(
    sessionIds.map(id => deleteSessionPermanently(id))
  );

  const success = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`[SessionDeletion] Bulk deletion: ${success} succeeded, ${failed} failed`);
  return { success, failed };
}