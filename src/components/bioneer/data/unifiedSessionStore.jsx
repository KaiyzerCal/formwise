/**
 * unifiedSessionStore.jsx
 * localStorage (instant) + Supabase cloud (background sync).
 * Same exported API as the original.
 */
import { base44 } from '@/api/base44Client';

const STORE_KEY = 'bioneer_sessions_v1';
const SYNC_KEY  = 'bioneer_last_sync';

// ── Sync status bus ───────────────────────────────────────────────────────────
const listeners = new Set();
let _syncStatus = 'idle';
let _lastSyncAt = localStorage.getItem(SYNC_KEY) ? new Date(localStorage.getItem(SYNC_KEY)) : null;

export function subscribeSyncStatus(fn) {
  listeners.add(fn);
  fn({ status: _syncStatus, lastSyncAt: _lastSyncAt });
  return () => listeners.delete(fn);
}
function emit(status) {
  _syncStatus = status;
  if (status === 'synced') { _lastSyncAt = new Date(); localStorage.setItem(SYNC_KEY, _lastSyncAt.toISOString()); }
  listeners.forEach(fn => fn({ status, lastSyncAt: _lastSyncAt }));
}

// ── localStorage ──────────────────────────────────────────────────────────────
function readAll() {
  try { const r = localStorage.getItem(STORE_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function writeAll(s) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch {}
}

// ── Cloud payload mappers ─────────────────────────────────────────────────────
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
    alerts:             s.alerts ?? [],
    phases:             s.phases ?? {},
    form_timeline:      s.form_timeline ?? [],
    top_faults:         s.top_faults ?? [],
    risk_flags:         s.risk_flags ?? [],
    body_side_bias:     s.body_side_bias ?? 'balanced',
    tracking_confidence:s.tracking_confidence ?? 0,
    session_status:     s.session_status ?? 'complete',
    started_at:         s.started_at ?? new Date().toISOString(),
    movement_id:        s.movement_id ?? null,
    movement_name:      s.movement_name ?? null,
  };
}

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
    started_at:         r.started_at ?? r.created_at,
    movement_id:        r.movement_id ?? r.exercise_id,
    movement_name:      r.movement_name ?? r.exercise_id,
    _source:            'cloud',
  };
}

function normalize(s) {
  if (!s) return s;
  const n = { ...s };
  if (typeof n.session_id === 'string' && n.session_id.startsWith('cloud_')) n.session_id = n.session_id.slice(6);
  if (!n._cloud_id && n.session_id) n._cloud_id = n.session_id;
  return n;
}

async function pushToCloud(session) {
  emit('syncing');
  try {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) { emit('offline'); return; }
    await base44.entities.FormSession.create(toCloud(session));
    emit('synced');
  } catch { emit('offline'); }
}

// ── Core CRUD ─────────────────────────────────────────────────────────────────
export function saveSession(session) {
  if (!session?.session_id) return null;
  const n = normalize(session);
  const all = readAll();
  const idx = all.findIndex(s => s.session_id === n.session_id);
  if (idx >= 0) all[idx] = n; else all.push(n);
  writeAll(all);
  pushToCloud(n).catch(() => {});
  return n;
}

export function getAllSessions() {
  return readAll().filter(s => !s.is_deleted).sort((a, b) => new Date(b.started_at || 0) - new Date(a.started_at || 0));
}

export function getSessionById(id) { return readAll().find(s => s.session_id === id) ?? null; }

export function updateSession(id, patch) {
  const all = readAll();
  const idx = all.findIndex(s => s.session_id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch };
  writeAll(all);
  return all[idx];
}

export function deleteSession(id) { writeAll(readAll().filter(s => s.session_id !== id)); }
export function clearAllSessions() { writeAll([]); }

// ── Analytics helpers ─────────────────────────────────────────────────────────
export function getSessionsByMovement(movementId) {
  return readAll().filter(s => s.movement_id === movementId).sort((a, b) => new Date(b.started_at || 0) - new Date(a.started_at || 0));
}
export function getRecentSessions(limit = 10) { return getAllSessions().slice(0, limit); }
export function getBestSessionsByMovement(movementId, limit = 5) {
  return getSessionsByMovement(movementId).sort((a, b) => (b.average_form_score ?? 0) - (a.average_form_score ?? 0)).slice(0, limit);
}
export function getFaultTrendData() {
  return getAllSessions().slice(0, 20).reverse().map(s => ({ date: s.started_at ? new Date(s.started_at).toLocaleDateString() : '—', faultCount: s.top_faults?.length ?? 0, topFault: s.top_faults?.[0] ?? null }));
}
export function getScoreTrendData() {
  return getAllSessions().slice(0, 20).reverse().map((s, i) => ({ index: i + 1, score: s.average_form_score ?? 0, movement: s.movement_name ?? s.movement_id ?? '—', date: s.started_at ? new Date(s.started_at).toLocaleDateString() : '—' }));
}
export function getMovementSessionHistory(movementId) {
  return getSessionsByMovement(movementId).map(s => ({ session_id: s.session_id, date: s.started_at, score: s.average_form_score, reps: s.rep_count, duration: s.duration_seconds, status: s.session_status }));
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
  const topFaults = Object.entries(faultMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([fault, count]) => ({ fault, count }));
  return { sessionCount: all.length, totalReps, totalTime, avgScore, bestScore, topFaults };
}

// ── Cloud sync ────────────────────────────────────────────────────────────────
export async function syncFromCloud(limit = 50) {
  emit('syncing');
  try {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) { emit('offline'); return 0; }
    const data = await base44.entities.FormSession.filter({ is_deleted: false }, '-started_at', limit);
    const local = readAll().map(normalize);
    const localIds = new Set(local.map(s => s._cloud_id || s.session_id).filter(Boolean));
    let added = 0;
    (data ?? []).forEach(r => { if (!localIds.has(r.id)) { local.push(normalize(fromCloud(r))); added++; } });
    if (added > 0) writeAll(local);
    emit('synced');
    return added;
  } catch { emit('offline'); return 0; }
}