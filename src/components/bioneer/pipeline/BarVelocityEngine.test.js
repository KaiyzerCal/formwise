// The point of these tests is that the number is in the right units and the
// right direction. A velocity engine that is plausible but wrong is worse than
// none: a lifter would autoregulate their training off it.
import { describe, it, expect } from 'vitest';
import { BarVelocityEngine } from './BarVelocityEngine';

/** GHUM world joints for a hip midpoint at height `y` metres (y grows downward). */
function hipsAt(y) {
  return { l_hip: { x: -0.1, y, z: 0 }, r_hip: { x: 0.1, y, z: 0 } };
}

/**
 * Feed a constant vertical speed.
 * @param up  metres per second, positive = rising
 */
function feedConstant(engine, { up, seconds, fps, startT = 1000, startY = 0 }) {
  const dt = 1000 / fps;
  const out = [];
  const frames = Math.round(seconds * fps);
  for (let i = 0; i <= frames; i++) {
    const t = startT + i * dt;
    // y decreases as the lifter rises
    const y = startY - up * (i * dt / 1000);
    out.push(engine.update(hipsAt(y), t));
  }
  return out.filter(Boolean);
}

/** Enough frames for a fit: velocity now comes from a window, not a pair. */
function burst(engine, { up, frames = 10, fps = 30, startT = 1000, startY = 0, joints = hipsAt }) {
  const dt = 1000 / fps;
  let last = null;
  for (let i = 0; i <= frames; i++) {
    const r = engine.update(joints(startY - up * (i * dt / 1000)), startT + i * dt);
    if (r) last = r;
  }
  return last;
}

describe('metres per second, not pixels per frame', () => {
  it('reports the speed it was given', () => {
    const e = new BarVelocityEngine('hips');
    const s = feedConstant(e, { up: 0.5, seconds: 1, fps: 30 });
    const last = s[s.length - 1];
    expect(last.up).toBeCloseTo(0.5, 5);
  });

  it('gives the same answer at a different framerate', () => {
    // The old per-frame delta fails this outright: halve the framerate and
    // every number doubles.
    const slow = feedConstant(new BarVelocityEngine(), { up: 0.4, seconds: 1, fps: 15 });
    const fast = feedConstant(new BarVelocityEngine(), { up: 0.4, seconds: 1, fps: 60 });
    expect(slow[slow.length - 1].up).toBeCloseTo(0.4, 5);
    expect(fast[fast.length - 1].up).toBeCloseTo(0.4, 5);
  });

  it('is unaffected by where the lifter is in the frame', () => {
    // World landmarks are hip-origin metric, so a lifter standing further from
    // the camera reads the same. Image coordinates would not.
    const near = feedConstant(new BarVelocityEngine(), { up: 0.6, seconds: 1, fps: 30, startY: 0 });
    const far  = feedConstant(new BarVelocityEngine(), { up: 0.6, seconds: 1, fps: 30, startY: 1.4 });
    expect(near[near.length - 1].up).toBeCloseTo(far[far.length - 1].up, 6);
  });
});

describe('direction', () => {
  it('calls rising positive, because GHUM y grows downward', () => {
    // Backwards here would label every concentric an eccentric and every set
    // would read as pure lowering.
    const e = new BarVelocityEngine();
    const s = feedConstant(e, { up: 0.5, seconds: 0.6, fps: 30 });
    expect(s[s.length - 1].up).toBeGreaterThan(0);
  });

  it('calls lowering negative', () => {
    const e = new BarVelocityEngine();
    const s = feedConstant(e, { up: -0.3, seconds: 0.6, fps: 30 });
    expect(s[s.length - 1].up).toBeCloseTo(-0.3, 5);
  });
});

describe('irregular frame delivery', () => {
  it('stays correct when frames arrive unevenly', () => {
    // Real inference drops frames while busy. A fixed assumed dt would read
    // the dropped-frame gap as a burst of speed.
    const e = new BarVelocityEngine();
    const gaps = [33, 33, 70, 33, 120, 33, 33, 45];
    let t = 1000, y = 0, last = null;
    for (const g of gaps) {
      t += g;
      y -= 0.45 * (g / 1000);  // constant 0.45 m/s rise
      const r = e.update(hipsAt(y), t);
      if (r) last = r;
    }
    expect(last.up).toBeCloseTo(0.45, 5);
  });

  it('refuses a duplicate frame rather than dividing by ~0', () => {
    const e = new BarVelocityEngine();
    e.update(hipsAt(0), 1000);
    expect(e.update(hipsAt(-0.01), 1001)).toBeNull();
  });

  it('refuses to differentiate across a long stall', () => {
    // A two-second gap is a stalled pipeline. The lifter moved, but no pair of
    // samples either side of that hole describes a speed.
    const e = new BarVelocityEngine();
    feedConstant(e, { up: 0.5, seconds: 0.6, fps: 30 });
    expect(e.update(hipsAt(-5), 3000)).toBeNull();
  });

  it('re-seeds after a stall instead of measuring across it', () => {
    // The window is dropped, so the next frames build a fresh fit rather than
    // one straddling the gap — which would read the whole stall as motion.
    const e = new BarVelocityEngine();
    feedConstant(e, { up: 0.5, seconds: 0.6, fps: 30 });
    e.update(hipsAt(-5), 3000);              // stall: window dropped
    const r = burst(e, { up: 0.45, frames: 10, startT: 3033, startY: -5 });
    expect(r).not.toBeNull();
    expect(r.up).toBeCloseTo(0.45, 1);
  });
});

describe('rep segmentation', () => {
  /** A rep: down at `ecc` m/s, pause, up at `con` m/s, over `range` metres. */
  function rep(engine, { con, ecc = 0.4, range = 0.5, fps = 30, t0 }) {
    let t = t0;
    const dt = 1000 / fps;
    let y = 0;
    for (let d = 0; d < range; d += ecc * (dt / 1000)) {
      y += ecc * (dt / 1000); engine.update(hipsAt(y), t); t += dt;
    }
    for (let i = 0; i < 5; i++) { engine.update(hipsAt(y), t); t += dt; }  // pause
    for (let d = 0; d < range; d += con * (dt / 1000)) {
      y -= con * (dt / 1000); engine.update(hipsAt(y), t); t += dt;
    }
    for (let i = 0; i < 5; i++) { engine.update(hipsAt(y), t); t += dt; }  // rack
    return t;
  }

  it('counts one concentric per rep and reports its mean speed', () => {
    const e = new BarVelocityEngine();
    let t = 1000;
    t = rep(e, { con: 0.6, t0: t });
    const set = e.finish();
    expect(set.reps).toHaveLength(1);
    // Systematically ~10% low, and that is measured rather than hoped for.
    // The 240ms fit window straddles both turnarounds, so the samples at each
    // end of a concentric average moving bar with stationary bar. Trimming to
    // the body of the lift removes most of it; what remains is the method's
    // floor, not a bug to be tuned away against a synthetic constant-velocity
    // rep. It is why absolute m/s is labelled an estimate in the UI and why
    // velocity *loss* — a ratio, where this cancels — is the number to act on.
    expect(set.reps[0].meanVelocity).toBeGreaterThan(0.6 * 0.85);
    expect(set.reps[0].meanVelocity).toBeLessThan(0.6 * 1.05);
  });

  it('does not split a concentric at the bottom pause', () => {
    // The pause is below the stillness floor, so direction must hold rather
    // than flipping to 0 and closing the phase early.
    const e = new BarVelocityEngine();
    rep(e, { con: 0.5, t0: 1000 });
    expect(e.finish().reps).toHaveLength(1);
  });

  it('tracks velocity loss across a fatiguing set', () => {
    const e = new BarVelocityEngine();
    let t = 1000;
    for (const con of [0.62, 0.60, 0.55, 0.48, 0.44]) t = rep(e, { con, t0: t });
    const set = e.finish();

    expect(set.reps).toHaveLength(5);

    // The ordering is the product. Absolute values run low, but a set that
    // slowed must read as slowing, monotonically, or the stop signal is noise.
    const means = set.reps.map((r) => r.meanVelocity);
    for (let i = 1; i < means.length; i++) {
      expect(means[i]).toBeLessThan(means[i - 1]);
    }
    // 0.44 against a 0.62 best is ~29% down; the ratio survives the offset.
    expect(set.velocityLossPct).toBeGreaterThan(20);
    expect(set.velocityLossPct).toBeLessThan(40);
  });

  it('measures loss from the best rep, not the first', () => {
    // Rep 2 is often the fastest. Grading against rep 1 reports a loss that
    // never happened — and worse, can report a negative one.
    const e = new BarVelocityEngine();
    let t = 1000;
    for (const con of [0.55, 0.65, 0.50]) t = rep(e, { con, t0: t });
    const set = e.finish();
    // Rep 2 was the fastest, so it must be the reference.
    expect(set.reps[1].meanVelocity).toBeGreaterThan(set.reps[0].meanVelocity);
    expect(set.reps[1].meanVelocity).toBeGreaterThan(set.reps[2].meanVelocity);
    expect(set.bestVelocity).toBeCloseTo(set.reps[1].meanVelocity, 6);
    expect(set.velocityLossPct).toBeGreaterThan(0);
  });

  it('answers the question a lifter actually asks', () => {
    const e = new BarVelocityEngine();
    let t = 1000;
    for (const con of [0.60, 0.58]) t = rep(e, { con, t0: t });
    e.finish();
    expect(e.shouldStopSet(20)).toBe(false);

    const f = new BarVelocityEngine();
    let t2 = 1000;
    for (const con of [0.60, 0.42]) t2 = rep(f, { con, t0: t2 });
    f.finish();
    expect(f.shouldStopSet(20)).toBe(true);
  });

  it('never reports a stop on a single rep', () => {
    const e = new BarVelocityEngine();
    rep(e, { con: 0.6, t0: 1000 });
    e.finish();
    expect(e.shouldStopSet(20)).toBe(false);
  });
});

describe('landmark noise', () => {
  // The demo that mattered. A clean synthetic set said the first version was
  // fine; adding +/-5mm of jitter — which is what MediaPipe actually delivers —
  // produced a phantom 7mm "rep" and scrambled the rep ordering entirely.
  // These pin the two properties that recovery depends on.
  function noisySet(jitterM, cons) {
    const e = new BarVelocityEngine('hips');
    const n = () => (Math.random() - 0.5) * 2 * jitterM;
    const hips = (y) => ({ l_hip: { x: -0.1, y: y + n() }, r_hip: { x: 0.1, y: y + n() } });
    let t = 1000, y = 0;
    const dt = () => (Math.random() < 0.12 ? 90 : 45 + Math.random() * 12);
    for (const con of cons) {
      for (let d = 0; d < 0.55;) { const s = 0.45 * (dt() / 1000); y += s; d += s; e.update(hips(y), t); t += 50; }
      for (let i = 0; i < 6; i++) { e.update(hips(y), t); t += 50; }
      for (let d = 0; d < 0.55;) { const s = con * (dt() / 1000); y -= s; d += s; e.update(hips(y), t); t += 50; }
      for (let i = 0; i < 8; i++) { e.update(hips(y), t); t += 50; }
    }
    return e.finish();
  }

  it('does not invent reps out of jitter during a pause', () => {
    // A few millimetres of wobble crossing the stillness floor used to open and
    // close a phase. It arrives as a near-zero-velocity rep, becomes the "best"
    // rep nothing can beat, and poisons every loss figure after it.
    const set = noisySet(0.005, [0.7, 0.6, 0.5]);
    expect(set.reps).toHaveLength(3);
    for (const r of set.reps) expect(r.displacementM).toBeGreaterThan(0.3);
  });

  it('keeps the rep ordering under realistic jitter', () => {
    // Absolute values drift; the ranking is what a stop decision rests on.
    const set = noisySet(0.005, [0.75, 0.6, 0.45]);
    expect(set.reps[0].meanVelocity).toBeGreaterThan(set.reps[2].meanVelocity);
    expect(set.velocityLossPct).toBeGreaterThan(15);
  });

  it('still reports a slowing set at 10mm of jitter', () => {
    const set = noisySet(0.01, [0.75, 0.62, 0.48, 0.4]);
    expect(set.reps.length).toBeGreaterThanOrEqual(3);
    expect(set.velocityLossPct).toBeGreaterThan(15);
  });
});

describe('degraded input', () => {
  it('returns null rather than NaN when the joints are missing', () => {
    const e = new BarVelocityEngine();
    expect(e.update({}, 1000)).toBeNull();
    expect(e.update(null, 1033)).toBeNull();
  });

  it('works from one visible hip', () => {
    // One side occluded is normal from a side-on camera angle.
    const e = new BarVelocityEngine();
    const r = burst(e, { up: 0.5, joints: (y) => ({ l_hip: { x: 0, y, z: 0 } }) });
    expect(r.up).toBeCloseTo(0.5, 1);
  });

  it('can track the wrists instead, for presses', () => {
    // Hips proxy the bar on a squat; on a bench press the wrists do.
    const e = new BarVelocityEngine('wrists');
    const r = burst(e, {
      up: 0.6,
      joints: (y) => ({ l_wrist: { x: -0.2, y }, r_wrist: { x: 0.2, y } }),
    });
    expect(r.up).toBeCloseTo(0.6, 1);
    expect(e.getSet().track).toBe('wrists');
  });
});
