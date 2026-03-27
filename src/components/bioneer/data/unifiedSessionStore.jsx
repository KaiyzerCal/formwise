/**
 * unifiedSessionStore.jsx
 * Unified session persistence: localStorage (instant) + base44 cloud (background sync).
 * Drop-in replacement for sessionStore.js — same exported API.
 */

import { base44 } from '@/api/base44Client';

const STORE_KEY = 'bioneer_sessions_v1';
const SYNC_KEY  = 'bioneer_last_sync';

// ── Sync status event bus ──────────────────────────────────────────────────────
const listeners = new Set();
let _syncStatus = 'idle'; // 'idle' | 'syncing' | 'synced' | 'offline'
let _lastSyncAt  = localStorage.getItem(SYNC_KEY) ? new Date(localStorage.getItem(SYNC_KEY)) : null;

export function subscribeSyncStatus(fn) {
  listeners.add(fn);
  fn({ status: _syncStatus, lastSyncAt: _lastSyncAt });
  return () => listeners.delete(fn);
}

function emit(status) {
  _syncStatus = status;
  if (status === 'synced') {
    _lastSyncAt = new Date();
    localStorage.setItem(SYNC_KEY, _lastSyncAt.toISOString());
  }
  listeners.forEach(fn => fn({ status, lastSyncAt: _lastSyncAt }));
}

// ── localStorage helpers ───────────────────────────────────────────────────────
function readAll() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function writeAll(sessions) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(sessions));
  } catch { /* quota exceeded — fail silently */ }
}

// ── Cloud helpers ──────────────────────────────────────────────────────────────
function toCloudPayload(session) {
  return {
    exercise_id:          session.movement_id ?? session.movement_name ?? session.exercise_id ?? 'unknown',
    category:             session.category ?? 'strength',
    duration_seconds:     session.duration_seconds ?? 0,
    form_score_overall:   session.average_form_score ?? session.form_score_overall ?? 0,
    movement_score:       session.movement_score ?? 0,
    form_score_peak:      session.highest_form_score ?? session.form_score_peak ?? 0,
    form_score_lowest:    session.lowest_form_score ?? session.form_score_lowest ?? 0,
    reps_detected:        session.rep_count ?? session.reps_detected ?? 0,
    rep_count:            session.rep_count ?? 0,
    average_form_score:   session.average_form_score ?? 0,
    highest_form_score:   session.highest_form_score ?? 0,
    lowest_form_score:    session.lowest_form_score ?? 0,
    mastery_avg:          session.mastery_avg ?? 0,
    alerts:               session.alerts ?? [],
    phases:               session.phases ?? {},
    form_timeline:        session.form_timeline ?? [],
    top_faults:           session.top_faults ?? [],
    risk_flags:           session.risk_flags ?? [],
    body_side_bias:       session.body_side_bias ?? 'balanced',
    tracking_confidence:  session.tracking_confidence ?? 0,
    session_status:       session.session_status ?? 'complete',
    started_at:           session.started_at ?? new Date().toISOString(),
    movement_id:          session.movement_id ?? null,
    movement_name:        session.movement_name ?? null,
  };
}

function fromCloudRecord(record) {
   // Convert base44 record → local canonical session shape
   return {
     session_id:          record.id, // NO prefix — use cloud ID directly
     _cloud_id:           record.id,
     exercise_id:         record.exercise_id,
     category:            record.category,
     duration_seconds:    record.duration_seconds,
     average_form_score:  record.average_form_score ?? record.form_score_overall ?? 0,
     highest_form_score:  record.highest_form_score ?? record.form_score_peak ?? 0,
     lowest_form_score:   record.lowest_form_score ?? record.form_score_lowest ?? 0,
     movement_score:      record.movement_score ?? 0,
     rep_count:           record.rep_count ?? record.reps_detected ?? 0,
     reps_detected:       record.reps_detected ?? 0,
     mastery_avg:         record.mastery_avg ?? 0,
     alerts:              record.alerts ?? [],
     phases:              record.phases ?? {},
     form_timeline:       record.form_timeline ?? [],
     top_faults:          record.top_faults ?? [],
     risk_flags:          record.risk_flags ?? [],
     body_side_bias:      record.body_side_bias ?? 'balanced',
     tracking_confidence: record.tracking_confidence ?? 0,
     session_status:      record.session_status ?? 'complete',
     started_at:          record.started_at ?? record.created_date,
     movement_id:         record.movement_id ?? record.exercise_id,
     movement_name:       record.movement_name ?? record.exercise_id,
     _source:             'cloud',
   };
}

// Normalize session IDs — remove "cloud_" prefix for consistency
function normalizeSession(session) {
  if (!session) return session;
  const normalized = { ...session };
  // Remove cloud_ prefix if present
  if (typeof normalized.session_id === 'string' && normalized.session_id.startsWith('cloud_')) {
    normalized.session_id = normalized.session_id.substring(6);
  }
  // Ensure cloud_id is set
  if (!normalized._cloud_id && normalized.session_id) {
    normalized._cloud_id = normalized.session_id;
  }
  return normalized;
}

async function pushToCloud(session) {
  emit('syncing');
  try {
    const payload = toCloudPayload(session);
    await base44.entities.FormSession.create(payload);
    emit('synced');
  } catch {
    emit('offline');
  }
}

// ── Core CRUD (same API as sessionStore.js) ───────────────────────────────────

export function saveSession(session) {
   if (!session?.session_id) {
     console.warn('[SESSION_SAVE] Missing session_id');
     return null;
   }

   // Normalize session ID
   const normalized = normalizeSession(session);

   console.log('[SESSION_SAVE_START]', { session_id: normalized.session_id, has_video: !!normalized.video_storage_key });

   const all = readAll();
   const idx = all.findIndex(s => s.session_id === normalized.session_id);
   if (idx >= 0) { all[idx] = normalized; } else { all.push(normalized); }
   writeAll(all);

   // Background cloud push — don't await
   pushToCloud(normalized).then(() => {
     console.log('[SESSION_SAVE_SUCCESS]', { session_id: normalized.session_id });
   }).catch(err => {
     console.warn('[SESSION_SAVE_FAILED]', { session_id: normalized.session_id, error: err.message });
   });

   return normalized;
 }

export function getAllSessions() {
  return readAll()
    .filter(s => !s.is_deleted) // Filter out soft-deleted sessions
    .sort((a, b) =>
      new Date(b.started_at || 0) - new Date(a.started_at || 0)
    );
}

export function getSessionById(id) {
  return readAll().find(s => s.session_id === id) ?? null;
}

export function updateSession(id, patch) {
  const all = readAll();
  const idx = all.findIndex(s => s.session_id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch };
  writeAll(all);
  return all[idx];
}

export function deleteSession(id) {
  writeAll(readAll().filter(s => s.session_id !== id));
}

export function clearAllSessions() {
  writeAll([]);
}

// ── Analytics helpers (re-exported from original) ─────────────────────────────

export function getSessionsByMovement(movementId) {
  return readAll()
    .filter(s => s.movement_id === movementId)
    .sort((a, b) => new Date(b.started_at || 0) - new Date(a.started_at || 0));
}

export function getRecentSessions(limit = 10) {
  return getAllSessions().slice(0, limit);
}

export function getBestSessionsByMovement(movementId, limit = 5) {
  return getSessionsByMovement(movementId)
    .sort((a, b) => (b.average_form_score ?? 0) - (a.average_form_score ?? 0))
    .slice(0, limit);
}

export function getFaultTrendData() {
  return getAllSessions().slice(0, 20).reverse().map(s => ({
    date: s.started_at ? new Date(s.started_at).toLocaleDateString() : '—',
    faultCount: s.top_faults?.length ?? 0,
    topFault: s.top_faults?.[0] ?? null,
  }));
}

export function getScoreTrendData() {
  return getAllSessions().slice(0, 20).reverse().map((s, i) => ({
    index: i + 1,
    score: s.average_form_score ?? 0,
    movement: s.movement_name ?? s.movement_id ?? '—',
    date: s.started_at ? new Date(s.started_at).toLocaleDateString() : '—',
  }));
}

export function getMovementSessionHistory(movementId) {
  return getSessionsByMovement(movementId).map(s => ({
    session_id: s.session_id,
    date: s.started_at,
    score: s.average_form_score,
    reps: s.rep_count,
    duration: s.duration_seconds,
    status: s.session_status,
  }));
}

export function getAggregateStats() {
  const all = getAllSessions().filter(s => s.session_status === 'complete' || s.session_status === 'partial');
  if (!all.length) return null;
  const totalReps = all.reduce((sum, s) => sum + (s.rep_count ?? 0), 0);
  const totalTime = all.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
  const avgScore  = Math.round(all.reduce((sum, s) => sum + (s.average_form_score ?? 0), 0) / all.length);
  const bestScore = Math.max(...all.map(s => s.highest_form_score ?? 0));
  const faultMap  = {};
  all.forEach(s => (s.top_faults ?? []).forEach(f => { faultMap[f] = (faultMap[f] ?? 0) + 1; }));
  const topFaults = Object.entries(faultMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([fault, count]) => ({ fault, count }));
  return { sessionCount: all.length, totalReps, totalTime, avgScore, bestScore, topFaults };
}

// ── Cloud sync ────────────────────────────────────────────────────────────────

/**
 * Merge cloud sessions into localStorage. Cloud wins on score data.
 * Returns count of net-new sessions added.
 */
export async function syncFromCloud(limit = 50) {
   emit('syncing');
   try {
     const cloudRecords = await base44.entities.FormSession.list('-started_at', limit);
     const local = readAll().map(normalizeSession);
     const localIds = new Set(local.map(s => s._cloud_id || s.session_id).filter(Boolean));

     let added = 0;
     cloudRecords.forEach(record => {
       // Skip deleted sessions from cloud
       if (record.is_deleted === true) {
         // If deleted locally but exists in memory, mark as deleted
         const idx = local.findIndex(s => s._cloud_id === record.id || s.session_id === record.id);
         if (idx >= 0) {
           local.splice(idx, 1); // Remove from local if cloud says it's deleted
         }
         return;
       }

       if (!localIds.has(record.id)) {
         const normalized = normalizeSession(fromCloudRecord(record));
         local.push(normalized);
         console.log('[SESSION_HYDRATE_MERGE]', { cloud_id: record.id, source: 'new' });
         added++;
       }
     });

     if (added > 0 || cloudRecords.some(r => r.is_deleted)) writeAll(local);
     emit('synced');
     return added;
   } catch {
     emit('offline');
     return 0;
   }
 }