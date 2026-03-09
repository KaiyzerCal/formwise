/**
 * motion/reporting/BiomechanicsReportBuilder.js
 *
 * Transforms a finalized SessionSummary into a structured,
 * coach-readable biomechanics report.
 *
 * Usage:
 *   const report = new BiomechanicsReportBuilder(summary, profile).build();
 */

export class BiomechanicsReportBuilder {
  /**
   * @param {Object} summary  — from SessionLogger.finalize() or SessionSummaryBuilder.build()
   * @param {Object} profile  — MovementProfile
   */
  constructor(summary, profile = {}) {
    this.summary = summary;
    this.profile = profile;
  }

  build() {
    const { summary, profile } = this;

    return {
      meta: {
        movementId:   profile.id ?? summary.movementId ?? null,
        displayName:  profile.displayName ?? summary.movementId ?? 'Movement',
        category:     profile.category ?? 'strength',
        generatedAt:  Date.now(),
        durationMs:   summary.durationMs ?? (summary.endedAt - summary.startedAt) ?? null,
      },
      performance: {
        repCount:     summary.repCount      ?? summary.totalReps      ?? 0,
        avgScore:     summary.avgScore      ?? summary.avgRepScore     ?? null,
        topScore:     summary.topScore      ?? null,
        bottomScore:  summary.bottomScore   ?? null,
      },
      faults: {
        topCorrections: summary.topCorrections ?? summary.topFaults ?? [],
        heatmap:        summary.faultHeatmap   ?? summary.faultCounts ?? {},
        primaryFault:   summary.primaryFault   ?? (summary.topCorrections?.[0]?.faultId ?? null),
      },
      phases: summary.phaseMetrics ?? {},
      timeline: summary.repTimeline ?? summary.timeline ?? [],
      coaching: this._buildCoachingInsights(summary),
    };
  }

  _buildCoachingInsights(summary) {
    const topFaults = summary.topCorrections ?? summary.topFaults ?? [];
    if (!topFaults.length) return { headline: 'Great session — no major corrections needed.', cues: [] };

    const headline = `Focus on: ${topFaults[0]?.faultId?.replace(/_/g, ' ') ?? 'technique'}`;
    const cues = topFaults.slice(0, 3).map(f => f.faultId?.replace(/_/g, ' '));
    return { headline, cues };
  }
}