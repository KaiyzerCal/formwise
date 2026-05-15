/**
 * unifiedSessionStore.js
 * Base44 FormSession entity is the source of truth.
 * localStorage is a fast cache that syncs from cloud on app init.
 * 
 * Flow:
 *   saveSession() → write to cloud → cache locally with cloud id
 *   getAllSessions() → read from cache (sync, for UI consumers)
 *   initSessionStore() → fetch cloud → populate cache (call on app start)
 */
import { base44 } from '@/api/base44Client';

const CACHE_KEY = 'bioneer_sessions_v2';
const SYNC_KEY  = 'bioneer_last_sync';

// ── Sync status bus ───────────────────────────────────────────────────────────
const listeners = new Set();
let _syncStatus = 'idle';
let _lastSyncAt = localStorage.getItem(SYNC_KEY) ? new Date(localStorage.getItem(SYNC_KEY)) : null;
let _initialized = false;

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

// ── localStorage cache ────────────────────────────────────────────────────────
function readCache() {
  try {
    const r = localStorage.getItem(CACHE_KEY);
    return r ? JSON.parse(r) : [];
  } catch { return []; }
}
function writeCache(s) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(s)); } catch {}
}

// ── Cloud → local mapper ──────────────────────────────────────────────────────
function fromCloud(r) {
  return {
    session_id:         r.id,
    _cloud_id:          r.id,
    exercise_id:        r.exercise_id,
    category:           r.category,
    duration_seconds:   r.duration_seconds,
    average_form_score: r.average_form_score ?? r.form_score_overall ?? 0,
    highest_form_score: r.highest_form_score ?? r.form_score_peak ?? 0,
    lowest_form_score:  r.lowest_form_score ?? r.form_score_lowest ?? 0,
    movement_score:     r.movement_score ?? 0,
    form_score_overall: r.form_score_overall ?? 0,
    form_score_peak:    r.form_score_peak ?? 0,
    form_score_lowest:  r.form_score_lowest ?? 0,
    rep_count:          r.rep_count ?? r.reps_detected ?? 0,
    reps_detected:      r.reps_detected ?? 0,
    mastery_avg:        r.mastery_avg ?? 0,
    alerts:             r.alerts ?? [],
    phases:             r.phases ?? {},
    form_timeline:      r.form_timeline ?? [],
    top_faults:         r.top_faults ?? [],
    risk_flags:         r.risk_flags ?? [],
    body_side_bias:     r.body_side_bias ?? 'balanced',
    tracking_confidence:r.tracking_confidence ?? 0,
    session_status:     r.session_status ?? 'complete',
    started_at:         r.started_at ?? r.created_date,
    movement_id:        r.movement_id ?? r.exercise_id,
    movement_name:      r.movement_name ?? r.exercise_id,
    video_url:          r.video_url ?? null,
    coaching_events:    r.coaching_events ?? [],
    coaching_intensity: r.coaching_intensity ?? 'moderate',
    coaching_enabled:   r.coaching_enabled ?? true,
    _source:            'cloud',
  };
}

// ── Local → cloud mapper ──────────────────────────────────────────────────────
function toCloud(s) {
  return {
    exercise_id:        s.movement_id ?? s.movement_name ?? s.exercise_id ?? 'unknown',
    category:           s.category ?? 'strength',
    duration_seconds:   s.duration_seconds ?? 0,
    form_score_overall: s.average_form_score ?? s.form_score_overall ?? 0,
    movement_score:     s.movement_score ?? 0,
    form_score_peak:    s.highest_form_score ?? s.form_score_peak ?? 0,
    form_score_lowest:  s.lowest_form_score ?? s.form_score_lowest ?? 0,
    reps_detected:      s.rep_count ?? s.reps_detected ?? 0,
    rep_count:          s.rep_count ?? 0,
    average_form_score: s.average_form_score ?? 0,
    highest_form_score: s.highest_form_score ?? 0,
    lowest_form_score:  s.lowest_form_score ?? 0,
    mastery_avg:        s.mastery_avg ?? 0,
    alerts:             (s.alerts ?? []).slice(0, 50),
    phases:             s.phases ?? {},
    form_timeline:      (s.form_timeline ?? []).slice(0, 200),
    top_faults:         (s.top_faults ?? []).slice(0, 10),
    risk_flags:         (s.risk_flags ?? []).slice(0, 10),
    body_side_bias:     s.body_side_bias ?? 'balanced',
    tracking_confidence:s.tracking_confidence ?? 0,
    session_status:     s.session_status ?? 'complete',
    started_at:         s.started_at ?? new Date().toISOString(),
    movement_id:        s.movement_id ?? null,
    movement_name:      s.movement_name ?? null,
    video_url:          s.video_url ?? null,
  };
}

// ── Migrate v1 data ───────────────────────────────────────────────────────────
function migrateV1() {
  try {
    const v1 = localStorage.getItem('bioneer_sessions_v1');
    if (!v1) return;
    const old = JSON.parse(v1);
    if (!Array.isArray(old) || !old.length) return;
    // Merge into v2 cache (avoid duplicates by session_id)
    const current = readCache();
    const existingIds = new Set(current.map(s => s.session_id));
    const newEntries = old.filter(s => s.session_id && !existingIds.has(s.session_id));
    if (newEntries.length > 0) {
      writeCache([...newEntries, ...current]);
    }
    // Clear old key so migration only runs once
    localStorage.removeItem('bioneer_sessions_v1');
  } catch {}
}

// ── Initialize store from cloud ───────────────────────────────────────────────
// Call this once on app start. Populates the localStorage cache from Base44.
// If called again after auth becomes available, re-syncs from cloud.
export async function initSessionStore() {
  migrateV1();
  // Allow re-init if previous attempt was offline (not authed)
  if (_initialized && _syncStatus === 'synced') return;
  emit('syncing');
  try {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) {
      emit('offline');
      _initialized = true;
      return;
    }
    // Fetch all sessions — is_deleted may be unset (null/undefined) on older records,
    // so we fetch all and filter client-side instead of relying on { is_deleted: false }
    const cloudRecords = await base44.entities.FormSession.list(
      '-started_at',
      200
    );
    if (cloudRecords && cloudRecords.length > 0) {
      const sessions = cloudRecords
        .filter(r => !r.is_deleted) // exclude soft-deleted (true), keep false/null/undefined
        .map(fromCloud);
      writeCache(sessions);
    }
    _initialized = true;
    emit('synced');
  } catch (err) {
    console.warn('[SessionStore] Cloud init failed, using cache:', err.message);
    _initialized = true;
    emit('offline');
  }
}

// ── Core CRUD ─────────────────────────────────────────────────────────────────

/**
 * Save a session — creates in cloud, then caches locally with the cloud ID.
 * Returns the saved session object (with _cloud_id set).
 */
export async function saveSession(session) {
  if (!session) return null;

  // Ensure we have a local session_id for fallback
  const localId = session.session_id || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const sessionWithId = { ...session, session_id: localId };

  // Always cache locally first so session is never lost
  function cacheLocally() {
    const cache = readCache();
    const existingIdx = cache.findIndex(s =>
      s.session_id === sessionWithId.session_id ||
      (sessionWithId._cloud_id && s._cloud_id === sessionWithId._cloud_id)
    );
    if (existingIdx >= 0) {
      cache[existingIdx] = sessionWithId;
    } else {
      cache.unshift(sessionWithId);
    }
    writeCache(cache);
  }

  // Cache immediately so session is visible even if cloud fails
  cacheLocally();

  // Try to save to cloud
  try {
    emit('syncing');
    const created = await base44.entities.FormSession.create(toCloud(sessionWithId));
    // Use the cloud ID as the canonical session_id
    sessionWithId.session_id = created.id;
    sessionWithId._cloud_id = created.id;
    // Re-cache with cloud ID
    cacheLocally();
    emit('synced');
  } catch (err) {
    console.warn('[SessionStore] Cloud save failed, session cached locally:', err.message);
    emit('offline');
  }

  return sessionWithId;
}

/**
 * Get all non-deleted sessions sorted by date (newest first).
 * Reads from cache (synchronous).
 */
export function getAllSessions() {
  return readCache()
    .filter(s => !s.is_deleted)
    .sort((a, b) => new Date(b.started_at || 0) - new Date(a.started_at || 0));
}

export function getSessionById(id) {
  return readCache().find(s => s.session_id === id || s._cloud_id === id) ?? null;
}

/**
 * Update a session — patches in cloud and cache.
 */
export async function updateSession(id, patch) {
  const cache = readCache();
  const idx = cache.findIndex(s => s.session_id === id || s._cloud_id === id);
  if (idx < 0) return null;

  cache[idx] = { ...cache[idx], ...patch };
  writeCache(cache);

  // Sync patch to cloud
  const cloudId = cache[idx]._cloud_id || cache[idx].session_id;
  try {
    if (cloudId) {
      await base44.entities.FormSession.update(cloudId, patch);
    }
  } catch (err) {
    console.warn('[SessionStore] Cloud update failed:', err.message);
  }

  return cache[idx];
}

/**
 * Soft-delete a session — marks is_deleted in cloud and removes from cache.
 */
export async function deleteSession(id) {
  const cache = readCache();
  const session = cache.find(s => s.session_id === id || s._cloud_id === id);
  const cloudId = session?._cloud_id || session?.session_id;

  // Remove from cache
  writeCache(cache.filter(s => s.session_id !== id && s._cloud_id !== id));

  // Soft-delete in cloud
  try {
    if (cloudId) {
      await base44.entities.FormSession.update(cloudId, {
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('[SessionStore] Cloud delete failed:', err.message);
  }
}

export function clearAllSessions() {
  writeCache([]);
}

// ── Analytics helpers (sync, read from cache) ─────────────────────────────────

export function getSessionsByMovement(movementId) {
  return getAllSessions().filter(s =>
    s.movement_id === movementId || s.exercise_id === movementId
  );
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
  const all = getAllSessions().filter(s =>
    s.session_status === 'complete' || s.session_status === 'partial'
  );
  if (!all.length) return null;
  const totalReps = all.reduce((sum, s) => sum + (s.rep_count ?? 0), 0);
  const totalTime = all.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
  const avgScore  = Math.round(all.reduce((sum, s) => sum + (s.average_form_score ?? 0), 0) / all.length);
  const bestScore = Math.max(...all.map(s => s.highest_form_score ?? 0));
  const faultMap  = {};
  all.forEach(s => (s.top_faults ?? []).forEach(f => { faultMap[f] = (faultMap[f] ?? 0) + 1; }));
  const topFaults = Object.entries(faultMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([fault, count]) => ({ fault, count }));
  return { sessionCount: all.length, totalReps, totalTime, avgScore, bestScore, topFaults };
}

// ── Cloud sync (pull) — for manual refresh ────────────────────────────────────
export async function syncFromCloud(limit = 200) {
  emit('syncing');
  try {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) { emit('offline'); return 0; }
    const cloudRecords = await base44.entities.FormSession.list(
      '-started_at',
      limit
    );
    if (!cloudRecords?.length) { emit('synced'); return 0; }

    const sessions = cloudRecords
      .filter(r => !r.is_deleted)
      .map(fromCloud);
    writeCache(sessions);
    emit('synced');
    return sessions.length;
  } catch {
    emit('offline');
    return 0;
  }
}