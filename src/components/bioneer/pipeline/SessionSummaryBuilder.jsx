/**
 * SessionSummaryBuilder — aggregates SessionLogger data into a structured summary.
 *
 * Usage:
 *   const builder = new SessionSummaryBuilder();
 *   builder.addRep(repEvent, score, faults);
 *   builder.addFault(faultId, phaseId, tMs);
 *   const summary = builder.build();
 */

export class SessionSummaryBuilder {
  constructor() {
    this._reps    = [];  // { repNumber, score, faults[], tMs }
    this._faults  = [];  // { faultId, phaseId, tMs }
    this._phases  = {};  // phaseId → { frames, scores[] }
  }

  addRep(repEvent, score, faults = []) {
    this._reps.push({
      repNumber: repEvent.repNumber,
      score:     score ?? null,
      faults:    faults.map(f => f.id ?? f),
      tMs:       repEvent.tMs ?? Date.now(),
    });
  }

  addFault(faultId, phaseId, tMs) {
    this._faults.push({ faultId, phaseId, tMs });
  }

  addPhaseFrame(phaseId, score) {
    if (!phaseId) return;
    if (!this._phases[phaseId]) this._phases[phaseId] = { frames: 0, scores: [] };
    this._phases[phaseId].frames++;
    if (score != null) this._phases[phaseId].scores.push(score);
  }

  build() {
    const repTimeline = this._reps.map(r => ({
      rep:    r.repNumber,
      score:  r.score,
      faults: r.faults,
      tMs:    r.tMs,
    }));

    const avgRepScore = this._reps.length > 0
      ? Math.round(this._reps.reduce((s, r) => s + (r.score ?? 0), 0) / this._reps.length)
      : 0;

    // Fault heatmap: faultId → count
    const faultHeatmap = {};
    for (const f of this._faults) {
      faultHeatmap[f.faultId] = (faultHeatmap[f.faultId] ?? 0) + 1;
    }

    // Top corrections (sorted by frequency)
    const topCorrections = Object.entries(faultHeatmap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([faultId, count]) => ({ faultId, count }));

    // Per-phase average scores
    const phaseMetrics = {};
    for (const [phase, data] of Object.entries(this._phases)) {
      phaseMetrics[phase] = {
        frames: data.frames,
        avgScore: data.scores.length > 0
          ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
          : null,
      };
    }

    return {
      totalReps:      this._reps.length,
      avgRepScore,
      repTimeline,
      faultHeatmap,
      topCorrections,
      phaseMetrics,
    };
  }

  reset() {
    this._reps   = [];
    this._faults = [];
    this._phases = {};
  }
}