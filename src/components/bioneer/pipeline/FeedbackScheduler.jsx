/**
 * FeedbackScheduler — priority-sorted cue queue
 * Rules:
 * - ONE cue at a time. Always.
 * - 15s lock (only HIGH can interrupt)
 * - 60s cooldown per cue
 * - 200ms rep-start suppression window
 * - Cue text: ≤ 8 words, present tense, action only
 */

export class FeedbackScheduler {
  constructor() {
    this.queue          = [];
    this.activeCue      = null;
    this.activeCueStart = null;
    this.recentCues     = {};     // cueId → last surfaced tMs
    this.history        = [];
    this.LOCK_MS        = 8_000;
    this.COOLDOWN_MS    = 20_000;
    this.suppressUntil  = 0;
    this.uiCallback     = null;
  }

  /** Call this on rep start — suppresses cues for suppressMs */
  setRepStartSuppression(tMs, suppressMs = 200) {
    this.suppressUntil = tMs + suppressMs;
  }

  /** Set callback: fn({ text, severity, tMs }) */
  onCue(fn) {
    this.uiCallback = fn;
  }

  /** Feed confirmed fault objects; call once per frame */
  ingest(confirmedFaults, phase, tMs) {
    if (tMs < this.suppressUntil) return;

    for (const fault of confirmedFaults) {
      const cueId   = fault.id;
      const lastSeen= this.recentCues[cueId] ?? 0;
      if (tMs - lastSeen < this.COOLDOWN_MS) continue;

      const item = {
        id:       cueId,
        text:     fault.cue,
        priority: fault.severity === 'HIGH' ? 0 : fault.severity === 'MODERATE' ? 1 : 2,
        severity: fault.severity,
        tMs,
      };

      // HIGH fault always interrupts non-HIGH active cue
      if (item.priority === 0 && this.activeCue && this.activeCue.priority > 0) {
        this._surface(item);
        return;
      }

      if (!this.queue.find(q => q.id === cueId)) {
        this.queue.push(item);
        this.queue.sort((a, b) => a.priority - b.priority); // priority queue: 0 first
      }
    }

    this._tick(tMs);
  }

  _tick(tMs) {
    if (this.activeCue && tMs - this.activeCueStart >= this.LOCK_MS) {
      this.activeCue = null;
    }
    if (!this.activeCue && this.queue.length > 0) {
      this._surface(this.queue.shift());
    }
  }

  _surface(item) {
    this.activeCue          = item;
    this.activeCueStart     = item.tMs;
    this.recentCues[item.id]= item.tMs;
    this.history.push({ ...item, surfacedAt: item.tMs });
    this.uiCallback?.({ text: item.text, severity: item.severity, tMs: item.tMs });
  }

  getActiveCue()  { return this.activeCue; }
  getHistory()    { return this.history; }

  reset() {
    this.queue          = [];
    this.activeCue      = null;
    this.activeCueStart = null;
    this.recentCues     = {};
    this.suppressUntil  = 0;
  }
}