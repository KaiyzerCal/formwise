/**
 * FPSGovernor
 *
 * Adaptive frame-rate controller for the pose inference loop.
 * Monitors actual achieved FPS and device performance budget, then
 * recommends a throttle interval (ms between inference calls) so the
 * page stays responsive on mid-tier phones.
 *
 * Usage:
 *   const gov = new FPSGovernor({ target: 30 });
 *   // each RAF tick:
 *   const allow = gov.tick(performance.now());
 *   if (allow) runInference();
 */

const SAMPLE_WINDOW   = 30;   // frames to average FPS over
const HIGH_FPS_TARGET = 30;   // desired fps — high-end
const LOW_FPS_TARGET  = 20;   // fallback fps — low-end
const BUDGET_HIGH_MS  = 33;   // frame budget at 30fps
const BUDGET_LOW_MS   = 50;   // frame budget at 20fps
const SLOW_THRESHOLD  = 22;   // fps below this → throttle down
const RECOVER_FRAMES  = 90;   // frames of good perf before stepping back up

export class FPSGovernor {
  /**
   * @param {object} opts
   * @param {number} [opts.target=30]   — desired FPS ceiling
   * @param {number} [opts.minFPS=15]   — minimum acceptable FPS
   */
  constructor({ target = HIGH_FPS_TARGET, minFPS = 15 } = {}) {
    this._target     = target;
    this._minFPS     = minFPS;
    this._intervalMs = BUDGET_HIGH_MS;   // current throttle interval
    this._lastMs     = 0;
    this._frameTimes = [];               // ring buffer of recent frame durations
    this._slowFrames = 0;
    this._goodFrames = 0;
  }

  /**
   * Call every RAF tick.
   * @param {number} nowMs — performance.now()
   * @returns {boolean} true if an inference call should be made this frame
   */
  tick(nowMs) {
    const elapsed = nowMs - this._lastMs;

    // Sample frame timing
    this._frameTimes.push(elapsed);
    if (this._frameTimes.length > SAMPLE_WINDOW) this._frameTimes.shift();

    // Only allow inference when throttle interval has elapsed
    if (elapsed < this._intervalMs) return false;

    this._lastMs = nowMs;
    this._adapt();
    return true;
  }

  /** Current recommended inference interval in ms */
  get intervalMs() { return this._intervalMs; }

  /** Current estimated achieved FPS */
  get fps() {
    if (this._frameTimes.length < 2) return this._target;
    const avg = this._frameTimes.reduce((a, b) => a + b, 0) / this._frameTimes.length;
    return avg > 0 ? Math.round(1000 / avg) : this._target;
  }

  /** 'high' | 'medium' | 'low' performance tier */
  get tier() {
    const f = this.fps;
    if (f >= 25) return 'high';
    if (f >= 18) return 'medium';
    return 'low';
  }

  // ── Internal adaptive logic ─────────────────────────────────────────────

  _adapt() {
    const currentFps = this.fps;

    if (currentFps < SLOW_THRESHOLD) {
      this._slowFrames++;
      this._goodFrames = 0;
      // Step down after 5 consecutive slow frames
      if (this._slowFrames >= 5) {
        this._intervalMs = Math.min(BUDGET_LOW_MS, this._intervalMs + 5);
        this._slowFrames = 0;
      }
    } else {
      this._goodFrames++;
      this._slowFrames = 0;
      // Recover after sustained good performance
      if (this._goodFrames >= RECOVER_FRAMES && this._intervalMs > BUDGET_HIGH_MS) {
        this._intervalMs = Math.max(BUDGET_HIGH_MS, this._intervalMs - 5);
        this._goodFrames = 0;
      }
    }

    // Hard clamp to valid range
    const maxInterval = Math.round(1000 / Math.max(this._minFPS, 1));
    this._intervalMs  = Math.max(BUDGET_HIGH_MS, Math.min(maxInterval, this._intervalMs));
  }

  reset() {
    this._intervalMs = BUDGET_HIGH_MS;
    this._lastMs     = 0;
    this._frameTimes = [];
    this._slowFrames = 0;
    this._goodFrames = 0;
  }
}