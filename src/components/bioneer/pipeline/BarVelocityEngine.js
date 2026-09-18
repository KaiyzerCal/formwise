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

/**
 * Half-width of the fitting window, in milliseconds.
 *
 * Velocity is the slope of a quadratic least-squares fit to the samples
 * inside +/- this of the evaluation point.
 *
 * 120ms either side is set by the worst case, not the typical one: at 15fps —
 * which this pipeline does hit on weaker phones — 80ms each way held only
 * about three samples, one short of what a quadratic needs, and the engine
 * went silent exactly where it was needed most. 240ms spans ~4.6 samples at
 * 15fps and ~7 at 30fps.
 *
 * The cost is 120ms of lag, and a quadratic rather than a moving average
 * because a quadratic can represent curvature — it follows the peak of a
 * concentric instead of flattening it.
 */
const FIT_HALF_MS = 120;

/** A fit needs more points than it has coefficients, or it interpolates noise. */
const MIN_FIT_POINTS = 4;

/**
 * Below this, it was not a rep.
 *
 * Landmark jitter crossing the stillness floor during a pause opens and closes
 * a phase that travels a few millimetres, and it arrives in the set as a rep
 * with a near-zero velocity — which then becomes the "best rep" nothing else
 * can beat and poisons every loss figure after it. 8cm is far below any real
 * concentric and far above any noise excursion.
 */
const MIN_RISE_M = 0.08;

/** Likewise: a concentric faster than this is a detection artefact. */
const MIN_DURATION_MS = 150;

/**
 * Velocity from a local quadratic fit rather than a difference between two
 * frames.
 *
 * Differencing two adjacent samples divides landmark noise by a small dt,
 * which is how the first version manufactured 1.15 m/s peaks out of a lift
 * that never exceeded 0.70. A quadratic fit over a window uses every sample
 * in that window, so a single bad landmark moves the answer slightly instead
 * of dominating it, and irregular frame spacing is handled natively because
 * t is a fitted variable rather than an assumed constant.
 *
 * Fits y = a + b·dt + c·dt² and returns both at dt = 0: the smoothed position
 * `a` and the slope `b`. Sign is flipped by the caller: GHUM y grows downward.
 *
 * The position matters as much as the slope. Mean concentric velocity is
 * defined as displacement over duration, and taking both from the same fit at
 * the same instant keeps them consistent — the filter's lag cancels out of a
 * difference between two of its own outputs.
 *
 * @param {{t:number,y:number}[]} pts — samples, t in ms
 * @param {number} tEval             — where to evaluate, ms
 * @returns {{pos:number, vel:number}|null} metres and metres per second
 */
function fitSlope(pts, tEval) {
  const n = pts.length;
  if (n < MIN_FIT_POINTS) return null;

  // Normal equations for a quadratic in dt (seconds). Built directly rather
  // than via a matrix library: it is 3x3 and this runs every frame.
  let S0 = 0, S1 = 0, S2 = 0, S3 = 0, S4 = 0;
  let T0 = 0, T1 = 0, T2 = 0;
  for (const p of pts) {
    const d = (p.t - tEval) / 1000;
    const d2 = d * d;
    S0 += 1;      S1 += d;       S2 += d2;
    S3 += d2 * d; S4 += d2 * d2;
    T0 += p.y;    T1 += p.y * d; T2 += p.y * d2;
  }

  // Solve [[S0,S1,S2],[S1,S2,S3],[S2,S3,S4]] · [a,b,c]ᵀ = [T0,T1,T2]ᵀ by
  // Cramer's rule; we only need b.
  const det =
      S0 * (S2 * S4 - S3 * S3)
    - S1 * (S1 * S4 - S3 * S2)
    + S2 * (S1 * S3 - S2 * S2);

  // Near-singular means the samples are effectively coincident in time —
  // every frame landed in the same instant, so there is no slope to find.
  if (!Number.isFinite(det) || Math.abs(det) < 1e-12) return null;

  const detA =
      T0 * (S2 * S4 - S3 * S3)
    - S1 * (T1 * S4 - T2 * S3)
    + S2 * (T1 * S3 - T2 * S2);

  const detB =
      S0 * (T1 * S4 - T2 * S3)
    - T0 * (S1 * S4 - S3 * S2)
    + S2 * (S1 * T2 - T1 * S2);

  const a = detA / det;
  const b = detB / det;
  return Number.isFinite(a) && Number.isFinite(b) ? { pos: a, vel: b } : null;
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
    this._buf = [];        // { t, y } inside the fitting window
    this._prevT = null;    // last accepted sample time, for gap rejection
    this._lastEvalT = null;
    this._sign = 0;        // +1 rising, -1 falling, 0 still
    this._trace = [];      // fitted { t, y } — smoothed position, centred
    this._phaseFrom = null; // fitted time the current phase opened
    this._peak = 0;         // best fitted velocity seen in the current phase
    this._acc = [];         // { v, dtMs } for the phase underway
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

    const dtMs = this._prevT === null ? null : tMs - this._prevT;

    // A duplicate delivery carries no new information; a long stall means the
    // samples either side do not describe one motion. Both drop the window
    // rather than fitting across the hole.
    if (dtMs !== null && (dtMs < MIN_DT_MS || dtMs > MAX_DT_MS)) {
      this._buf = [{ t: tMs, y }];
      this._prevT = tMs;
      return null;
    }

    this._buf.push({ t: tMs, y });
    this._prevT = tMs;

    // Evaluate at the window centre, not the newest sample. A fit is far more
    // stable in the middle of its data than extrapolated to the edge, and the
    // cost is about one half-window of lag — under a tenth of a second, which
    // a lifter will not perceive but a differentiator badly needs.
    const tEval = tMs - FIT_HALF_MS;
    while (this._buf.length && this._buf[0].t < tEval - FIT_HALF_MS) this._buf.shift();

    const fit = fitSlope(this._buf, tEval);
    if (fit === null) return null;

    // Negative because GHUM y grows downward: rising means y decreasing.
    const up = -fit.vel;

    // Time actually advanced since the last value we emitted — this is what
    // the phase accumulator weights by, so it must be the emitted cadence and
    // not the raw frame gap.
    const stepMs = this._lastEvalT === null ? (dtMs ?? 0) : tEval - this._lastEvalT;
    this._lastEvalT = tEval;
    if (stepMs <= 0) return { up, dtMs: dtMs ?? 0, moving: Math.abs(up) >= STILL_MS };

    // The fitted position, kept for every frame including still ones. Raw
    // positions were tried here and are the wrong trace: over a pause the
    // lifter's true position is flat, so picking its extreme means picking the
    // noisiest sample in the plateau, and the turnaround lands at a random
    // moment inside it. With +/-5mm of jitter that inflated the concentric's
    // duration enough to read a true 0.70 m/s rep as 0.55.
    //
    // The fit is evaluated at the centre of its window, so unlike a causal
    // filter it does not displace the extremum in time — which is the one
    // property this needs.
    this._trace.push({ t: tEval, y: fit.pos });
    while (this._trace.length && this._trace[0].t < tEval - 6000) this._trace.shift();

    const moving = Math.abs(up) >= STILL_MS;
    this._segment(up, stepMs, moving, tEval);

    return { up, dtMs: dtMs ?? 0, moving, samples: this._buf.length };
  }

  /**
   * Accumulate samples into phases, closing one when direction reverses.
   *
   * Direction is only allowed to change on a sample that clears the stillness
   * floor, so the pause at the bottom of a squat does not shred one concentric
   * into several.
   */
  /**
   * Phase boundaries come from the fitted velocity; the numbers reported come
   * from the raw positions inside them.
   *
   * Those are different jobs and they want different signals. Sign changes
   * need a smooth curve, or landmark jitter splits every rep into a dozen.
   * Displacement does not: position is only jittery by a few millimetres
   * against half a metre of travel, and it carries none of the filter's lag.
   * Deriving both from the smoothed signal is what left mean velocity ~10%
   * low no matter how the phase edges were nudged.
   */
  _segment(up, dtMs, moving, tEval) {
    const sign = !moving ? this._sign : (up > 0 ? 1 : -1);

    if (sign !== this._sign) {
      this._close(tEval);
      this._sign = sign;
      this._phaseFrom = tEval;
      this._peak = 0;
      this._acc = [];
    }
    if (sign === 1 && moving) {
      if (up > this._peak) this._peak = up;
      this._acc.push({ v: up, dtMs });
    }
  }

  _close(tEval = this._lastEvalT) {
    const from = this._phaseFrom;
    this._phaseFrom = null;
    if (this._sign !== 1 || from === null || tEval === null) return;

    // The raw samples spanning this phase, widened by one half-window at each
    // end: the fit lags, so the true turnarounds sit slightly outside the
    // window the fitted velocity called "moving".
    const lo = from - FIT_HALF_MS;
    const hi = tEval + FIT_HALF_MS;
    const span = this._trace.filter((r) => r.t >= lo && r.t <= hi);
    if (span.length < MIN_FIT_POINTS) return;

    // Turnarounds are position extremes, read off the unsmoothed trace.
    // Ties resolve to the LAST moment at the bottom and the FIRST at the top,
    // so a pause at the bottom or a hold at the top is not billed as lift time.
    let bottom = span[0], top = span[0];
    for (const r of span) {
      if (r.y >= bottom.y) bottom = r;          // y grows downward
      if (r.y <  top.y)    top = r;
    }

    const durationMs = top.t - bottom.t;
    const rise = bottom.y - top.y;

    // A concentric that does not actually rise, or is too short to be one, is
    // a detection artefact rather than a rep.
    if (durationMs < MIN_DURATION_MS || rise < MIN_RISE_M) return;

    // Mean concentric velocity: the time-weighted average of the fitted
    // velocity across the phase.
    //
    // Displacement-over-duration was tried instead and is worse, for a reason
    // that is intrinsic rather than fixable: at a turnaround the bar is by
    // definition stationary, so the *time* of a position extreme is poorly
    // determined — noise moves it anywhere inside the pause. Averaging the
    // velocity never asks that question. Weighting by elapsed time is what
    // keeps a dropped frame from silently reweighting the mean.
    // Averaged over the body of the lift, not its edges.
    //
    // The fit spans 240ms, so the samples at each end of a phase straddle the
    // turnaround and average stationary bar with moving bar. Including them
    // dragged a true 0.72 m/s concentric down to 0.57 even with no noise at
    // all. Trimming to the samples above a quarter of the rep's own peak
    // drops exactly those, and scales with the lift rather than assuming a
    // fixed speed — the same rule works for a fast bench and a grinding
    // deadlift.
    const floor = Math.max(STILL_MS, this._peak * 0.25);
    const body = this._acc.filter((x) => x.v >= floor);
    const use = body.length >= 2 ? body : this._acc;

    const totalMs = use.reduce((a, x) => a + x.dtMs, 0);
    if (totalMs <= 0) return;
    const meanVelocity = use.reduce((a, x) => a + x.v * x.dtMs, 0) / totalMs;

    this._reps.push({
      meanVelocity,
      // Peak comes from the fitted curve, which is smooth by construction and
      // cannot turn one bad landmark into a spike the way differencing two
      // frames did — that read 1.15 m/s off a lift that never passed 0.70.
      peakVelocity: this._peak,
      displacementM: rise,
      durationMs,
      samples: this._acc.length,
    });
  }

  /** Close any phase still open — call at the end of a set. */
  finish() {
    this._close(this._lastEvalT);
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
