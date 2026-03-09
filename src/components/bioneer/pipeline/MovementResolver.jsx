/**
 * MovementResolver — canonical entry point for profile resolution.
 *
 * Replaces MovementClassifier's ad-hoc merge logic with a clean two-source
 * merge: extended library schema first, legacy MovementProfiles fill gaps.
 *
 * Usage:
 *   const profile = MovementResolver.resolve('back_squat');
 *   const ids     = MovementResolver.list();
 *   const cats    = MovementResolver.categories();
 */

import { getMovement, listMovementIds, getMovementsByCategory, MOVEMENT_LIBRARY } from './MovementLibraryData.js';
import { MOVEMENT_PROFILES } from './MovementProfiles.jsx';

export class MovementResolver {

  /**
   * Resolve a full profile by movement id.
   * Library schema takes priority; legacy profile fills any missing keys.
   */
  static resolve(id) {
    const lib     = getMovement(id);                          // extended schema
    const legacy  = MOVEMENT_PROFILES[id] ?? MOVEMENT_PROFILES['back_squat']; // fallback
    return { ...legacy, ...lib };
  }

  /** All known movement ids (library + legacy profiles combined, deduped) */
  static list() {
    const libIds  = listMovementIds();
    const profIds = Object.keys(MOVEMENT_PROFILES);
    return [...new Set([...libIds, ...profIds])];
  }

  /** All movement ids for a given category string */
  static byCategory(category) {
    return getMovementsByCategory(category).map(m => m.id);
  }

  /** Full movement objects for a given category */
  static movementsForCategory(category) {
    return getMovementsByCategory(category);
  }

  /** All unique categories present in the library */
  static categories() {
    return [...new Set(MOVEMENT_LIBRARY.map(m => m.category))];
  }

  /** All movement families present in the library */
  static families() {
    return [...new Set(MOVEMENT_LIBRARY.map(m => m.movementFamily))];
  }

  /** Validate a profile has the minimum required fields to run the pipeline */
  static validate(profile) {
    const required = [
      'id', 'primaryAngleKey', 'phaseMap',
      'visibilityJoints', 'thresholds', 'faultRules',
    ];
    const missing = required.filter(k => !(k in profile));
    if (missing.length) {
      console.warn(`[MovementResolver] Profile "${profile.id ?? 'unknown'}" missing: ${missing.join(', ')}`);
      return false;
    }
    return true;
  }
}