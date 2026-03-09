/**
 * validateMovementProfile — universal contract validator.
 *
 * Every profile that enters the resolver must pass this check.
 * Failed profiles are logged and excluded from runtime resolution.
 *
 * Universal profile contract fields:
 *   Required:   id, category, displayName, trackingMode, phaseMap,
 *               primaryAngleKey, visibilityJoints, faultRules, cueMap
 *   Conditional: repModel OR eventModel (at least one must exist for non-hold movements)
 *   Optional:   readinessRules, scoringModel, keyAngles, keyVelocities, comRules
 */

const VALID_CATEGORIES   = ['strength','calisthenics','athletic','rotational','locomotion','rehab'];
const VALID_TRACKING     = ['stationary','dynamic_linear','dynamic_rotational'];
const VALID_REP_MODES    = ['rom_return','peak_detect','stride_cycle','hold_duration','event_cycle'];

/**
 * @param {object} profile
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMovementProfile(profile) {
  const errors = [];

  if (!profile || typeof profile !== 'object') {
    return { valid: false, errors: ['Profile is not an object'] };
  }

  // ── Required identity fields ───────────────────────────────────────────────
  if (!profile.id || typeof profile.id !== 'string') {
    errors.push('Missing or invalid "id"');
  }
  if (!profile.displayName || typeof profile.displayName !== 'string') {
    errors.push('Missing or invalid "displayName"');
  }
  if (!VALID_CATEGORIES.includes(profile.category)) {
    errors.push(`Invalid category "${profile.category}" — must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }
  if (!VALID_TRACKING.includes(profile.trackingMode)) {
    errors.push(`Invalid trackingMode "${profile.trackingMode}" — must be one of: ${VALID_TRACKING.join(', ')}`);
  }

  // ── Phase model ────────────────────────────────────────────────────────────
  if (!profile.phaseMap || typeof profile.phaseMap !== 'object') {
    errors.push('Missing or invalid "phaseMap" — must be an object mapping state→phaseId');
  } else {
    const requiredStates = ['START', 'ECCENTRIC', 'BOTTOM', 'CONCENTRIC', 'LOCKOUT'];
    const missingStates  = requiredStates.filter(s => !(s in profile.phaseMap));
    if (missingStates.length > 0) {
      errors.push(`phaseMap missing states: ${missingStates.join(', ')}`);
    }
  }

  // ── Kinematics contract ───────────────────────────────────────────────────
  if (!profile.primaryAngleKey || typeof profile.primaryAngleKey !== 'string') {
    errors.push('Missing or invalid "primaryAngleKey"');
  }
  if (!Array.isArray(profile.visibilityJoints) || profile.visibilityJoints.length === 0) {
    errors.push('"visibilityJoints" must be a non-empty array');
  }

  // ── Fault rules ────────────────────────────────────────────────────────────
  if (!Array.isArray(profile.faultRules)) {
    errors.push('"faultRules" must be an array (may be empty)');
  }

  // ── Cue map ────────────────────────────────────────────────────────────────
  if (!profile.cueMap || typeof profile.cueMap !== 'object') {
    errors.push('"cueMap" must be an object');
  }

  // ── Rep/Event model ────────────────────────────────────────────────────────
  if (profile.repValidationMode && !VALID_REP_MODES.includes(profile.repValidationMode)) {
    errors.push(`Invalid repValidationMode "${profile.repValidationMode}"`);
  }

  // ── Thresholds (soft check) ────────────────────────────────────────────────
  if (profile.thresholds) {
    if (typeof profile.thresholds.lockoutAngle !== 'number') {
      errors.push('"thresholds.lockoutAngle" must be a number');
    }
  }

  const valid = errors.length === 0;

  if (!valid) {
    console.warn(
      `[ProfileValidator] Profile "${profile.id ?? 'unknown'}" failed validation:\n` +
      errors.map(e => `  • ${e}`).join('\n')
    );
  }

  return { valid, errors };
}

/**
 * Filter a profile array to only valid profiles.
 * Logs a summary of any exclusions.
 */
export function filterValidProfiles(profiles) {
  const valid   = [];
  const invalid = [];

  for (const p of profiles) {
    const result = validateMovementProfile(p);
    if (result.valid) {
      valid.push(p);
    } else {
      invalid.push({ id: p?.id, errors: result.errors });
    }
  }

  if (invalid.length > 0) {
    console.warn(
      `[ProfileValidator] ${invalid.length} profile(s) excluded:\n` +
      invalid.map(p => `  • ${p.id}: ${p.errors[0]}`).join('\n')
    );
  }

  return valid;
}