/**
 * TemporalFilterEngine
 * ─────────────────────────────────────────────────────────────────────────────
 * Sits between computeJointAngles() → canvas/beep.
 * Prevents single-frame pose glitches from causing false RED states or beep spam.
 *
 * Stages applied per frame:
 *   1. EMA angle smoothing     — removes per-frame noise from the numeric angle
 *   2. Zone window tracking    — rolls a short history of zone states per joint
 *   3. Persistence evaluation  — escalates zone only when it persists long enough
 *   4. Confidence weighting    — low pose confidence raises escalation threshold
 *   5. Beep hysteresis         — beep only on confirmed danger entry + cooldown
 *
 * State levels:
 *   OPTIMAL    — clean form
 *   ACCEPTABLE — minor deviation (green→yellow transition)
 *   WARNING    — persistent caution OR provisional danger early-warning
 *   DANGER     — confirmed danger (enough frames + sufficient pose confidence)
 */

// ── Tuning constants ──────────────────────────────────────────────────────────

/** Categories requiring faster EMA response (higher alpha) */
const FAST_CATEGORIES = new Set(['athletic', 'sports']);

/**
 * EMA alpha for angle smoothing.
 * - SLOW (strength: squat, deadlift, press): 0.30 → ~3-frame lag @30fps, very stable
 * - FAST (athletic: sprint, jump, cut):      0.50 → ~1-frame lag @30fps, still responsive
 * Increase alpha if movements feel sluggish; decrease if skeleton still flickers.
 */
const ALPHA_SLOW = 0.30;
const ALPHA_FAST = 0.50;

/**
 * Zone persistence window (frames).
 * At 30fps: 6 frames ≈ 200ms — enough to skip single-frame pose glitches
 * without introducing visible latency.
 */
const ZONE_WINDOW = 6;

/**
 * Frames within ZONE_WINDOW required to confirm each zone.
 * At full pose confidence these values apply directly.
 * Low confidence raises thresholds proportionally (harder to confirm RED).
 */
const DANGER_CONFIRM_FRAMES  = 4;  // 4/6 frames in DANGER → confirmed RED
const WARNING_CONFIRM_FRAMES = 3;  // 3/6 frames in WARNING → confirmed YELLOW
const DANGER_PROVISIONAL     = 2;  // 2/6 danger frames → provisional WARNING (early warning)

/**
 * Beep hysteresis.
 * - BEEP_COOLDOWN_MS: minimum time between any two beeps for the same session
 * - REQUIRE_EXIT: user must leave danger before another beep on re-entry
 *   Combined: beep fires on first confirmed danger entry,
 *   then only again after exiting danger AND cooldown elapsed.
 */
const BEEP_COOLDOWN_MS  = 2500;
const REQUIRE_EXIT      = true;

// ── TemporalFilterEngine ──────────────────────────────────────────────────────

export class TemporalFilterEngine {
  /**
   * @param {string} category — exercise category: 'strength' | 'athletic' | 'sports'
   */
  constructor(category = 'strength') {
    this._alpha    = FAST_CATEGORIES.has(category) ? ALPHA_FAST : ALPHA_SLOW;
    this._angles   = {};   // jointKey → EMA-smoothed angle value
    this._windows  = {};   // jointKey → rolling array of recent zone strings

    // Beep hysteresis state
    this._lastBeepMs  = 0;
    this._inDanger    = false;  // true from first confirmed danger until user exits
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Filter raw joint results from computeJointAngles().
   * Returns new array with stabilized angles and zone states.
   *
   * @param {Array}  rawResults     — output of computeJointAngles()
   * @param {number} tMs            — current timestamp in ms (use performance.now())
   * @param {number} poseConfidence — overall pose confidence 0–1 (avgVisibility)
   * @returns {Array} stabilized results — same shape + rawState field for debugging
   */
  filter(rawResults, tMs, poseConfidence = 1.0) {
    // Clamp confidence: very low conf (0.2) means thresholds nearly impossible to reach
    const conf = Math.min(1.0, Math.max(0.2, poseConfidence));
    const out  = [];

    for (const jr of rawResults) {
      const key = jr.name ?? jr.label;

      // ── Pass-through: invisible/untracked joints ───────────────────────
      if (jr.angle == null || jr.state == null) {
        out.push({ ...jr });
        continue;
      }

      // ── Stage 1: EMA angle smoothing ──────────────────────────────────
      const prev = this._angles[key];
      const smoothedAngle = prev != null
        ? Math.round(this._alpha * jr.angle + (1 - this._alpha) * prev)
        : jr.angle;
      this._angles[key] = smoothedAngle;

      // ── Stage 2: Rolling zone window ──────────────────────────────────
      if (!this._windows[key]) this._windows[key] = [];
      const win = this._windows[key];
      win.push(jr.state);
      if (win.length > ZONE_WINDOW) win.shift();

      // ── Stage 3 + 4: Persistence evaluation + confidence weighting ────
      const nDanger  = win.filter(z => z === 'DANGER').length;
      const nWarning = win.filter(z => z === 'WARNING').length;
      const nAccept  = win.filter(z => z === 'ACCEPTABLE').length;

      // Scale thresholds inversely with confidence:
      //   conf=1.0 → thresholds are as defined above (most lenient)
      //   conf=0.5 → dangerThresh = ceil(4/0.5) = 8 → never reaches 6-frame window → RED suppressed
      //   conf=0.7 → dangerThresh = ceil(4/0.7) = 6 → must hold DANGER for full window
      const dangerThresh = Math.min(ZONE_WINDOW, Math.ceil(DANGER_CONFIRM_FRAMES  / conf));
      const warnThresh   = Math.min(ZONE_WINDOW, Math.ceil(WARNING_CONFIRM_FRAMES / conf));

      let stable;

      if (nDanger >= dangerThresh) {
        // ── Confirmed RED: danger persists AND confidence supports it ────
        stable = 'DANGER';
      } else if (nDanger >= DANGER_PROVISIONAL || nWarning >= warnThresh) {
        // ── Early-warning YELLOW:
        //    • 2+ danger frames (provisional — warn before confirming red)
        //    • OR confirmed warning threshold met
        stable = 'WARNING';
      } else if (nAccept >= 2) {
        // ── Acceptable: 2+ frames in acceptable range ────────────────────
        stable = 'ACCEPTABLE';
      } else {
        // ── Default: majority vote on the window ─────────────────────────
        const counts = {};
        for (const z of win) counts[z] = (counts[z] || 0) + 1;
        stable = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'OPTIMAL';
      }

      out.push({
        ...jr,
        angle:    smoothedAngle,  // smoothed angle displayed in badge
        rawState: jr.state,       // raw per-frame state (kept for logging/debug)
        state:    stable,         // stabilized state drives color + beep
        // Debug metadata (stripped in prod builds by tree-shaking)
        _nDanger: nDanger,
        _winLen:  win.length,
      });
    }

    return out;
  }

  /**
   * Determine whether the correction beep should fire this frame.
   * Must be called AFTER filter() with the filtered results.
   *
   * Logic:
   *   - Fires once on the first frame where ANY joint reaches confirmed DANGER
   *   - Will NOT fire again until:
   *       a) User exits danger (all joints leave DANGER state)   — resets _inDanger
   *       b) AND cooldown period has elapsed since last beep
   *   - Result: beep feels intentional, never spammy
   *
   * @param {Array}  filteredResults — output of filter()
   * @param {number} tMs
   * @returns {boolean}
   */
  shouldBeep(filteredResults, tMs) {
    const anyDanger = filteredResults.some(jr => jr.state === 'DANGER');

    if (!anyDanger) {
      // User exited danger — allow re-trigger after cooldown next time
      this._inDanger = false;
      return false;
    }

    // Still in (or entering) danger
    const elapsed = tMs - this._lastBeepMs;

    // Cooldown not elapsed yet
    if (elapsed < BEEP_COOLDOWN_MS) return false;

    // Require exit-then-reentry before beeping again (if configured)
    if (REQUIRE_EXIT && this._inDanger) return false;

    // Fire!
    this._lastBeepMs = tMs;
    this._inDanger   = true;
    return true;
  }

  /**
   * Hard reset — call when exercise changes or session resets.
   */
  reset() {
    this._angles   = {};
    this._windows  = {};
    this._lastBeepMs = 0;
    this._inDanger   = false;
  }
}

// ── Exported tuning summary (for dev reference) ───────────────────────────────
export const TEMPORAL_FILTER_CONFIG = {
  alphaStrength:        ALPHA_SLOW,
  alphaAthletic:        ALPHA_FAST,
  zoneWindow:           ZONE_WINDOW,
  dangerConfirmFrames:  DANGER_CONFIRM_FRAMES,
  warningConfirmFrames: WARNING_CONFIRM_FRAMES,
  dangerProvisional:    DANGER_PROVISIONAL,
  beepCooldownMs:       BEEP_COOLDOWN_MS,
  requireExit:          REQUIRE_EXIT,
};