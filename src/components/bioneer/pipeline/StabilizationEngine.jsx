// Layer 3: Stabilization Engine
// Five sequential filters: confidence gate → outlier rejection → bone-length constraint → EMA → hysteresis

const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

const BONE_PAIRS = [
  ['l_shoulder', 'l_elbow'], ['l_elbow', 'l_wrist'],
  ['r_shoulder', 'r_elbow'], ['r_elbow', 'r_wrist'],
  ['l_hip', 'l_knee'],       ['l_knee', 'l_ankle'],
  ['r_hip', 'r_knee'],       ['r_knee', 'r_ankle'],
  ['neck', 'chest'],         ['chest', 'pelvis'],
];

export class StabilizationEngine {
  constructor() {
    this.prev           = {};
    this.refLengths     = null;
    this.warmupFrames   = [];
    this.WARMUP_COUNT   = 10;

    // Hysteresis
    this.pendingState   = null;
    this.pendingStartMs = null;
    this.currentState   = null;
    this.ESCALATE_MS    = 250;
    this.DEESCALATE_MS  = 400;

    // Thresholds
    this.CONFIDENCE_MIN = 0.60;
    this.OUTLIER_MAX    = 0.08;
    this.BONE_TOLERANCE = 0.20;
    this.EMA_MIN        = 0.08;
    this.EMA_SCALE      = 0.35;
  }

  process(rawJoints, visibilityMap, tMs) {
    const out = {};

    for (const [id, pos] of Object.entries(rawJoints)) {
      const vis = visibilityMap[id] ?? 1;

      // [1] Confidence gate
      if (vis < this.CONFIDENCE_MIN) {
        out[id] = this.prev[id] ?? pos;
        continue;
      }

      // [2] Outlier rejection
      if (this.prev[id]) {
        const dx = Math.abs(pos.x - this.prev[id].x);
        const dy = Math.abs(pos.y - this.prev[id].y);
        if (dx > this.OUTLIER_MAX || dy > this.OUTLIER_MAX) {
          out[id] = this.prev[id];
          continue;
        }
      }

      // [4] Confidence-weighted EMA
      const α = this.EMA_SCALE * vis + this.EMA_MIN;
      if (this.prev[id]) {
        out[id] = {
          x: α * pos.x + (1 - α) * this.prev[id].x,
          y: α * pos.y + (1 - α) * this.prev[id].y,
        };
      } else {
        out[id] = { x: pos.x, y: pos.y };
      }
    }

    // [3] Bone-length constraint
    if (!this.refLengths) {
      this.warmupFrames.push(out);
      if (this.warmupFrames.length >= this.WARMUP_COUNT) {
        this.refLengths = this._computeRefLengths(this.warmupFrames);
      }
    } else {
      this._applyBoneLengthConstraints(out);
    }

    this.prev = out;
    return out;
  }

  _computeRefLengths(frames) {
    const lengths = {};
    for (const [a, b] of BONE_PAIRS) {
      const vals = frames
        .filter(f => f[a] && f[b])
        .map(f => dist(f[a], f[b]));
      if (vals.length > 0)
        lengths[`${a}-${b}`] = vals.reduce((s, v) => s + v, 0) / vals.length;
    }
    return lengths;
  }

  _applyBoneLengthConstraints(joints) {
    for (const [proximal, distal] of BONE_PAIRS) {
      const refKey = `${proximal}-${distal}`;
      const ref = this.refLengths[refKey];
      if (!ref || !joints[proximal] || !joints[distal]) continue;

      const actual = dist(joints[proximal], joints[distal]);
      const ratio  = actual / ref;

      if (Math.abs(ratio - 1) > this.BONE_TOLERANCE) {
        const dx  = joints[distal].x - joints[proximal].x;
        const dy  = joints[distal].y - joints[proximal].y;
        const mag = Math.sqrt(dx * dx + dy * dy) || 0.001;
        joints[distal] = {
          x: joints[proximal].x + (dx / mag) * ref,
          y: joints[proximal].y + (dy / mag) * ref,
        };
      }
    }
  }

  // [5] Hysteresis gating for phase/state changes
  gateStateChange(candidate, tMs) {
    if (candidate === this.currentState) {
      this.pendingState   = null;
      this.pendingStartMs = null;
      return this.currentState;
    }

    const threshold = candidate === null ? this.DEESCALATE_MS : this.ESCALATE_MS;

    if (candidate !== this.pendingState) {
      this.pendingState   = candidate;
      this.pendingStartMs = tMs;
      return this.currentState;
    }

    if (tMs - this.pendingStartMs >= threshold) {
      this.currentState   = candidate;
      this.pendingState   = null;
      this.pendingStartMs = null;
    }

    return this.currentState;
  }

  reset() {
    this.prev         = {};
    this.refLengths   = null;
    this.warmupFrames = [];
    this.pendingState = null;
    this.pendingStartMs = null;
    this.currentState = null;
  }
}