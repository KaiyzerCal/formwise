/**
 * unifiedSessionStore.js
 * Supabase is the source of truth. localStorage is a fast read cache.
 *
 * Flow:
 *   saveSession()  → insert to Supabase → cache locally with cloud id
 *   getAllSessions() → read from cache (sync, for UI consumers)
 *   initSessionStore() → fetch from Supabase → populate cache (call on app start)
 */
import { supabase, getCurrentUser, isAuthenticated } from '@/api/supabaseClient';

const CACHE_KEY = 'bioneer_sessions_v2';
const SYNC_KEY  = 'bioneer_last_sync';

// ── Sync status bus ───────────────────────────────────────────────────────────
const listeners = new Set();
let _syncStatus   = 'idle';
let _lastSyncAt   = localStorage.getItem(SYNC_KEY) ? new Date(localStorage.getItem(SYNC_KEY)) : null;
let _initialized  = false;

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
// Canonical field names only. Legacy aliases kept for old cached sessions that
// were written before the field-name standardization.
function fromCloud(r) {
  return {
    session_id:          r.id,
    _cloud_id:           r.id,
    exercise_id:         r.exercise_id,
    category:            r.category,
    duration_seconds:    r.duration_seconds,
    average_form_score:  r.average_form_score ?? 0,
    highest_form_score:  r.highest_form_score ?? 0,
    lowest_form_score:   r.lowest_form_score  ?? 0,
    movement_score:      r.movement_score     ?? 0,
    rep_count:           r.rep_count   ?? r.reps_detected ?? 0,
    reps_detected:       r.reps_detected      ?? 0,
    mastery_avg:         r.mastery_avg        ?? 0,
    alerts:              r.alerts             ?? [],
    phases:              r.phases             ?? {},
    form_timeline:       r.form_timeline      ?? [],
    top_faults:          r.top_faults         ?? [],
    risk_flags:          r.risk_flags         ?? [],
    body_side_bias:      r.body_side_bias     ?? 'balanced',
    tracking_confidence: r.tracking_confidence ?? 0,
    session_status:      r.session_status     ?? 'complete',
    started_at:          r.started_at         ?? r.created_at,
    movement_id:         r.movement_id        ?? r.exercise_id,
    movement_name:       r.movement_name      ?? r.exercise_id,
    video_url:           r.video_url          ?? null,
    coaching_events:     r.coaching_events    ?? [],
    coaching_intensity:  r.coaching_intensity ?? 'moderate',
    coaching_enabled:    r.coaching_enabled   ?? true,
    rep_summaries:       r.rep_summaries      ?? [],
    _source:             'cloud',
  };
}

// ── Local → cloud mapper ──────────────────────────────────────────────────────
function toCloud(s) {
  return {
    exercise_id:         s.movement_id ?? s.exercise_id ?? 'unknown',
    category:            s.category            ?? 'strength',
    duration_seconds:    s.duration_seconds    ?? 0,
    average_form_score:  s.average_form_score  ?? 0,
    highest_form_score:  s.highest_form_score  ?? 0,
    lowest_form_score:   s.lowest_form_score   ?? 0,
    movement_score:      s.movement_score      ?? 0,
    reps_detected:       s.rep_count ?? s.reps_detected ?? 0,
    rep_count:           s.rep_count           ?? 0,
    mastery_avg:         s.mastery_avg         ?? 0,
    alerts:              (s.alerts     ?? []).slice(0, 50),
    phases:              s.phases              ?? {},
    form_timeline:       (s.form_timeline ?? []).slice(0, 200),
    top_faults:          (s.top_faults   ?? []).slice(0, 10),
    risk_flags:          (s.risk_flags   ?? []).slice(0, 10),
    rep_summaries:       (s.rep_summaries ?? []).slice(0, 100),
    body_side_bias:      s.body_side_bias      ?? 'balanced',
    tracking_confidence: s.tracking_confidence ?? 0,
    session_status:      s.session_status      ?? 'complete',
    started_at:          s.started_at          ?? new Date().toISOString(),
    movement_id:         s.movement_id         ?? null,
    movement_name:       s.movement_name       ?? null,
    video_url:           s.video_url           ?? null,
    coaching_events:     s.coaching_events     ?? [],
    coaching_intensity:  s.coaching_intensity  ?? 'moderate',
    coaching_enabled:    s.coaching_enabled    ?? true,
  };
}

// ── Migrate v1 data ───────────────────────────────────────────────────────────
function migrateV1() {
  try {
    const v1 = localStorage.getItem('bioneer_sessions_v1');
    if (!v1) return;
    const old = JSON.parse(v1);
    if (!Array.isArray(old) || !old.length) return;
    const current    = readCache();
    const existingIds = new Set(current.map(s => s.session_id));
    const newEntries  = old.filter(s => s.session_id && !existingIds.has(s.session_id));
    if (newEntries.length > 0) writeCache([...newEntries, ...current]);
    localStorage.removeItem('bioneer_sessions_v1');
  } catch {}
}

// ── Initialize store from cloud ───────────────────────────────────────────────
export async function initSessionStore() {
  migrateV1();
  if (_initialized && _syncStatus === 'synced') return;
  emit('syncing');
  try {
    const authed = await isAuthenticated();
    if (!authed) { emit('offline'); _initialized = true; return; }

    const { data: cloudRecords, error } = await supabase
      .from('form_sessions')
      .select('*')
      .eq('is_deleted', false)
      .order('started_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    if (cloudRecords?.length) {
      writeCache(cloudRecords.map(fromCloud));
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

export async function saveSession(session) {
  if (!session) return null;

  const localId = session.session_id
    || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const sessionWithId = { ...session, session_id: localId };

  // Write to cache immediately so UI sees it even if cloud fails
  function cacheLocally() {
    const cache = readCache();
    const idx   = cache.findIndex(s =>
      s.session_id === sessionWithId.session_id ||
      (sessionWithId._cloud_id && s._cloud_id === sessionWithId._cloud_id)
    );
    if (idx >= 0) cache[idx] = sessionWithId;
    else          cache.unshift(sessionWithId);
    writeCache(cache);
  }
  cacheLocally();

  try {
    emit('syncing');
    const user = await getCurrentUser();
    if (!user) { emit('offline'); return sessionWithId; }

    const payload = { ...toCloud(sessionWithId), user_id: user.id };
    const { data: created, error } = await supabase
      .from('form_sessions')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    sessionWithId.session_id = created.id;
    sessionWithId._cloud_id  = created.id;
    cacheLocally();
    emit('synced');
  } catch (err) {
    console.warn('[SessionStore] Cloud save failed, cached locally:', err.message);
    emit('offline');
  }

  return sessionWithId;
}

export function getAllSessions() {
  return readCache()
    .filter(s => !s.is_deleted)
    .sort((a, b) => new Date(b.started_at || 0) - new Date(a.started_at || 0));
}

export function getSessionById(id) {
  return readCache().find(s => s.session_id === id || s._cloud_id === id) ?? null;
}

export async function updateSession(id, patch) {
  const cache = readCache();
  const idx   = cache.findIndex(s => s.session_id === id || s._cloud_id === id);
  if (idx < 0) return null;

  cache[idx] = { ...cache[idx], ...patch };
  writeCache(cache);

  const cloudId = cache[idx]._cloud_id || cache[idx].session_id;
  if (cloudId) {
    const { error } = await supabase
      .from('form_sessions').update(patch).eq('id', cloudId);
    if (error) console.warn('[SessionStore] Cloud update failed:', error.message);
  }

  return cache[idx];
}

export async function deleteSession(id) {
  const cache   = readCache();
  const session = cache.find(s => s.session_id === id || s._cloud_id === id);
  const cloudId = session?._cloud_id || session?.session_id;

  writeCache(cache.filter(s => s.session_id !== id && s._cloud_id !== id));

  if (cloudId) {
    const { error } = await supabase.from('form_sessions').update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    }).eq('id', cloudId);
    if (error) console.warn('[SessionStore] Cloud delete failed:', error.message);
  }
}

export function clearAllSessions() { writeCache([]); }

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
    date:       s.started_at ? new Date(s.started_at).toLocaleDateString() : '—',
    faultCount: s.top_faults?.length ?? 0,
    topFault:   s.top_faults?.[0] ?? null,
  }));
}

export function getScoreTrendData() {
  return getAllSessions().slice(0, 20).reverse().map((s, i) => ({
    index:    i + 1,
    score:    s.average_form_score ?? 0,
    movement: s.movement_name ?? s.movement_id ?? '—',
    date:     s.started_at ? new Date(s.started_at).toLocaleDateString() : '—',
  }));
}

export function getMovementSessionHistory(movementId) {
  return getSessionsByMovement(movementId).map(s => ({
    session_id: s.session_id,
    date:       s.started_at,
    score:      s.average_form_score,
    reps:       s.rep_count,
    duration:   s.duration_seconds,
    status:     s.session_status,
  }));
}

export function getAggregateStats() {
  const all = getAllSessions().filter(s =>
    s.session_status === 'complete' || s.session_status === 'partial'
  );
  if (!all.length) return null;
  const totalReps = all.reduce((sum, s) => sum + (s.rep_count ?? 0), 0);
  const totalTime = all.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
  const avgScore  = Math.round(
    all.reduce((sum, s) => sum + (s.average_form_score ?? 0), 0) / all.length
  );
  const bestScore = Math.max(...all.map(s => s.highest_form_score ?? 0));
  const faultMap  = {};
  all.forEach(s =>
    (s.top_faults ?? []).forEach(f => { faultMap[f] = (faultMap[f] ?? 0) + 1; })
  );
  const topFaults = Object.entries(faultMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([fault, count]) => ({ fault, count }));
  return { sessionCount: all.length, totalReps, totalTime, avgScore, bestScore, topFaults };
}

// ── Cloud sync (pull) ─────────────────────────────────────────────────────────
export async function syncFromCloud(limit = 200) {
  emit('syncing');
  try {
    const authed = await isAuthenticated();
    if (!authed) { emit('offline'); return 0; }

    const { data: cloudRecords, error } = await supabase
      .from('form_sessions')
      .select('*')
      .eq('is_deleted', false)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!cloudRecords?.length) { emit('synced'); return 0; }

    writeCache(cloudRecords.map(fromCloud));
    emit('synced');
    return cloudRecords.length;
  } catch {
    emit('offline');
    return 0;
  }
}
