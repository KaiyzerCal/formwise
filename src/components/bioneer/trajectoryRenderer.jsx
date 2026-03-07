/**
 * trajectoryRenderer
 *
 * TrajectoryRenderer  — single-joint phase-colored sparkline
 * MultiJointTrajectory — all joints with per-joint colors + phase dots + calibration
 */

// RepDetector state → display color
const PHASE_COLORS = {
  START:      '#60A5FA',
  ECCENTRIC:  '#F97316',
  BOTTOM:     '#A78BFA',
  CONCENTRIC: '#EAB308',
  LOCKOUT:    '#22C55E',
};

// Per-joint distinctive colors for multi-joint view
const JOINT_COLORS = {
  left_shoulder:  '#FF4444', right_shoulder: '#FF9900',
  left_elbow:     '#FFE500', right_elbow:    '#AAFF00',
  left_wrist:     '#00FF88', right_wrist:    '#00FFCC',
  left_hip:       '#00CCFF', right_hip:      '#0077FF',
  left_knee:      '#4400FF', right_knee:     '#AA00FF',
  left_ankle:     '#FF00FF', right_ankle:    '#FF0088',
  nose:           '#AAAAAA', left_eye:       '#FFAA33',
  right_eye:      '#33AAFF', mid_hip:        '#CCFF33',
  mid_shoulder:   '#FF33CC',
};

const MAX_FRAMES = 180; // ~6s @ 30fps
const CALIBRATION_FRAMES = 5;

// ── Single-joint sparkline ──────────────────────────────────────────────────

export class TrajectoryRenderer {
  constructor() {
    this._frames = [];
  }

  push(phase, jointAngles) {
    this._frames.push({ phase: phase ?? 'START', angles: { ...jointAngles } });
    if (this._frames.length > MAX_FRAMES) this._frames.shift();
  }

  draw(ctx, jointName, x, y, w, h) {
    const frames = this._frames;
    if (frames.length < 2) return;

    let minA = Infinity, maxA = -Infinity;
    for (const f of frames) {
      const a = f.angles[jointName];
      if (a == null) continue;
      if (a < minA) minA = a;
      if (a > maxA) maxA = a;
    }
    const range = maxA - minA || 1;
    const pad = 4;
    const toX = (i) => x + pad + (i / (MAX_FRAMES - 1)) * (w - pad * 2);
    const toY = (a) => y + h - pad - ((a - minA) / range) * (h - pad * 2);

    ctx.save();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 1; i < frames.length; i++) {
      const pa = frames[i - 1].angles[jointName];
      const ca = frames[i].angles[jointName];
      if (pa == null || ca == null) continue;
      ctx.strokeStyle = PHASE_COLORS[frames[i].phase] ?? '#ffffff';
      ctx.beginPath();
      ctx.moveTo(toX(i - 1), toY(pa));
      ctx.lineTo(toX(i), toY(ca));
      ctx.stroke();
    }
    ctx.restore();
  }

  reset() { this._frames = []; }
  get length() { return this._frames.length; }
}

// ── Multi-joint trajectory with calibration ─────────────────────────────────

export class MultiJointTrajectory {
  constructor(calibFrames = CALIBRATION_FRAMES) {
    this._calibFrames  = calibFrames;
    this._calibBuf     = [];
    this.isCalibrated  = false;
    this.startAngles   = {};
    this.peakAngles    = {};
    this._frames       = [];
  }

  /**
   * Feed a raw frame. Returns false while calibrating, true once ready.
   * @param {Object} jointAngles  — { joint_name: angleDegrees, ... }
   */
  calibrate(jointAngles) {
    if (this.isCalibrated) return true;
    this._calibBuf.push({ ...jointAngles });
    if (this._calibBuf.length >= this._calibFrames) {
      const joints = Object.keys(jointAngles);
      joints.forEach(j => {
        const vals = this._calibBuf.map(f => f[j]).filter(v => v != null);
        this.startAngles[j] = Math.min(...vals);
        this.peakAngles[j]  = Math.max(...vals);
      });
      this.isCalibrated = true;
    }
    return this.isCalibrated;
  }

  /**
   * Push a frame once calibrated.
   * @param {string} phase       — RepDetector state string
   * @param {Object} jointAngles
   */
  push(phase, jointAngles) {
    this._frames.push({ phase: phase ?? 'START', angles: { ...jointAngles } });
    if (this._frames.length > MAX_FRAMES) this._frames.shift();
  }

  /**
   * Draw all joint trajectories onto ctx (clears first).
   * Lines are colored by joint; phase dots overlaid on each segment.
   */
  draw(ctx) {
    const frames = this._frames;
    if (frames.length < 2) return;

    const cw = ctx.canvas.width;
    const ch = ctx.canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    const joints = Object.keys(frames[0].angles);

    // Global angle range across all joints for consistent Y axis
    let minA = Infinity, maxA = -Infinity;
    for (const f of frames) {
      for (const j of joints) {
        const a = f.angles[j];
        if (a == null) continue;
        if (a < minA) minA = a;
        if (a > maxA) maxA = a;
      }
    }
    const range = maxA - minA || 1;
    const pad = 6;
    const toX = (i) => pad + (i / (MAX_FRAMES - 1)) * (cw - pad * 2);
    const toY = (a) => ch - pad - ((a - minA) / range) * (ch - pad * 2);

    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    for (const joint of joints) {
      const color = JOINT_COLORS[joint] ?? '#ffffff';
      for (let i = 1; i < frames.length; i++) {
        const pa = frames[i - 1].angles[joint];
        const ca = frames[i].angles[joint];
        if (pa == null || ca == null) continue;

        const x0 = toX(i - 1), y0 = toY(pa);
        const x1 = toX(i),     y1 = toY(ca);

        // Joint-colored line
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();

        // Phase dot at segment end
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = PHASE_COLORS[frames[i].phase] ?? '#ffffff';
        ctx.beginPath();
        ctx.arc(x1, y1, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  reset() {
    this._frames      = [];
    this._calibBuf    = [];
    this.isCalibrated = false;
    this.startAngles  = {};
    this.peakAngles   = {};
  }

  get length() { return this._frames.length; }
}