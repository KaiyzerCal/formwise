/**
 * BarVelocityEngine — metric vertical velocity from GHUM world joints.
 *
 * WHY THIS EXISTS
 *
 * StabilizationEngine already emits a `velocities` map, but it is not velocity
 * in any physical sense:
 *
 *     const rawVel = { x: pos.x - this.prev[id].x, ... }
 *
 * That is a per-frame delta of *normalized image coordinates* — screen
 * fractions per frame. It is the right signal for the outlier rejection and
 * smoothing it feeds, and the wrong one for anything a lifter reads. Two
 * people at different camera distances get different numbers for the same
 * lift, and every value rescales when the framerate moves. tMs is already
 * passed into that engine and never used for it.
 *
 * This computes the other thing: metres per second, off the GHUM world
 * joints (already plumbed through normalizeLandmarks → `world`), divided by
 * real elapsed time.
 *
 * COORDINATE CONVENTION
 *
 * BlazePose GHUM world landmarks are metres, origin at the midpoint of the
 * hips, and y grows *downward* — same sense as image coordinates. So upward
 * motion is negative dy, and `up` velocity is -(dy/dt). Getting this backwards
 * silently reports every concentric as an eccentric, which is why it is
 * asserted in the tests rather than left to a comment.
 *
 * WHAT IT IS HONEST ABOUT
 *
 * Mean concentric velocity survives this sampling rate. Peak velocity does
 * not: inference runs at ~15-30fps with frames dropped while busy, so a fast
 * concentric yields perhaps 6-12 samples and the true peak falls between
 * them. Peak is reported, and reported as an underestimate.
 *
 * The number that matters most needs none of that accuracy. Velocity *loss*
 * — this rep against the best rep of the set — is a ratio within one camera
 * setup, so scale error and peak attenuation largely cancel. That is the
 * basis of the most-used VBT protocol, and it is the part this can do well.
 */

/** Hips are the steadiest bar proxy for squat/deadlift; wrists track the bar on presses. */
export const TRACKING_JOINTS = {
  hips:      ['l_hip', 'r_hip'],
  shoulders: ['l_shoulder', 'r_shoulder'],
  wrists:    ['l_wrist', 'r_wrist'],
};

/**
 * Below this the lifter is not moving, and dividing noise by a small dt
 * produces impressive nonsense. 0.02 m/s is well under the slowest grind.
 */
const STILL_MS = 0.02;

/**
 * Guards against a division that explodes. Two frames closer than 4ms apart
 * are a duplicate delivery, not motion; a gap over 500ms means inference
 * stalled and the samples either side are not a velocity.
 */
const MIN_DT_MS = 4;
const MAX_DT_MS = 500;

/** Median of 3 — kills single-frame landmark pops without the lag of an EMA. */
function median3(a, b, c) {
  return Math.max(Math.min(a, b), Math.min(Math.max(a, b), c));
}

function midpointY(world, names) {
  let sum = 0, n = 0;
  for (const name of names) {
    const j = world?.[name];
    if (j && Number.isFinite(j.y)) { sum += j.y; n++; }
  }
  return n === 0 ? null : sum / n;
}

export class BarVelocityEngine {
  /**
   * @param {'hips'|'shoulders'|'wrists'} [track] — which landmark proxies the bar
   */
  constructor(track = 'hips') {
    this.setTracking(track);
    this.reset();
  }

  setTracking(track) {
    this.joints = TRACKING_JOINTS[track] ?? TRACKING_JOINTS.hips;
    this.track = TRACKING_JOINTS[track] ? track : 'hips';
  }

  reset() {
    this._prevY = null;
    this._prevT = null;
    this._recent = [];     // last 3 raw velocities, for the median filter
    this._sign = 0;        // +1 rising, -1 falling, 0 still
    this._samples = [];    // { v, dtMs } for the phase currently underway
    this._reps = [];       // completed concentric phases
  }

  /**
   * One frame.
   *
   * @param {Object} world — metric joints from normalizeLandmarks().world
   * @param {number} tMs   — the same timestamp processFrame already receives
   * @returns {{ up: number, raw: number, dtMs: number, moving: boolean }|null}
   *          `up` is m/s, positive upward. null until a second usable frame.
   */
  update(world, tMs) {
    const y = midpointY(world, this.joints);
    if (y === null || !Number.isFinite(tMs)) return null;

    if (this._prevY === null) {
      this._prevY = y;
      this._prevT = tMs;
      return null;
    }

    const dtMs = tMs - this._prevT;

    // A stalled or duplicated frame is not a measurement. Re-seed from it so
    // the next real frame differentiates against something current, rather
    // than against a stale position across the whole gap.
    if (dtMs < MIN_DT_MS || dtMs > MAX_DT_MS) {
      this._prevY = y;
      this._prevT = tMs;
      return null;
    }

    // Negative because GHUM y grows downward: rising means y decreasing.
    const raw = -((y - this._prevY) / (dtMs / 1000));

    this._prevY = y;
    this._prevT = tMs;

    this._recent.push(raw);
    if (this._recent.length > 3) this._recent.shift();
    const up = this._recent.length === 3
      ? median3(this._recent[0], this._recent[1], this._recent[2])
      : raw;

    const moving = Math.abs(up) >= STILL_MS;
    this._segment(up, dtMs, moving);

    return { up, raw, dtMs, moving };
  }

  /**
   * Accumulate samples into phases, closing one when direction reverses.
   *
   * Direction is only allowed to change on a sample that clears the stillness
   * floor, so the pause at the bottom of a squat does not shred one concentric
   * into several.
   */
  _segment(up, dtMs, moving) {
    const sign = !moving ? this._sign : (up > 0 ? 1 : -1);

    if (sign !== this._sign) {
      this._close();
      this._sign = sign;
    }
    if (moving && sign !== 0) this._samples.push({ v: up, dtMs });
  }

  _close() {
    // Only upward phases are reps, and only ones long enough to be real.
    if (this._sign === 1 && this._samples.length >= 3) {
      const totalMs = this._samples.reduce((s, x) => s + x.dtMs, 0);
      // Time-weighted, so a dropped frame does not silently reweight the mean.
      const weighted = this._samples.reduce((s, x) => s + x.v * x.dtMs, 0);
      this._reps.push({
        meanVelocity: weighted / totalMs,
        peakVelocity: Math.max(...this._samples.map((x) => x.v)),
        durationMs: totalMs,
        samples: this._samples.length,
      });
    }
    this._samples = [];
  }

  /** Close any phase still open — call at the end of a set. */
  finish() {
    this._close();
    this._sign = 0;
    return this.getSet();
  }

  /**
   * The set so far.
   *
   * `velocityLossPct` is measured against the best rep rather than the first:
   * the first rep of a set is often not the fastest, and grading against it
   * reports a loss that never happened.
   */
  getSet() {
    const reps = this._reps.map((r, i) => ({ index: i + 1, ...r }));
    if (reps.length === 0) {
      return { reps: [], bestVelocity: null, velocityLossPct: null, track: this.track };
    }
    const best = Math.max(...reps.map((r) => r.meanVelocity));
    const last = reps[reps.length - 1].meanVelocity;
    return {
      reps: reps.map((r) => ({
        ...r,
        lossFromBestPct: best > 0 ? ((best - r.meanVelocity) / best) * 100 : 0,
      })),
      bestVelocity: best,
      velocityLossPct: best > 0 ? ((best - last) / best) * 100 : 0,
      track: this.track,
    };
  }

  /**
   * Whether the set has decayed past a stop threshold.
   *
   * 20% is the common prescription; it is a parameter because the right number
   * depends on the goal, and pretending otherwise would bake one coach's
   * protocol into the engine.
   */
  shouldStopSet(thresholdPct = 20) {
    const { velocityLossPct, reps } = this.getSet();
    if (reps.length < 2 || velocityLossPct === null) return false;
    return velocityLossPct >= thresholdPct;
  }
}
