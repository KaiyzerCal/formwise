/**
 * AlertManager — Prioritizes alerts, prevents spam, triggers audio cues
 *
 * Rules:
 *  - Only 1 critical alert surfaced at a time
 *  - Per-alert cooldowns: danger=1500ms, warning=1000ms, ok=500ms
 *  - Audio fires ONLY on state change (green→yellow, yellow→red, etc.)
 */

const COOLDOWNS = { high: 1500, medium: 1000, low: 500 };

export class AlertManager {
  constructor({ onAlert, onAudio, muted = false } = {}) {
    this.onAlert   = onAlert;   // (alert) => void
    this.onAudio   = onAudio;   // ('warning'|'danger'|'perfect') => void
    this.muted     = muted;

    this._lastStatus    = 'green';
    this._alertTimers   = {};   // alertKey → lastFiredMs
    this._lastAlertKey  = null;
  }

  /**
   * Ingest feedback result from FormFeedbackEngine.
   * @param {{ status: string, alerts: Array }} feedback
   */
  ingest(feedback, nowMs = Date.now()) {
    const { status, alerts } = feedback;

    // ── Audio on state change ──────────────────────────────────────────────
    if (status !== this._lastStatus && !this.muted) {
      if (status === 'red')    this.onAudio?.('danger');
      else if (status === 'yellow') this.onAudio?.('warning');
      else if (status === 'green' && this._lastStatus !== 'green') this.onAudio?.('perfect');
    }
    this._lastStatus = status;

    if (!alerts.length) {
      this._lastAlertKey = null;
      return;
    }

    // ── Priority: surface only the highest-severity non-cooldown alert ─────
    const sorted = [...alerts].sort((a, b) => {
      const rank = { high: 2, medium: 1, low: 0 };
      return (rank[b.severity] ?? 0) - (rank[a.severity] ?? 0);
    });

    for (const alert of sorted) {
      const key = `${alert.joint}:${alert.issue}`;
      const cooldown = COOLDOWNS[alert.severity] ?? 1000;
      const lastFired = this._alertTimers[key] ?? 0;

      if (nowMs - lastFired >= cooldown) {
        this._alertTimers[key] = nowMs;
        // Only call onAlert if it's a different alert from the last one
        if (key !== this._lastAlertKey) {
          this._lastAlertKey = key;
          this.onAlert?.(alert);
        }
        break; // surface one alert at a time
      }
    }
  }

  setMuted(muted) {
    this.muted = muted;
  }

  reset() {
    this._lastStatus   = 'green';
    this._alertTimers  = {};
    this._lastAlertKey = null;
  }
}