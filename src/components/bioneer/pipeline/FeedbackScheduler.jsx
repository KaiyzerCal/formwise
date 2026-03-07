// Layer 5: Feedback Delivery Engine
// One active cue at a time. 15s lock. 60s cooldown. HIGH faults interrupt immediately.

const LOCK_MS     = 15_000;
const COOLDOWN_MS = 60_000;

export class FeedbackScheduler {
  constructor() {
    this.activeQueue      = [];
    this.currentCue       = null;
    this.currentCueStart  = null;
    this.recentCues       = {};   // cueId → last surfaced tMs
    this.history          = [];   // all surfaced cues with tMs (CoachNow pattern)
    this._uiCallback      = null;
  }

  onUIReady(callback) {
    this._uiCallback = callback;
  }

  ingest(faults, phaseId, phaseCue, tMs) {
    // Build cue items from faults
    for (const fault of faults) {
      this._enqueue({
        id:       fault.id,
        text:     this._short(fault.correction),
        priority: fault.severity === 'HIGH' ? 0 : 1,
        tMs,
        type:     'fault',
        severity: fault.severity,
      });
    }

    // Phase cue (lowest priority)
    if (phaseCue) {
      this._enqueue({
        id:       `phase_${phaseId}`,
        text:     this._short(phaseCue),
        priority: 2,
        tMs,
        type:     'phase',
        severity: 'LOW',
      });
    }

    this._tick(tMs);
  }

  _enqueue(cue) {
    const lastSeen = this.recentCues[cue.id] ?? 0;
    if (cue.tMs - lastSeen < COOLDOWN_MS) return;

    // HIGH fault interrupts any non-HIGH cue immediately
    if (cue.priority === 0 && this.currentCue && this.currentCue.priority > 0) {
      this._surface(cue);
      return;
    }

    if (!this.activeQueue.find(c => c.id === cue.id)) {
      this.activeQueue.push(cue);
      this.activeQueue.sort((a, b) => a.priority - b.priority);
    }
  }

  _tick(tMs) {
    // Retire expired cue
    if (this.currentCue && tMs - this.currentCueStart >= LOCK_MS) {
      this.currentCue = null;
    }

    // Surface next if slot empty
    if (!this.currentCue && this.activeQueue.length > 0) {
      this._surface(this.activeQueue.shift());
    }
  }

  _surface(cue) {
    this.currentCue      = cue;
    this.currentCueStart = cue.tMs;
    this.recentCues[cue.id] = cue.tMs;
    this.history.push({ ...cue, surfacedAt: cue.tMs });
    this._uiCallback?.(cue);
  }

  _short(text) {
    if (!text) return '';
    return text.split(' ').slice(0, 8).join(' ');
  }

  getHistory()  { return this.history; }
  getCurrent()  { return this.currentCue; }

  reset() {
    this.activeQueue     = [];
    this.currentCue      = null;
    this.currentCueStart = null;
    this.recentCues      = {};
    this.history         = [];
  }
}