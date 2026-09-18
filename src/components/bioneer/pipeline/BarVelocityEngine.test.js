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
    // A two-second gap is a stalled pipeline. The lifter moved, but not at a
    // speed these two samples can describe.
    const e = new BarVelocityEngine();
    e.update(hipsAt(0), 1000);
    expect(e.update(hipsAt(-0.5), 3000)).toBeNull();
  });

  it('re-seeds after a stall instead of measuring across it', () => {
    const e = new BarVelocityEngine();
    e.update(hipsAt(0), 1000);
    e.update(hipsAt(-0.5), 3000);            // stall, rejected
    const r = e.update(hipsAt(-0.5 - 0.02), 3033);  // 0.02m in 33ms ≈ 0.606 m/s
    expect(r).not.toBeNull();
    expect(r.up).toBeCloseTo(0.606, 2);
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
    expect(set.reps[0].meanVelocity).toBeCloseTo(0.6, 1);
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
    expect(set.bestVelocity).toBeCloseTo(0.62, 1);
    // 0.44 against a 0.62 best ≈ 29% down.
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
    expect(set.bestVelocity).toBeCloseTo(0.65, 1);
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

describe('degraded input', () => {
  it('returns null rather than NaN when the joints are missing', () => {
    const e = new BarVelocityEngine();
    expect(e.update({}, 1000)).toBeNull();
    expect(e.update(null, 1033)).toBeNull();
  });

  it('works from one visible hip', () => {
    const e = new BarVelocityEngine();
    e.update({ l_hip: { x: 0, y: 0, z: 0 } }, 1000);
    const r = e.update({ l_hip: { x: 0, y: -0.02, z: 0 } }, 1033);
    expect(r.up).toBeCloseTo(0.606, 2);
  });

  it('can track the wrists instead, for presses', () => {
    const e = new BarVelocityEngine('wrists');
    e.update({ l_wrist: { x: 0, y: 0 }, r_wrist: { x: 0, y: 0 } }, 1000);
    const r = e.update({ l_wrist: { x: 0, y: -0.03 }, r_wrist: { x: 0, y: -0.03 } }, 1033);
    expect(r.up).toBeCloseTo(0.909, 2);
    expect(e.getSet().track).toBe('wrists');
  });
});
