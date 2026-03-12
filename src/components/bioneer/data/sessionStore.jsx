/**
 * sessionStore.js
 * localStorage-backed session persistence layer.
 * Schema-safe, refresh-resilient, easy to migrate to a backend.
 */

const STORE_KEY = 'bioneer_sessions_v1';

// ── Read / Write helpers ──────────────────────────────────────────────────────
function readAll() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(sessions) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(sessions));
  } catch {
    // storage quota exceeded or private mode — fail silently
  }
}

// ── Core CRUD ─────────────────────────────────────────────────────────────────
export function saveSession(session) {
  if (!session?.session_id) return null;
  const all = readAll();
  const idx = all.findIndex(s => s.session_id === session.session_id);
  if (idx >= 0) {
    all[idx] = session;
  } else {
    all.push(session);
  }
  writeAll(all);
  return session;
}

export function getAllSessions() {
  return readAll().sort((a, b) =>
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
  const all = readAll().filter(s => s.session_id !== id);
  writeAll(all);
}

export function getSessionsByMovement(movementId) {
  return readAll()
    .filter(s => s.movement_id === movementId)
    .sort((a, b) => new Date(b.started_at || 0) - new Date(a.started_at || 0));
}

// ── Analytics helpers ─────────────────────────────────────────────────────────
export function getRecentSessions(limit = 10) {
  return getAllSessions().slice(0, limit);
}

export function getBestSessionsByMovement(movementId, limit = 5) {
  return getSessionsByMovement(movementId)
    .sort((a, b) => (b.average_form_score ?? 0) - (a.average_form_score ?? 0))
    .slice(0, limit);
}

export function getFaultTrendData() {
  const sessions = getAllSessions().slice(0, 20).reverse();
  // Returns [{date, faultCount, topFault}]
  return sessions.map(s => ({
    date: s.started_at ? new Date(s.started_at).toLocaleDateString() : '—',
    faultCount: s.top_faults?.length ?? 0,
    topFault: s.top_faults?.[0] ?? null,
  }));
}

export function getScoreTrendData() {
  const sessions = getAllSessions().slice(0, 20).reverse();
  return sessions.map((s, i) => ({
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

  const totalReps  = all.reduce((sum, s) => sum + (s.rep_count ?? 0), 0);
  const totalTime  = all.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
  const avgScore   = Math.round(all.reduce((sum, s) => sum + (s.average_form_score ?? 0), 0) / all.length);
  const bestScore  = all.length ? Math.max(...all.map(s => s.highest_form_score ?? 0)) : 0;

  // Fault frequency map
  const faultMap = {};
  all.forEach(s => (s.top_faults ?? []).forEach(f => { faultMap[f] = (faultMap[f] ?? 0) + 1; }));
  const topFaults = Object.entries(faultMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([fault, count]) => ({ fault, count }));

  return { sessionCount: all.length, totalReps, totalTime, avgScore, bestScore, topFaults };
}