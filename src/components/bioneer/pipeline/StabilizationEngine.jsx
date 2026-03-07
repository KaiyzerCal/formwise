/**
 * StabilizationEngine — 5-filter stack
 * 1. Confidence gate
 * 2. Velocity-based outlier rejection
 * 3. Bone-length constraint
 * 4. Confidence-weighted EMA
 * 5. Velocity smoothing (NEW — what RepDetector reads)
 */

const CONFIDENCE_MIN   = 0.60;
const OUTLIER_NORMAL   = 0.08;  // 8% of frame width/height
const OUTLIER_FAST     = 0.14;  // raised for fast sports movement
const BONE_TOLERANCE   = 0.20;  // ±20% from reference
const EMA_MIN          = 0.08;
const EMA_MAX          = 0.42;
const VEL_ALPHA        = 0.40;
const FAST_VEL_THRESH  = 0.012; // movement speed that triggers fast-mode outlier threshold

// Pairs of joints that form bones for constraint
const BONE_PAIRS = [
  ['l_shoulder', 'l_elbow'],
  ['l_elbow',    'l_wrist'],
  ['r_shoulder', 'r_elbow'],
  ['r_elbow',    'r_wrist'],
  ['l_hip',      'l_knee'],
  ['l_knee',     'l_ankle'],
  ['r_hip',      'r_knee'],
  ['r_knee',     'r_ankle'],
  ['l_shoulder', 'r_shoulder'],
  ['l_hip',      'r_hip'],
];

export class StabilizationEngine {
  constructor() {
    this.prev         = {};        // prev smoothed positions
    this.prevVel      = {};        // prev smoothed velocities
    this.boneRef      = null;      // reference bone lengths
    this.refFrames    = 0;
    this.REF_FRAMES   = 10;
    this.refAccum     = {};
    this.interpolated = new Set(); // joints that were interpolated this frame
  }

  process(rawJoints, visibility, tMs) {
    this.interpolated.clear();

    // Detect fast movement for adaptive outlier threshold
    const maxVelMag = Object.values(this.prevVel).reduce((m, v) =>
      Math.max(m, Math.hypot(v.x, v.y)), 0);
    const outlierThresh = maxVelMag > FAST_VEL_THRESH ? OUTLIER_FAST : OUTLIER_NORMAL;

    // ── Filter 1: Confidence gate ──────────────────────
    const gated = {};
    for (const [id, pos] of Object.entries(rawJoints)) {
      const vis = visibility[id] ?? 0;
      if (vis >= CONFIDENCE_MIN) {
        gated[id] = { ...pos, vis };
      } else {
        // Fall back to previous smoothed position
        if (this.prev[id]) {
          gated[id] = { ...this.prev[id], vis, interpolated: true };
          this.interpolated.add(id);
        }
      }
    }

    // ── Filter 2: Velocity outlier rejection ──────────
    const outlierFiltered = {};
    for (const [id, pos] of Object.entries(gated)) {
      if (this.prev[id] && !pos.interpolated) {
        const dx = Math.abs(pos.x - this.prev[id].x);
        const dy = Math.abs(pos.y - this.prev[id].y);
        if (dx > outlierThresh || dy > outlierThresh) {
          // Outlier — use prev
          outlierFiltered[id] = { ...this.prev[id], vis: pos.vis };
          this.interpolated.add(id);
          continue;
        }
      }
      outlierFiltered[id] = pos;
    }

    // ── Filter 3: Bone-length constraint ──────────────
    // Accumulate reference bone lengths from early frames
    if (this.refFrames < this.REF_FRAMES) {
      this._accumulateBoneRef(outlierFiltered);
      this.refFrames++;
    }

    const boneClamped = this.boneRef
      ? this._clampBoneLengths(outlierFiltered)
      : outlierFiltered;

    // ── Filter 4: Confidence-weighted EMA ─────────────
    const smoothed = {};
    for (const [id, pos] of Object.entries(boneClamped)) {
      const α = Math.min(EMA_MAX, Math.max(EMA_MIN, 0.35 * (pos.vis ?? 0.5) + 0.08));
      if (this.prev[id]) {
        smoothed[id] = {
          x:   α * pos.x + (1 - α) * this.prev[id].x,
          y:   α * pos.y + (1 - α) * this.prev[id].y,
          vis: pos.vis,
        };
      } else {
        smoothed[id] = { x: pos.x, y: pos.y, vis: pos.vis ?? 0.5 };
      }
    }

    // ── Filter 5: Velocity smoothing ──────────────────
    const velocities = {};
    for (const [id, pos] of Object.entries(smoothed)) {
      if (this.prev[id]) {
        const rawVel = {
          x: pos.x - this.prev[id].x,
          y: pos.y - this.prev[id].y,
        };
        const pv = this.prevVel[id] ?? rawVel;
        velocities[id] = {
          x: VEL_ALPHA * rawVel.x + (1 - VEL_ALPHA) * pv.x,
          y: VEL_ALPHA * rawVel.y + (1 - VEL_ALPHA) * pv.y,
        };
      } else {
        velocities[id] = { x: 0, y: 0 };
      }
    }

    this.prev    = smoothed;
    this.prevVel = velocities;

    return { smoothed, velocities };
  }

  getPrev()       { return this.prev; }
  getPrevVel()    { return this.prevVel; }
  isInterpolated(id) { return this.interpolated.has(id); }

  _accumulateBoneRef(joints) {
    for (const [a, b] of BONE_PAIRS) {
      if (!joints[a] || !joints[b]) continue;
      const len = Math.hypot(joints[a].x - joints[b].x, joints[a].y - joints[b].y);
      if (!this.refAccum[`${a}-${b}`]) this.refAccum[`${a}-${b}`] = [];
      this.refAccum[`${a}-${b}`].push(len);
    }
    if (this.refFrames === this.REF_FRAMES - 1) {
      this.boneRef = {};
      for (const [k, vals] of Object.entries(this.refAccum)) {
        this.boneRef[k] = vals.reduce((s, v) => s + v, 0) / vals.length;
      }
    }
  }

  _clampBoneLengths(joints) {
    const result = { ...joints };
    for (const [a, b] of BONE_PAIRS) {
      const ref = this.boneRef[`${a}-${b}`];
      if (!ref || !result[a] || !result[b]) continue;
      const dx  = result[b].x - result[a].x;
      const dy  = result[b].y - result[a].y;
      const len = Math.hypot(dx, dy);
      if (len === 0) continue;
      const ratio = len / ref;
      if (ratio < (1 - BONE_TOLERANCE) || ratio > (1 + BONE_TOLERANCE)) {
        const targetLen = ref;
        const scale     = targetLen / len;
        result[b] = {
          ...result[b],
          x: result[a].x + dx * scale,
          y: result[a].y + dy * scale,
        };
      }
    }
    return result;
  }

  reset() {
    this.prev     = {};
    this.prevVel  = {};
    this.boneRef  = null;
    this.refFrames= 0;
    this.refAccum = {};
    this.interpolated.clear();
  }
}