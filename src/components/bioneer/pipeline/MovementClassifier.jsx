/**
 * MovementClassifier — resolves the active MovementProfile from a user selection
 * or (future) auto-detection from pose kinematics.
 *
 * Usage:
 *   const classifier = new MovementClassifier();
 *   const profile = classifier.select('squat');
 */

import { MOVEMENT_LIBRARY, getMovement } from './MovementLibraryData.js';
import { MOVEMENT_PROFILES, getProfile } from './MovementProfiles.jsx';

export class MovementClassifier {
  constructor() {
    this._selected = null;
  }

  /**
   * Select a movement by id.
   * Prefers MovementLibraryData (extended schema), falls back to MovementProfiles.
   */
  select(id) {
    const fromLibrary = getMovement(id);
    const fromProfiles = getProfile(id);
    // Merge: library entry takes priority, profile fills missing keys
    this._selected = { ...fromProfiles, ...fromLibrary };
    return this._selected;
  }

  get current() {
    return this._selected;
  }

  /** List all available movement ids */
  static list() {
    const libIds  = MOVEMENT_LIBRARY.map(m => m.id);
    const profIds = Object.keys(MOVEMENT_PROFILES);
    return [...new Set([...libIds, ...profIds])];
  }
}