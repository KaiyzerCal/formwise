import { supabase } from '@/api/supabaseClient';
import { deleteSessionVideoBlob } from './liveVideoStorage';
import { deleteFreestyleSession } from '../history/sessionStorage';

async function softDeleteInCloud(sessionId) {
  const { error } = await supabase
    .from('form_sessions')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', sessionId);
  if (error) { console.error('[SessionDeletion] soft-delete failed:', sessionId, error); throw error; }
}

async function hardDeleteLocal(sessionId) {
  try { await deleteSessionVideoBlob(sessionId); } catch {}
  try { await deleteFreestyleSession(sessionId); } catch {}
}

export async function deleteSessionPermanently(sessionId) {
  if (!sessionId) throw new Error('sessionId is required');
  await softDeleteInCloud(sessionId);
  await hardDeleteLocal(sessionId);
}

export async function deleteSessionsPermanently(sessionIds) {
  if (!Array.isArray(sessionIds) || !sessionIds.length) return { success: 0, failed: 0 };
  const results = await Promise.allSettled(sessionIds.map(id => deleteSessionPermanently(id)));
  return {
    success: results.filter(r => r.status === 'fulfilled').length,
    failed:  results.filter(r => r.status === 'rejected').length,
  };
}
