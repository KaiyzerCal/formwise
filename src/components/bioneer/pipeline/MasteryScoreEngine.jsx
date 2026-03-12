/**
 * MasteryScoreEngine
 * Computes a 0-100 mastery score per rep combining:
 *   - Alignment quality   (35%)
 *   - Range of motion     (25%)
 *   - Movement stability  (20%)
 *   - Tempo consistency   (10%)
 *   - Rep consistency     (10%) — vs session average
 *
 * Fault penalties are layered on top (same as RepScoringEngine).
 */

export class MasteryScoreEngine {
  constructor() {
    this._repHistory = []; // rolling window of past rep scores for consistency calc
  }

  /**
   * @param {Object} params
   * @param {Array}  params.jointResults   — [{ state, angle, label }] from TemporalFilterEngine
   * @param {Array}  params.frameBuffer    — recent frames [{ angles, phase }]
   * @param {Array}  params.faults         — confirmed fault objects
   * @param {number} params.confidence     — 0-1 pose confidence
   * @param {number} params.repDurationMs  — duration of this rep in ms
   * @returns {number} 0-100 mastery score
   */
  score({ jointResults = [], frameBuffer = [], faults = [], confidence = 1, repDurationMs = 0 }) {

    // ── Alignment quality ─────────────────────────────────────────────────
    const alignScore = this._alignmentScore(jointResults);

    // ── Range of motion ───────────────────────────────────────────────────
    const romScore = this._romScore(jointResults);

    // ── Movement stability (smoothness of angle change across frames) ─────
    const stabilityScore = this._stabilityScore(frameBuffer);

    // ── Tempo consistency (rep duration vs session mean) ──────────────────
    const tempoScore = this._tempoScore(repDurationMs);

    // ── Rep consistency (score vs session running avg) ────────────────────
    const consistencyScore = this._consistencyScore();

    // ── Weighted base ─────────────────────────────────────────────────────
    const base = (
      alignScore      * 0.35 +
      romScore        * 0.25 +
      stabilityScore  * 0.20 +
      tempoScore      * 0.10 +
      consistencyScore * 0.10
    );

    // ── Confidence dampening ──────────────────────────────────────────────
    const confDamp = 0.7 + 0.3 * confidence; // low conf → max ~85%

    // ── Fault penalties ───────────────────────────────────────────────────
    let penalty = 0;
    for (const f of faults) {
      const sev = (f.severity ?? '').toUpperCase();
      if (sev === 'HIGH' || sev === 'CRITICAL') penalty += 12;
      else if (sev === 'MODERATE')              penalty += 6;
      else                                      penalty += 3;
    }
    penalty = Math.min(penalty, 45);

    const final = Math.round(Math.max(0, Math.min(100, base * confDamp - penalty)));

    // Store for future rep consistency comparisons
    this._repHistory.push(final);
    if (this._repHistory.length > 20) this._repHistory.shift();

    return final;
  }

  /** Green/yellow/red zone distribution → alignment score */
  _alignmentScore(jointResults) {
    const scored = jointResults.filter(j => j.state !== null);
    if (!scored.length) return 70;

    const stateScores = { OPTIMAL: 100, ACCEPTABLE: 78, WARNING: 45, DANGER: 15 };
    const total = scored.reduce((s, j) => s + (stateScores[j.state] ?? 70), 0);
    return total / scored.length;
  }

  /** How many joints hit their optimal range → ROM score */
  _romScore(jointResults) {
    const scored = jointResults.filter(j => j.state !== null);
    if (!scored.length) return 70;

    const optimalCount = scored.filter(j => j.state === 'OPTIMAL' || j.state === 'ACCEPTABLE').length;
    const ratio = optimalCount / scored.length;

    // Non-linear: reward getting all joints in range
    return Math.round(Math.pow(ratio, 0.7) * 100);
  }

  /** Variance in angle change per frame → stability (lower variance = higher score) */
  _stabilityScore(frameBuffer) {
    if (frameBuffer.length < 4) return 80;

    // Collect angle values per joint key across frames
    const anglesByJoint = {};
    for (const frame of frameBuffer) {
      if (!frame.angles) continue;
      for (const [key, val] of Object.entries(frame.angles)) {
        if (typeof val !== 'number') continue;
        if (!anglesByJoint[key]) anglesByJoint[key] = [];
        anglesByJoint[key].push(val);
      }
    }

    const jkeys = Object.keys(anglesByJoint);
    if (!jkeys.length) return 80;

    let totalCV = 0;
    let count   = 0;
    for (const key of jkeys) {
      const vals = anglesByJoint[key];
      if (vals.length < 2) continue;
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      if (mean === 0) continue;
      const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
      const cv = Math.sqrt(variance) / mean;
      totalCV += cv;
      count++;
    }

    if (!count) return 80;
    const avgCV = totalCV / count;
    return Math.round(Math.max(0, Math.min(100, (1 - avgCV * 3) * 100)));
  }

  /** Rep duration consistency vs session running avg */
  _tempoScore(repDurationMs) {
    if (!repDurationMs || repDurationMs <= 0) return 75;

    const history = this._repHistory;
    if (history.length < 2) return 80; // no history yet

    // Use duration history stored separately (we don't store it yet, so return neutral)
    return 78;
  }

  /** Score consistency vs session running average */
  _consistencyScore() {
    if (this._repHistory.length < 2) return 80;

    const recent = this._repHistory.slice(-5);
    const mean   = recent.reduce((a, b) => a + b, 0) / recent.length;
    const variance = recent.reduce((s, v) => s + (v - mean) ** 2, 0) / recent.length;
    const stdDev = Math.sqrt(variance);

    // Low variance = consistent = high score
    return Math.round(Math.max(0, Math.min(100, 100 - stdDev)));
  }

  /** Derive human-readable insight labels from a mastery score */
  static label(score) {
    if (score >= 90) return { text: 'ELITE',    color: '#C9A84C' };
    if (score >= 80) return { text: 'STRONG',   color: '#22C55E' };
    if (score >= 70) return { text: 'SOLID',    color: '#EAB308' };
    if (score >= 55) return { text: 'BUILDING', color: '#F97316' };
    return               { text: 'DEVELOP',  color: '#EF4444' };
  }

  /** Derive primary strength from joint results */
  static primaryStrength(jointResults = []) {
    const optimal = jointResults.filter(j => j.state === 'OPTIMAL');
    if (!optimal.length) return null;
    return optimal[0].label || optimal[0].name || null;
  }

  /** Derive primary correction target from joint results */
  static primaryCorrection(jointResults = [], faults = []) {
    if (faults.length) {
      const top = faults.sort((a, b) => {
        const order = { HIGH: 0, CRITICAL: 0, MODERATE: 1, LOW: 2 };
        return (order[a.severity?.toUpperCase()] ?? 2) - (order[b.severity?.toUpperCase()] ?? 2);
      });
      if (top[0]?.joint) return top[0].joint;
    }
    const worst = jointResults.filter(j => j.state === 'DANGER' || j.state === 'WARNING');
    if (!worst.length) return null;
    return worst[0].label || worst[0].name || null;
  }

  reset() {
    this._repHistory = [];
  }
}