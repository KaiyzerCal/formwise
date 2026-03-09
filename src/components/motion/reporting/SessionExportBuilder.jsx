/**
 * motion/reporting/SessionExportBuilder.js
 *
 * Serializes a completed session into a portable export object.
 * Suitable for Base44 entity storage, PDF generation, or API payloads.
 */

export class SessionExportBuilder {
  constructor(sessionLog, report, metrics) {
    this.sessionLog = sessionLog;
    this.report     = report;
    this.metrics    = metrics;
  }

  /** Build a Base44-storable entity payload */
  toEntityPayload() {
    const r = this.report;
    const log = this.sessionLog;
    return {
      exercise_id:       r.meta.movementId,
      category:          r.meta.category,
      duration_seconds:  r.meta.durationMs ? Math.round(r.meta.durationMs / 1000) : null,
      form_score_overall: r.performance.avgScore,
      form_score_peak:   r.performance.topScore,
      form_score_lowest: r.performance.bottomScore,
      reps_detected:     r.performance.repCount,
      alerts:            log?.faultLog ?? [],
      phases:            r.phases,
      form_timeline:     r.timeline,
    };
  }

  /** Build a full export for coach/API use */
  toFullExport() {
    return {
      report:   this.report,
      metrics:  this.metrics,
      session:  this.sessionLog,
      exportedAt: Date.now(),
    };
  }
}