import { describe, it, expect } from 'vitest';
import { angleBetween, extractAngles, normalizeLandmarksBBox } from './poseUtils.jsx';

const pt = (x, y, visibility = 1) => ({ x, y, visibility });

describe('angleBetween', () => {
  it('measures a right angle at the vertex', () => {
    // vertex at origin, arms along +Y and +X
    expect(angleBetween(pt(0, 1), pt(0, 0), pt(1, 0))).toBeCloseTo(90, 6);
  });

  it('measures a straight limb as 180 degrees', () => {
    expect(angleBetween(pt(-1, 0), pt(0, 0), pt(1, 0))).toBeCloseTo(180, 6);
  });

  it('measures a fully folded limb as 0 degrees', () => {
    // Both arms point the same way. These particular values divide exactly, so
    // dot/mag lands on 1.0 and acos is well behaved — see the clamp test below
    // for the case that does not.
    expect(angleBetween(pt(2, 0), pt(0, 0), pt(1, 0))).toBeCloseTo(0, 6);
  });

  it('clamps dot/mag so collinear arms cannot produce NaN', () => {
    // Regression test for the Math.max(-1, Math.min(1, ...)) guard.
    //
    // For exactly-collinear arms the cosine is mathematically 1, but the
    // floating-point route (dot product over the product of two square roots)
    // can land just above it. These coordinates produce 1.0000000000000002,
    // and Math.acos of that is NaN — which would propagate a NaN joint angle
    // through scoring rather than failing visibly. Removing the clamp makes
    // this test fail; the obvious "0 degrees" cases above do not catch it.
    const v = { x: 0.9625796061079517, y: -0.9225896205016646 };
    const k = 4.866227995705469;
    const a = pt(v.x, v.y);
    const c = pt(v.x * k, v.y * k);

    const angle = angleBetween(a, pt(0, 0), c);
    expect(angle).not.toBeNull();
    expect(Number.isNaN(angle)).toBe(false);
    expect(angle).toBeCloseTo(0, 6);
  });

  it('is invariant to which arm is named first', () => {
    const a = angleBetween(pt(0, 1), pt(0, 0), pt(1, 0));
    const b = angleBetween(pt(1, 0), pt(0, 0), pt(0, 1));
    expect(a).toBeCloseTo(b, 10);
  });

  it('is scale invariant', () => {
    const small = angleBetween(pt(0, 1), pt(0, 0), pt(1, 0));
    const large = angleBetween(pt(0, 1000), pt(0, 0), pt(1000, 0));
    expect(small).toBeCloseTo(large, 10);
  });

  it('ignores the z axis — it is a 2D projection, not a 3D angle', () => {
    // Documents a real limitation: two landmarks separated only in depth are
    // treated as coincident. Anything relying on true 3D angles cannot use this.
    const withZ = angleBetween(
      { x: 0, y: 1, z: 5 },
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: -5 },
    );
    expect(withZ).toBeCloseTo(90, 6);
  });

  it('returns null when any landmark is missing', () => {
    expect(angleBetween(null, pt(0, 0), pt(1, 0))).toBeNull();
    expect(angleBetween(pt(0, 1), undefined, pt(1, 0))).toBeNull();
    expect(angleBetween(pt(0, 1), pt(0, 0), null)).toBeNull();
  });

  it('returns null rather than NaN when a limb has zero length', () => {
    // A landmark sitting exactly on the vertex makes the magnitude zero.
    expect(angleBetween(pt(0, 0), pt(0, 0), pt(1, 0))).toBeNull();
  });
});

describe('extractAngles', () => {
  // MediaPipe Pose emits 33 landmarks; the guard rejects anything under 29.
  const fullBody = (overrides = {}) => {
    const lm = Array.from({ length: 33 }, () => pt(0.5, 0.5));
    for (const [i, v] of Object.entries(overrides)) lm[Number(i)] = v;
    return lm;
  };

  it('maps each configured angle id to its computed value', () => {
    const landmarks = fullBody({ 23: pt(0, 1), 25: pt(0, 0), 27: pt(1, 0) });
    const result = extractAngles(landmarks, [{ id: 'knee', indices: [23, 25, 27] }]);
    expect(result.knee).toBeCloseTo(90, 6);
  });

  it('returns an empty object for a truncated landmark array', () => {
    // Guards against a partially-decoded frame being scored as if it were real.
    const truncated = Array.from({ length: 28 }, () => pt(0.5, 0.5));
    expect(extractAngles(truncated, [{ id: 'knee', indices: [23, 25, 27] }])).toEqual({});
  });

  it('returns an empty object when landmarks are absent', () => {
    expect(extractAngles(null, [{ id: 'knee', indices: [23, 25, 27] }])).toEqual({});
  });

  it('yields a null angle for a joint whose landmarks are degenerate', () => {
    // 29+ landmarks so the guard passes, but the joint itself is unusable.
    const landmarks = fullBody({ 23: pt(0, 0), 25: pt(0, 0), 27: pt(1, 0) });
    const result = extractAngles(landmarks, [{ id: 'knee', indices: [23, 25, 27] }]);
    expect(result.knee).toBeNull();
  });
});

describe('normalizeLandmarksBBox', () => {
  it('maps the visible bounding box onto the unit square', () => {
    const out = normalizeLandmarksBBox([pt(10, 20), pt(30, 60)]);
    expect(out[0].x).toBeCloseTo(0, 10);
    expect(out[0].y).toBeCloseTo(0, 10);
    expect(out[1].x).toBeCloseTo(1, 10);
    expect(out[1].y).toBeCloseTo(1, 10);
  });

  it('is scale and translation invariant — the point of normalising', () => {
    // Same pose, different camera distance and framing.
    const near = [pt(0, 0), pt(2, 4), pt(1, 1)];
    const far = near.map(l => pt(l.x * 7 + 100, l.y * 7 - 50));
    const a = normalizeLandmarksBBox(near);
    const b = normalizeLandmarksBBox(far);
    a.forEach((l, i) => {
      expect(l.x).toBeCloseTo(b[i].x, 10);
      expect(l.y).toBeCloseTo(b[i].y, 10);
    });
  });

  it('preserves non-coordinate fields', () => {
    const out = normalizeLandmarksBBox([
      { x: 0, y: 0, visibility: 1, z: 9 },
      { x: 1, y: 1, visibility: 1, z: 3 },
    ]);
    expect(out[0].z).toBe(9);
    expect(out[0].visibility).toBe(1);
  });

  it('does not divide by zero when the pose has no extent on an axis', () => {
    // Every landmark on one horizontal line: height is 0, guarded by `|| 1`.
    const out = normalizeLandmarksBBox([pt(0, 5), pt(10, 5)]);
    expect(Number.isFinite(out[0].y)).toBe(true);
    expect(Number.isFinite(out[1].y)).toBe(true);
  });

  it('computes the box from visible landmarks only, but transforms all of them', () => {
    // A low-visibility landmark outside the visible box is still mapped, so it
    // can legitimately land outside [0,1]. Downstream code must not assume the
    // output is clamped.
    const out = normalizeLandmarksBBox([
      pt(0, 0, 1),
      pt(10, 10, 1),
      pt(20, 20, 0.1), // below the 0.3 visibility cut-off
    ]);
    expect(out[1].x).toBeCloseTo(1, 10);
    expect(out[2].x).toBeGreaterThan(1);
  });

  it('returns the input untouched when nothing is visible enough', () => {
    const input = [pt(1, 2, 0.1), pt(3, 4, 0.2)];
    expect(normalizeLandmarksBBox(input)).toBe(input);
  });

  it('handles empty and absent input', () => {
    expect(normalizeLandmarksBBox([])).toEqual([]);
    expect(normalizeLandmarksBBox(null)).toBeNull();
  });
});
