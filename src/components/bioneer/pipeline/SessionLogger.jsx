/**
 * SessionLogger — non-blocking structured session log
 * Frame-sampled at 10fps (every 3rd frame at 30fps)
 * Never writes synchronously inside the frame loop
 */

export class SessionLogger {
  constructor(sessionId, movementId, userId) {
    this.session = {
      id:         sessionId,
      movementId,
      userId,
      startedAt:  Date.now(),
      endedAt:    null,
      reps:       [],
      faultLog:   [],
      phaseLog:   [],
      frames:     [],
      summary:    null,
    };
    this.frameCounter  = 0;
    this.FRAME_SAMPLE  = 3;  // 30fps → 10fps stored
    this.lastPhaseId   = null;
  }

  logFrame(smoothedJoints, angles, phaseId, tMs) {
    this.frameCounter++;
    if (this.frameCounter % this.FRAME_SAMPLE !== 0) return;
    this.session.frames.push({ tMs, phase: phaseId, angles });
  }

  logRep(repEvent, score, faultIds) {
    this.session.reps.push({
      repNumber:  repEvent.repNumber,
      startMs:    repEvent.tMs - (repEvent.durationMs ?? 0),
      endMs:      repEvent.tMs,
      durationMs: repEvent.durationMs ?? 0,
      score,
      faultIds:   faultIds ?? [],
    });
  }

  logFault(faultId, phaseId, tMs, confidence) {
    this.session.faultLog.push({ faultId, phase: phaseId, tMs, confidence });
  }

  logPhase(phaseId, tMs) {
    if (phaseId === this.lastPhaseId) return;
    this.lastPhaseId = phaseId;
    this.session.phaseLog.push({ phaseId, tMs });
  }

  finalize() {
    this.session.endedAt = Date.now();
    this.session.summary = this._buildSummary();
    return this.session;
  }

  getPartial() {
    return {
      reps:      this.session.reps.length,
      faultLog:  this.session.faultLog,
      phaseLog:  this.session.phaseLog,
    };
  }

  _buildSummary() {
    const faultFreq = {};
    for (const { faultId } of this.session.faultLog) {
      faultFreq[faultId] = (faultFreq[faultId] ?? 0) + 1;
    }
    const topFaults = Object.entries(faultFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, count]) => ({ faultId: id, count }));

    const scores = this.session.reps.map(r => r.score).filter(s => s != null);
    const avg    = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

    return {
      repCount:     this.session.reps.length,
      avgScore:     avg,
      topFaults,
      primaryFault: topFaults[0]?.faultId ?? null,
      durationMs:   this.session.endedAt - this.session.startedAt,
    };
  }
}