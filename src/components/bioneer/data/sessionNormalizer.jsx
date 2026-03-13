/**
 * sessionNormalizer.js
 * Converts raw Live Session output into a canonical saved session record.
 * All missing values are safely null — no fake values invented.
 */

function uid() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function safeRound(v) {
  return typeof v === 'number' && isFinite(v) ? Math.round(v) : null;
}

function clamp(v, min = 0, max = 100) {
  if (typeof v !== 'number' || !isFinite(v)) return null;
  return Math.min(max, Math.max(min, Math.round(v)));
}

/**
 * Determine session status from available data quality.
 */
function deriveStatus({ durationSeconds, repCount, avgFormScore, trackingConfidence }) {
  if (durationSeconds < 5)                       return 'aborted';
  if ((trackingConfidence ?? 0) < 30)            return 'low_confidence';
  if (durationSeconds < 15 && (repCount ?? 0) < 1) return 'partial';
  return 'complete';
}

/**
 * Extract top recurring fault IDs from a raw alerts array.
 */
function extractTopFaults(alerts = [], limit = 5) {
  if (!Array.isArray(alerts) || !alerts.length) return [];
  const counts = {};
  alerts.forEach(a => {
    const key = a.joint || a.fault || a.id;
    if (key) counts[key] = (counts[key] ?? 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([fault, count]) => fault);
}

/**
 * Build rep-level summaries from available rep data.
 * Expects repSummaries array from session logger or empty array.
 */
function buildRepSummaries(rawSummaries = [], formTimeline = []) {
  if (rawSummaries?.length) {
    return rawSummaries.map((r, i) => ({
      rep_index: i + 1,
      form_score: clamp(r.score ?? r.formScore),
      detected_faults: r.faults ?? [],
      confidence: clamp(r.confidence),
      phase_quality: r.phaseQuality ?? null,
    }));
  }
  // Derive from form_timeline if available
  if (formTimeline?.length) {
    const avgScore = Math.round(formTimeline.reduce((s, f) => s + (f.score ?? 0), 0) / formTimeline.length);
    return [{ rep_index: 1, form_score: clamp(avgScore), detected_faults: [], confidence: null, phase_quality: null }];
  }
  return [];
}

/**
 * Compute visibility quality band from tracking confidence.
 */
function visibilityBand(conf) {
  if (conf === null || conf === undefined) return 'unknown';
  if (conf >= 75) return 'high';
  if (conf >= 50) return 'medium';
  if (conf >= 25) return 'low';
  return 'very_low';
}

/**
 * Main normalizer — call this when a session ends.
 * @param {object} rawData — output from CameraView/handleStop
 * @param {object} meta    — { movementName, category, startedAt, movementProfileId, movementProfile }
 */
export function normalizeSession(rawData, meta = {}) {
  const now = new Date().toISOString();
  const startedAt = meta.startedAt ? new Date(meta.startedAt).toISOString() : now;

  const durationSeconds  = safeRound(rawData.duration_seconds) ?? 0;
  const repCount         = safeRound(rawData.reps_detected)    ?? 0;
  const avgFormScore     = clamp(rawData.form_score_overall);
  const lowestFormScore  = clamp(rawData.form_score_lowest);
  const highestFormScore = clamp(rawData.form_score_peak);
  const movementScore    = clamp(rawData.movement_score);
  const trackingConf     = clamp(rawData.tracking_confidence);

  const topFaults  = extractTopFaults(rawData.alerts);
  const repSumms   = buildRepSummaries(rawData.rep_summaries ?? [], rawData.form_timeline ?? []);

  // Fault frequency: { faultId: count }
  const faultFrequency = {};
  (rawData.alerts ?? []).forEach(a => {
    const key = a.joint || a.fault || a.id;
    if (key) faultFrequency[key] = (faultFrequency[key] ?? 0) + 1;
  });

  const status = deriveStatus({
    durationSeconds,
    repCount,
    avgFormScore,
    trackingConfidence: trackingConf,
  });

  return {
    session_id:          uid(),
    movement_id:         rawData.exercise_id ?? null,
    movement_name:       meta.movementName ?? rawData.exercise_id?.replace(/_/g, ' ') ?? null,
    movement_profile_id: meta.movementProfileId ?? null,
    category:            meta.category ?? rawData.category ?? 'strength',
    session_type:        'live',
    started_at:          startedAt,
    ended_at:            now,
    duration_seconds:    durationSeconds,
    source_type:         'camera',

    rep_count:           repCount,
    average_form_score:  avgFormScore,
    lowest_form_score:   lowestFormScore,
    highest_form_score:  highestFormScore,
    movement_score:      movementScore,

    top_faults:          topFaults,
    fault_frequency:     faultFrequency,
    coaching_cues:       rawData.coaching_cues ?? [],

    tracking_confidence: trackingConf,
    visibility_quality:  visibilityBand(trackingConf),
    readiness_status:    rawData.readiness_status ?? null,

    rom_summary:         rawData.rom_summary      ?? null,
    tempo_summary:       rawData.tempo_summary     ?? null,
    symmetry_summary:    rawData.symmetry_summary  ?? null,
    body_side_bias:      rawData.body_side_bias    ?? null,
    risk_flags:          rawData.risk_flags        ?? [],

    rep_summaries:       repSumms,
    form_timeline:       rawData.form_timeline ?? [],

    session_status:      status,
    notes:               null,
  };
}

/**
 * Returns a human-readable save outcome message.
 */
export function sessionSaveMessage(session) {
  switch (session.session_status) {
    case 'complete':        return 'Session saved';
    case 'partial':         return 'Session saved with partial data';
    case 'low_confidence':  return 'Session saved with limited tracking quality';
    case 'aborted':         return 'Short session saved';
    default:                return 'Session saved';
  }
}