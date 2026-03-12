/**
 * SystemHealthMonitor
 *
 * Passive watchdog that tracks subsystem health (camera, pose runtime, FPS)
 * and emits status events so the UI can surface warnings or trigger recovery.
 *
 * Usage:
 *   const mon = new SystemHealthMonitor();
 *   mon.onStatus = ({ status, issues }) => console.log(status, issues);
 *
 *   // Feed signals each frame / lifecycle event:
 *   mon.reportCamera('active');     // 'active' | 'failed' | 'unavailable'
 *   mon.reportPose('ready');        // 'idle' | 'initializing' | 'ready' | 'failed'
 *   mon.reportFPS(fps);             // number
 *   mon.reportFrameMs(processingMs);// number — processing time per frame
 */

const FPS_LOW_THRESHOLD    = 15;   // fps — warn below this
const FPS_CRIT_THRESHOLD   = 8;    // fps — critical below this
const FRAME_MS_WARN        = 80;   // ms processing time — warn above
const STALE_POSE_MS        = 3000; // ms without a pose frame — warn

export class SystemHealthMonitor {
  constructor() {
    this._camera         = 'unknown';
    this._pose           = 'unknown';
    this._fps            = 30;
    this._frameMs        = 0;
    this._lastPoseFrameMs = 0;
    this._issues         = new Set();
    this._status         = 'ok';    // 'ok' | 'warn' | 'critical'
    this._prevStatus     = null;

    /** @type {function({status: string, issues: string[]}): void} */
    this.onStatus = null;

    // Poll for stale pose frames every 2s
    this._pollId = setInterval(() => this._checkStalePose(), 2000);
  }

  // ── Reporters (call from outside each frame / event) ─────────────────────

  reportCamera(state) {
    this._camera = state;
    this._evaluate();
  }

  reportPose(state) {
    this._pose = state;
    if (state === 'ready') this._lastPoseFrameMs = Date.now();
    this._evaluate();
  }

  /** Call every time a pose result arrives */
  reportPoseFrame() {
    this._lastPoseFrameMs = Date.now();
  }

  reportFPS(fps) {
    this._fps = fps;
    this._evaluate();
  }

  reportFrameMs(ms) {
    this._frameMs = ms;
    this._evaluate();
  }

  // ── Public accessors ──────────────────────────────────────────────────────

  get status()  { return this._status; }
  get issues()  { return Array.from(this._issues); }
  get isHealthy() { return this._status === 'ok'; }

  destroy() {
    clearInterval(this._pollId);
    this.onStatus = null;
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  _checkStalePose() {
    if (this._pose !== 'ready') return;
    const elapsed = Date.now() - this._lastPoseFrameMs;
    if (elapsed > STALE_POSE_MS) {
      this._issues.add('pose_stale');
    } else {
      this._issues.delete('pose_stale');
    }
    this._evaluate();
  }

  _evaluate() {
    this._issues.clear();

    // Camera
    if (this._camera === 'failed' || this._camera === 'unavailable') {
      this._issues.add('camera_failed');
    }

    // Pose runtime
    if (this._pose === 'failed') {
      this._issues.add('pose_failed');
    }

    // FPS
    if (this._fps < FPS_CRIT_THRESHOLD) {
      this._issues.add('fps_critical');
    } else if (this._fps < FPS_LOW_THRESHOLD) {
      this._issues.add('fps_low');
    }

    // Frame processing time
    if (this._frameMs > FRAME_MS_WARN) {
      this._issues.add('processing_slow');
    }

    // Derive overall status
    const hasCritical = ['camera_failed', 'pose_failed', 'fps_critical'].some(k => this._issues.has(k));
    const hasWarn     = this._issues.size > 0;

    this._status = hasCritical ? 'critical' : hasWarn ? 'warn' : 'ok';

    if (this._status !== this._prevStatus) {
      this._prevStatus = this._status;
      this.onStatus?.({ status: this._status, issues: this.issues });
    }
  }
}