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

import { getMovement, listMovementIds, getMovementsByCategory, MOVEMENT_LIBRARY } from './MovementLibraryData';
import { MOVEMENT_PROFILES } from './MovementProfiles';
import { validateMovementProfile } from './validateMovementProfile';

/**
 * Alias map — old IDs / short names → canonical library IDs.
 * Preserves backward compatibility when exercise selections used legacy names.
 */
const ALIASES = {
  // Legacy short names
  squat:               'back_squat',
  lunge:               'reverse_lunge',
  sprint:              'sprint_acceleration',
  jump_landing:        'vertical_jump',
  basketball_shot:     'overhead_med_ball_throw',
  // Spec names → library IDs
  shot_put:            'rotational_med_ball_throw',
  discus:              'rotational_med_ball_throw',
  repeated_pogo_jump:  'pogo_jump',
  soccer_instep_kick:  'soccer_kick',
  volleyball_spike_approach: 'volleyball_spike',
  strict_overhead_press:     'overhead_press',
  lat_pulldown_pattern:      'lat_pulldown',
};

export class MovementResolver {

  /**
   * Resolve a full profile by movement id (or alias).
   * Library schema takes priority; legacy profile fills any missing keys.
   */
  static resolve(id) {
    const canonical = ALIASES[id] ?? id;
    const lib    = getMovement(canonical);
    const legacy = MOVEMENT_PROFILES[canonical] ?? MOVEMENT_PROFILES[id] ?? MOVEMENT_PROFILES['back_squat'];
    const merged = { ...legacy, ...lib };

    // Derive movementType if not already set
    if (!merged.movementType) {
      const repModes   = ['rom_return','stride_cycle','hold_duration'];
      const eventModes = ['event_cycle','peak_detect'];
      if (repModes.includes(merged.repValidationMode))   merged.movementType = 'rep';
      else if (eventModes.includes(merged.repValidationMode)) merged.movementType = 'event';
      else merged.movementType = 'rep';
    }

    return merged;
  }

  /** All known movement ids */
  static list() {
    const libIds  = listMovementIds();
    const profIds = Object.keys(MOVEMENT_PROFILES);
    return [...new Set([...libIds, ...profIds])];
  }

  /** All movement ids for a given category */
  static byCategory(category) {
    return getMovementsByCategory(category).map(m => m.id);
  }

  /** Full movement objects for a given category */
  static movementsForCategory(category) {
    return getMovementsByCategory(category);
  }

  /** All unique categories */
  static categories() {
    return [...new Set(MOVEMENT_LIBRARY.map(m => m.category))];
  }

  /** All movement families */
  static families() {
    return [...new Set(MOVEMENT_LIBRARY.map(m => m.movementFamily))];
  }

  /** Resolve alias → canonical id */
  static canonicalId(id) {
    return ALIASES[id] ?? id;
  }

  /** Returns true if id (or alias) is a rep-type movement */
  static isRepMovement(id) {
    const profile = MovementResolver.resolve(id);
    return profile.movementType === 'rep';
  }

  /** Returns true if id (or alias) is an event-type movement */
  static isEventMovement(id) {
    const profile = MovementResolver.resolve(id);
    return profile.movementType === 'event';
  }

  /** Validate a profile against the universal contract */
  static validate(profile) {
    const { valid } = validateMovementProfile(profile);
    return valid;
  }
}