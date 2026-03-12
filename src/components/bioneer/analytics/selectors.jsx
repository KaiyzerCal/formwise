/**
 * analyticsSelectors.js
 * All analytics transforms happen here — UI components stay dumb.
 * Reads from sessionStore; outputs chart-ready or display-ready data.
 */

import { getAllSessions } from '../data/sessionStore';

// ── Internal helpers ──────────────────────────────────────────────────────────

function getValidSessions() {
  return getAllSessions()
    .filter(s => s.session_status === 'complete' || s.session_status === 'partial')
    .sort((a, b) => new Date(a.started_at) - new Date(b.started_at));
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function avgOf(arr) {
  if (!arr.length) return null;
  const valid = arr.filter(v => v != null && !isNaN(v));
  if (!valid.length) return null;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

// ── Public selectors ──────────────────────────────────────────────────────────

// Zero-state returned when no sessions exist yet — all values at 0
const ZERO_OVERVIEW = {
  sessionCount: 0,
  totalReps: 0,
  totalTime: 0,
  avgFormScore: 0,
  bestScore: 0,
  latestDate: null,
  mostTrainedMovement: null,
  mostTrainedCount: 0,
  topFault: null,
  avgTrackingConfidence: null,
  improvementDir: null,
  isEmpty: true,
};

export function getAnalyticsOverview() {
  const sessions = getValidSessions();
  if (!sessions.length) return ZERO_OVERVIEW;

  const totalReps   = sessions.reduce((sum, s) => sum + (s.rep_count ?? 0), 0);
  const totalTime   = sessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
  const scores = sessions
    .map(s => s.average_form_score ?? s.form_score_overall ?? null)
    .filter(v => v != null && !isNaN(v));
  const avgFormScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const bestScores = sessions
    .map(s => s.highest_form_score ?? s.average_form_score ?? 0)
    .filter(v => !isNaN(v));
  const bestScore = bestScores.length ? Math.max(0, Math.max(...bestScores)) : 0;
  const latestDate  = sessions[sessions.length - 1]?.started_at;

  // Most-trained movement
  const movCount = {};
  sessions.forEach(s => {
    const k = s.movement_id ?? 'unknown';
    movCount[k] = { count: (movCount[k]?.count ?? 0) + 1, name: s.movement_name ?? k };
  });
  const mostTrained = Object.values(movCount).sort((a, b) => b.count - a.count)[0] ?? null;

  // Top fault
  const faultCounts = {};
  sessions.forEach(s => (s.top_faults ?? []).forEach(f => { faultCounts[f] = (faultCounts[f] ?? 0) + 1; }));
  const topFaultEntry = Object.entries(faultCounts).sort((a, b) => b[1] - a[1])[0] ?? null;

  // Avg tracking quality
  const withTracking = sessions.filter(s => s.tracking_confidence != null);
  const avgTracking  = withTracking.length
    ? avgOf(withTracking.map(s => s.tracking_confidence))
    : null;

  // Improvement direction (first-half vs second-half scores)
  let improvementDir = null;
  if (sessions.length >= 4) {
    const mid    = Math.floor(sessions.length / 2);
    const avg1   = avgOf(sessions.slice(0, mid).map(s => s.average_form_score ?? 0));
    const avg2   = avgOf(sessions.slice(mid).map(s => s.average_form_score ?? 0));
    const diff   = avg2 - avg1;
    improvementDir = diff > 3 ? 'improving' : diff < -3 ? 'declining' : 'stable';
  }

  return {
    sessionCount:           sessions.length,
    totalReps,
    totalTime,
    avgFormScore,
    bestScore,
    latestDate,
    mostTrainedMovement:    mostTrained?.name ?? null,
    mostTrainedCount:       mostTrained?.count ?? 0,
    topFault:               topFaultEntry ? topFaultEntry[0].replace(/_/g, ' ') : null,
    avgTrackingConfidence:  avgTracking,
    improvementDir,
    isEmpty:                false,
  };
}

export function getFormScoreTrend() {
  const sessions = getValidSessions();
  if (sessions.length < 2) return { data: [], insufficient: true, isEmpty: sessions.length === 0 };

  const data = sessions
    .map((s, i) => ({
      label:    fmtDate(s.started_at) || `S${i + 1}`,
      score:    Math.max(0, Math.min(100, s.average_form_score ?? 0)), // clamp 0-100
      peak:     s.highest_form_score ? Math.max(0, Math.min(100, s.highest_form_score)) : null,
      movement: s.movement_name ?? s.movement_id ?? '—',
    }))
    .filter(d => !isNaN(d.score) && d.score != null);

  if (data.length < 2) return { data: [], insufficient: true, isEmpty: false };

  // Trend direction
  const first = data[0].score, last = data[data.length - 1].score;
  const trend = last - first;

  return { data, trend, insufficient: false };
}

export function getFaultFrequencyData() {
  const sessions = getValidSessions();
  if (!sessions.length) return { data: [], faultTrends: {}, insufficient: true };

  // Accumulate counts from top_faults arrays
  const faultCounts = {};
  sessions.forEach(s => {
    (s.top_faults ?? []).forEach(f => {
      faultCounts[f] = (faultCounts[f] ?? 0) + 1;
    });
  });

  const total = sessions.length;
  const topFaults = Object.entries(faultCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([fault, count]) => ({
      fault: fault.replace(/_/g, ' '),
      rawKey: fault,
      count,
      pct: Math.min(100, Math.round((count / total) * 100)),
    }));

  // Per-fault trend: compare first-half vs second-half occurrence rates
  const faultTrends = {};
  if (sessions.length >= 4) {
    const mid       = Math.floor(sessions.length / 2);
    const firstHalf = sessions.slice(0, mid);
    const secHalf   = sessions.slice(mid);

    topFaults.forEach(({ fault, rawKey }) => {
      const r1 = firstHalf.filter(s => (s.top_faults ?? []).includes(rawKey)).length / firstHalf.length;
      const r2 = secHalf.filter(s => (s.top_faults ?? []).includes(rawKey)).length / secHalf.length;
      const diff = r2 - r1;
      faultTrends[fault] = diff < -0.1 ? 'improving' : diff > 0.1 ? 'worsening' : 'recurring';
    });
  }

  return { data: topFaults, faultTrends, insufficient: sessions.length < 2 };
}

export function getMovementBreakdown() {
  const sessions = getValidSessions();
  if (!sessions.length) return { data: [], mostImproved: null, lowestScoring: null, insufficient: true };

  const movMap = {};
  sessions.forEach(s => {
    const k = s.movement_id ?? 'unknown';
    if (!movMap[k]) movMap[k] = { id: k, name: s.movement_name ?? k, sessions: 0, scores: [], totalReps: 0 };
    movMap[k].sessions++;
    if (s.average_form_score != null) movMap[k].scores.push(s.average_form_score);
    movMap[k].totalReps += s.rep_count ?? 0;
  });

  const data = Object.values(movMap).map(m => ({
    ...m,
    avgScore: avgOf(m.scores),
  })).sort((a, b) => b.sessions - a.sessions);

  const mostImproved = data
    .filter(m => m.scores.length >= 2)
    .map(m => ({ ...m, improvement: m.scores[m.scores.length - 1] - m.scores[0] }))
    .sort((a, b) => b.improvement - a.improvement)[0] ?? null;

  const lowestScoring = [...data]
    .filter(m => m.avgScore != null)
    .sort((a, b) => a.avgScore - b.avgScore)[0] ?? null;

  return { data, mostImproved, lowestScoring, insufficient: false };
}

export function getRiskSignalSummary() {
  const sessions = getValidSessions();
  if (sessions.length < 2) return { signals: [], insufficient: true, isEmpty: sessions.length === 0 };

  const signals = [];
  const recent  = sessions.slice(-5);

  // Low tracking confidence
  const lowConf = recent.filter(s => (s.tracking_confidence ?? 100) < 50);
  if (lowConf.length >= 2) {
    signals.push({
      type: 'warning',
      text: `Low tracking confidence in ${lowConf.length} recent sessions — check lighting and camera framing.`,
    });
  }

  // Body-side bias
  const biased = recent.filter(s => s.body_side_bias && s.body_side_bias !== 'balanced');
  if (biased.length >= 2) {
    const sides = biased.map(s => s.body_side_bias);
    const dom   = sides.sort((a, b) => sides.filter(v => v === b).length - sides.filter(v => v === a).length)[0];
    signals.push({
      type: 'fault',
      text: `${dom}-side body bias detected across ${biased.length} sessions — possible asymmetry pattern.`,
    });
  }

  // Recurring risk flags
  const rfCounts = {};
  sessions.forEach(s => (s.risk_flags ?? []).forEach(f => { rfCounts[f] = (rfCounts[f] ?? 0) + 1; }));
  Object.entries(rfCounts)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .forEach(([flag, count]) => {
      signals.push({
        type: 'fault',
        text: `"${flag.replace(/_/g, ' ')}" flagged in ${count} sessions — monitor carefully.`,
      });
    });

  // Top recurring fault
  const faultCounts = {};
  sessions.forEach(s => (s.top_faults ?? []).forEach(f => { faultCounts[f] = (faultCounts[f] ?? 0) + 1; }));
  const topFault = Object.entries(faultCounts).sort((a, b) => b[1] - a[1])[0];
  if (topFault && topFault[1] >= 3) {
    signals.push({
      type: 'fault',
      text: `"${topFault[0].replace(/_/g, ' ')}" recurs in ${topFault[1]} sessions — high priority for correction.`,
    });
  }

  // Score drop in last session
  if (sessions.length >= 3) {
    const last  = sessions[sessions.length - 1].average_form_score ?? 0;
    const prev  = avgOf(sessions.slice(0, -1).map(s => s.average_form_score ?? 0));
    if (prev != null && last < prev - 10) {
      signals.push({
        type: 'warning',
        text: `Last session score (${last}) dropped ${prev - last} pts below your average — possible fatigue or regression.`,
      });
    }
  }

  // Clean bill if no signals
  if (!signals.length) {
    signals.push({ type: 'ok', text: 'No major risk signals detected in recent sessions. Keep training consistently.' });
  }

  return { signals, insufficient: false };
}

export function getRecentInsights() {
  const sessions = getValidSessions();
  if (!sessions.length) return { insights: [], insufficient: true, isEmpty: true };

  const insights = [];

  // Score trend over last 3
  if (sessions.length >= 3) {
    const last3  = sessions.slice(-3);
    const scores = last3.map(s => s.average_form_score ?? 0);
    const delta  = scores[2] - scores[0];
    if (delta > 5)
      insights.push({ type: 'improvement', text: `Form score up ${Math.abs(delta)} pts across your last 3 sessions.` });
    else if (delta < -5)
      insights.push({ type: 'warning', text: `Form score down ${Math.abs(delta)} pts in last 3 sessions — check recovery.` });
  }

  // Volume milestone
  const totalReps = sessions.reduce((sum, s) => sum + (s.rep_count ?? 0), 0);
  if (totalReps >= 50)
    insights.push({ type: 'improvement', text: `${totalReps} total reps tracked — strong training volume.` });

  // Top fault
  const faultCounts = {};
  sessions.forEach(s => (s.top_faults ?? []).forEach(f => { faultCounts[f] = (faultCounts[f] ?? 0) + 1; }));
  const topFaultEntry = Object.entries(faultCounts).sort((a, b) => b[1] - a[1])[0];
  if (topFaultEntry && topFaultEntry[1] >= 2) {
    insights.push({
      type: 'fault',
      text: `"${topFaultEntry[0].replace(/_/g, ' ')}" is your most common fault (${topFaultEntry[1]} sessions).`,
    });
  }

  // Peak form
  const best = [...sessions].sort((a, b) => (b.highest_form_score ?? 0) - (a.highest_form_score ?? 0))[0];
  if (best?.highest_form_score >= 85)
    insights.push({ type: 'improvement', text: `Peak form: ${best.highest_form_score} on ${fmtDate(best.started_at)}.` });

  // Movement variety
  const uniqueMovements = new Set(sessions.map(s => s.movement_id)).size;
  if (uniqueMovements >= 3)
    insights.push({ type: 'improvement', text: `${uniqueMovements} movements tracked — good training variety.` });

  // Single session nudge
  if (sessions.length === 1)
    insights.push({ type: 'neutral', text: 'Complete 2–3 more sessions to unlock trend analysis and pattern detection.' });

  return { insights: insights.slice(0, 5), insufficient: sessions.length < 1 };
}