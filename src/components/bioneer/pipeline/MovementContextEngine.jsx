/**
 * MovementContextEngine
 *
 * Computes multi-frame movement context signals from kinematic angle history.
 * Sits between KinematicsEngine and FaultDetector in the pipeline.
 *
 * Pipeline position:
 *   kinematics → MovementContextEngine → phase/fault interpretation
 *
 * Produces per frame:
 *   velocities            — deg/sec per joint
 *   accelerations         — deg/sec² per joint
 *   trajectories          — 'ascending'|'descending'|'stable' per joint
 *   stability             — 0-100 per joint (low variance = high stability)
 *   symmetryTrend         — 0-100 per L/R pair (100 = perfectly symmetric)
 *   phaseContinuityConf   — 0-1  (does motion direction match expected phase?)
 *   transitionSmoothness  — 0-1  (how clean was the last phase boundary?)
 *   controlScore          — 0-100 (descent quality — stability + absence of spikes)
 *   hasJerkiness          — bool (acceleration spike detected)
 *   hasAsymmetry          — bool (L/R diff > threshold)
 *   isControlled          — bool (composite quality flag)
 */

// Rolling window sizes
const WIN_VELOCITY   = 3;   // frames for velocity / trajectory
const WIN_STABILITY  = 10;  // frames for per-joint stability
const WIN_SYMMETRY   = 20;  // frames for L/R symmetry trend
const MAX_HISTORY    = 30;  // maximum stored frames (~1 s at 30 fps)

// deg/sec² threshold that indicates a jerk / uncontrolled movement
const JERK_THRESHOLD = 800;

// Expected joint trajectory directions per common movement phase.
// 'down' = angle decreasing (flexion), 'up' = extension, 'hold' = stable
const PHASE_EXPECTED_DIR = {
  descent:    { knee: 'down', hip: 'down' },
  lowering:   { knee: 'down', hip: 'down' },
  eccentric:  { knee: 'down', hip: 'down' },
  bottom:     { knee: 'hold', hip: 'hold' },
  hang:       { knee: 'hold', hip: 'hold' },
  ascent:     { knee: 'up',   hip: 'up'   },
  concentric: { knee: 'up',   hip: 'up'   },
  lockout:    { knee: 'up',   hip: 'up'   },
  top:        { knee: 'hold', hip: 'hold' },
  pull:       { hip:  'up',   knee: 'up'  },
  press:      { elbow: 'up'               },
  load:       { knee: 'down', hip: 'down' },
  takeoff:    { knee: 'up',   hip: 'up'   },
  land:       { knee: 'down', hip: 'down' },
  contact:    { knee: 'hold', hip: 'hold' },
};

// Joints grouped as 'knee', 'hip', 'elbow' for phase direction lookup
// maps group → array of angle keys that belong to that group
const JOINT_GROUPS = {
  knee:  ['kneeL', 'kneeR'],
  hip:   ['hipHingeL', 'hipHingeR'],
  elbow: ['elbowL', 'elbowR'],
};

export class MovementContextEngine {
  constructor() {
    this._history    = [];  // [{ tMs, angles, phase }]
    this._prevVel    = {};  // last computed velocity per joint key
    this._lastPhase  = null;
    this._transitionVelMag = 0; // peak avg velocity magnitude at last phase transition
  }

  /**
   * Call once per frame after KinematicsEngine.compute().
   *
   * @param {Object} angles  — from KinematicsEngine (kneeL, hipHingeL, torsoLean, …)
   * @param {string} phaseId — current phase id (may be null)
   * @param {number} tMs     — frame timestamp ms
   * @returns {Object}       — context signals (see module header)
   */
  update(angles, phaseId, tMs) {
    this._history.push({ tMs, angles: { ...angles }, phase: phaseId });
    if (this._history.length > MAX_HISTORY) this._history.shift();

    const n = this._history.length;
    if (n < 2) return this._empty();

    const prev = this._history[n - 2];
    const curr = this._history[n - 1];
    const dtMs = Math.max(1, curr.tMs - prev.tMs);

    // ── 1. Per-joint velocity (deg/sec) ───────────────────────────────────────
    const velocities = {};
    for (const key of Object.keys(curr.angles)) {
      const c = curr.angles[key];
      const p = prev.angles[key];
      if (typeof c === 'number' && typeof p === 'number') {
        velocities[key] = (c - p) / dtMs * 1000;
      }
    }

    // ── 2. Per-joint acceleration (deg/sec²) ──────────────────────────────────
    const accelerations = {};
    const dtSec = dtMs / 1000;
    for (const key of Object.keys(velocities)) {
      const prevV = this._prevVel[key] ?? velocities[key];
      accelerations[key] = (velocities[key] - prevV) / dtSec;
    }
    this._prevVel = { ...velocities };

    // ── 3. Trajectory direction per joint (over velocity window) ──────────────
    const trajectories = {};
    if (n >= WIN_VELOCITY + 1) {
      const base = this._history[n - WIN_VELOCITY - 1].angles;
      const last = curr.angles;
      for (const key of Object.keys(last)) {
        if (typeof last[key] !== 'number' || typeof base[key] !== 'number') continue;
        const delta = last[key] - base[key];
        trajectories[key] = Math.abs(delta) < 1.5
          ? 'stable'
          : delta > 0 ? 'ascending' : 'descending';
      }
    }

    // ── 4. Short-window stability per joint (variance → 0-100 score) ──────────
    const stability = {};
    const stabSlice = this._history.slice(-WIN_STABILITY);
    const allKeys = new Set(stabSlice.flatMap(f => Object.keys(f.angles)));
    for (const key of allKeys) {
      const vals = stabSlice.map(f => f.angles[key]).filter(v => typeof v === 'number');
      if (vals.length < 3) { stability[key] = 80; continue; }
      const mean     = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
      const stddev   = Math.sqrt(variance);
      // stddev 0 → 100, stddev ≥ 15° → 0
      stability[key] = Math.round(Math.max(0, Math.min(100, 100 - (stddev / 15) * 100)));
    }

    // ── 5. L/R symmetry trend (rolling window) ────────────────────────────────
    const symmetryTrend = {};
    const symSlice = this._history.slice(-WIN_SYMMETRY);
    const symPairs = [
      ['kneeL',     'kneeR',     'knee'],
      ['hipHingeL', 'hipHingeR', 'hip'],
      ['elbowL',    'elbowR',    'elbow'],
    ];
    for (const [lKey, rKey, name] of symPairs) {
      const diffs = symSlice
        .map(f => {
          const l = f.angles[lKey], r = f.angles[rKey];
          return (typeof l === 'number' && typeof r === 'number') ? Math.abs(l - r) : null;
        })
        .filter(d => d != null);
      if (diffs.length < 3) continue;
      const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      // avgDiff 0° → 100, avgDiff ≥ 20° → 0
      symmetryTrend[name] = Math.round(Math.max(0, Math.min(100, 100 - (avgDiff / 20) * 100)));
    }

    // ── 6. Phase continuity confidence ───────────────────────────────────────
    let phaseContinuityConf = 0.75; // neutral default
    if (phaseId) {
      const expected = PHASE_EXPECTED_DIR[phaseId] ?? {};
      let matches = 0, checks = 0;
      for (const [group, dir] of Object.entries(expected)) {
        const keys = JOINT_GROUPS[group] ?? [group];
        for (const key of keys) {
          if (!trajectories[key]) continue;
          checks++;
          const expectedDir = dir === 'down' ? 'descending'
                            : dir === 'up'   ? 'ascending'
                            :                  'stable';
          if (trajectories[key] === expectedDir) matches++;
        }
      }
      if (checks > 0) {
        // 0.5 (all wrong) → 1.0 (all correct)
        phaseContinuityConf = 0.5 + (matches / checks) * 0.5;
      }
    }

    // ── 7. Transition smoothness ──────────────────────────────────────────────
    // Measured at moment of phase boundary — abrupt velocity spike = low smoothness
    if (phaseId !== this._lastPhase) {
      const vMags = Object.values(velocities)
        .filter(v => typeof v === 'number')
        .map(v => Math.abs(v));
      this._transitionVelMag = vMags.length
        ? vMags.reduce((a, b) => a + b, 0) / vMags.length
        : 0;
      this._lastPhase = phaseId;
    }
    // > 200 deg/sec = abrupt (0.0), < 50 deg/sec = smooth (1.0)
    const transitionSmoothness = Math.max(0, Math.min(1,
      1 - (this._transitionVelMag - 50) / 150
    ));

    // ── 8. Control score ──────────────────────────────────────────────────────
    // Primarily meaningful during descent/eccentric phases
    const descentPhases = new Set(['descent', 'lowering', 'eccentric', 'load', 'land', 'contact']);
    const inDescent = descentPhases.has(phaseId);

    let controlScore = 80; // neutral
    if (inDescent) {
      const kneeStab = ((stability['kneeL'] ?? 70) + (stability['kneeR'] ?? 70)) / 2;
      const hipStab  = ((stability['hipHingeL'] ?? 70) + (stability['hipHingeR'] ?? 70)) / 2;
      const baseStab = (kneeStab + hipStab) / 2;
      // Penalize acceleration spikes during controlled descent
      const accMag = (Math.abs(accelerations['kneeL'] ?? 0) + Math.abs(accelerations['kneeR'] ?? 0)) / 2;
      const accPenalty = Math.min(30, accMag / 100);
      controlScore = Math.round(Math.max(0, Math.min(100, baseStab - accPenalty)));
    }

    // ── 9. Jerk / asymmetry flags ─────────────────────────────────────────────
    const hasJerkiness = Object.values(accelerations).some(a => Math.abs(a) > JERK_THRESHOLD);
    const hasAsymmetry = Object.values(symmetryTrend).some(s => s < 70);

    return {
      velocities,
      accelerations,
      trajectories,
      stability,
      symmetryTrend,
      phaseContinuityConf,
      transitionSmoothness,
      controlScore,
      hasJerkiness,
      hasAsymmetry,
      isControlled: controlScore >= 65 && !hasJerkiness,
    };
  }

  _empty() {
    return {
      velocities: {}, accelerations: {}, trajectories: {}, stability: {},
      symmetryTrend: {}, phaseContinuityConf: 0.75, transitionSmoothness: 1.0,
      controlScore: 80, hasJerkiness: false, hasAsymmetry: false, isControlled: true,
    };
  }

  reset() {
    this._history   = [];
    this._prevVel   = {};
    this._lastPhase = null;
    this._transitionVelMag = 0;
  }
}