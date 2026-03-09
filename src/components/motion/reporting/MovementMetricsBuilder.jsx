/**
 * motion/reporting/MovementMetricsBuilder.js
 *
 * Extracts per-movement quantitative metrics from a session log.
 * Powers future detailed coach views and comparison features.
 */

export class MovementMetricsBuilder {
  /**
   * @param {Object[]} reps     — rep log from SessionLogger
   * @param {Object[]} frames   — sampled frame log from SessionLogger
   * @param {Object}   profile  — MovementProfile
   */
  constructor(reps = [], frames = [], profile = {}) {
    this.reps    = reps;
    this.frames  = frames;
    this.profile = profile;
  }

  build() {
    return {
      repMetrics:   this._repMetrics(),
      angleRanges:  this._angleRanges(),
      phaseBalance: this._phaseBalance(),
    };
  }

  _repMetrics() {
    if (!this.reps.length) return null;
    const durations = this.reps.map(r => r.durationMs).filter(Boolean);
    const scores    = this.reps.map(r => r.score).filter(s => s != null);
    const avgDur    = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;
    const avgScore  = scores.length    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)    : null;
    return { count: this.reps.length, avgDurationMs: avgDur, avgScore };
  }

  _angleRanges() {
    const key = this.profile.primaryAngleKey;
    if (!key || !this.frames.length) return null;
    const vals = this.frames.map(f => f.angles?.[key]).filter(v => v != null);
    if (!vals.length) return null;
    return {
      angleKey: key,
      min:  Math.round(Math.min(...vals)),
      max:  Math.round(Math.max(...vals)),
      mean: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    };
  }

  _phaseBalance() {
    const phaseCounts = {};
    for (const f of this.frames) {
      if (f.phase) phaseCounts[f.phase] = (phaseCounts[f.phase] ?? 0) + 1;
    }
    return phaseCounts;
  }
}