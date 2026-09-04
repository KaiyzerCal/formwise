import { describe, it, expect } from 'vitest';
import { estimateOneRepMax, percentOf1RM } from './strengthMath.jsx';

describe('estimateOneRepMax', () => {
  it('returns null for invalid weight', () => {
    expect(estimateOneRepMax(0, 5)).toBeNull();
    expect(estimateOneRepMax(-10, 5)).toBeNull();
    expect(estimateOneRepMax(null, 5)).toBeNull();
  });

  it('returns null for invalid reps', () => {
    expect(estimateOneRepMax(100, 0)).toBeNull();
    expect(estimateOneRepMax(100, -1)).toBeNull();
    expect(estimateOneRepMax(100, null)).toBeNull();
  });

  it('a single with no RPE is its own max', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100);
  });

  it('a single at RPE 10 is its own max', () => {
    expect(estimateOneRepMax(100, 1, 10)).toBe(100);
  });

  it('a single below RPE 10 still had reps in reserve, so e1RM exceeds the weight', () => {
    // RIR = 10 - 8 = 2 -> effective reps = 3 -> 100 * (1 + 3/30) = 110
    expect(estimateOneRepMax(100, 1, 8)).toBe(110);
  });

  it('falls back to plain Epley (RIR=0) when no RPE is given', () => {
    // 100 * (1 + 5/30) = 116.666... -> 116.7
    expect(estimateOneRepMax(100, 5)).toBe(116.7);
  });

  it('adds RPE-implied reps-in-reserve on top of reps performed', () => {
    // RIR = 10 - 8 = 2 -> effective reps = 7 -> 100 * (1 + 7/30) = 123.333... -> 123.3
    expect(estimateOneRepMax(100, 5, 8)).toBe(123.3);
  });

  it('never lets RPE above 10 produce negative reps-in-reserve', () => {
    // RPE 10.5 shouldn't be possible in the UI, but the math must not invert.
    expect(estimateOneRepMax(100, 5, 10.5)).toBe(estimateOneRepMax(100, 5, 10));
  });
});

describe('percentOf1RM', () => {
  it('computes a basic percentage', () => {
    expect(percentOf1RM(225, 300)).toBe(75);
  });

  it('a weight equal to the max is 100%', () => {
    expect(percentOf1RM(300, 300)).toBe(100);
  });

  it('returns null for a non-positive e1RM', () => {
    expect(percentOf1RM(100, 0)).toBeNull();
    expect(percentOf1RM(100, null)).toBeNull();
  });

  it('returns null for a non-positive weight', () => {
    expect(percentOf1RM(0, 300)).toBeNull();
    expect(percentOf1RM(null, 300)).toBeNull();
  });
});
