/**
 * Pure strength-programming math: estimated 1-rep-max and %1RM.
 * No React, no I/O — same convention as poseUtils.jsx/repCounter.jsx.
 */

/**
 * Estimate a 1-rep-max from a logged set.
 *
 * Uses the Epley formula (weight * (1 + reps/30)) applied to the *effective*
 * rep count — reps actually performed plus reps-in-reserve implied by RPE
 * (RIR = 10 - RPE). This is the standard way RPE-based programs translate an
 * RPE-rated set into an e1RM, and it degrades gracefully to plain Epley
 * (RIR = 0, i.e. the set was taken close to failure) when no RPE is given.
 *
 * @param {number} weight - load lifted, any unit (result is in the same unit)
 * @param {number} reps   - reps completed
 * @param {number|null} [rpe] - rate of perceived exertion, 1-10 scale
 * @returns {number|null} estimated 1RM, or null if inputs are invalid
 */
export function estimateOneRepMax(weight, reps, rpe = null) {
  if (weight == null || weight <= 0) return null;
  if (reps == null || reps <= 0) return null;

  // A single already at or above RPE 10 (or with no RPE given) is itself the max.
  if (reps === 1 && (rpe == null || rpe >= 10)) return round1(weight);

  const rir = rpe != null ? Math.max(0, 10 - rpe) : 0;
  const effectiveReps = reps + rir;
  return round1(weight * (1 + effectiveReps / 30));
}

/**
 * Express a weight as a percentage of a known (or estimated) 1RM.
 *
 * @param {number} weight - load lifted
 * @param {number} e1rm   - the 1RM (or e1RM) to compare against
 * @returns {number|null} percentage (e.g. 82.5), or null if inputs are invalid
 */
export function percentOf1RM(weight, e1rm) {
  if (weight == null || weight <= 0) return null;
  if (e1rm == null || e1rm <= 0) return null;
  return Math.round((weight / e1rm) * 1000) / 10;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
