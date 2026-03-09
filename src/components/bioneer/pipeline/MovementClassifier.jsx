/**
 * MovementClassifier — resolves the active MovementProfile from a user selection
 * or (future) auto-detection from pose kinematics.
 *
 * Usage:
 *   const classifier = new MovementClassifier();
 *   const profile = classifier.select('squat');
 */

import { MovementResolver } from './MovementResolver.js';

export class MovementClassifier {
  constructor() {
    this._selected = null;
  }

  /** Select a movement by id — delegates to MovementResolver */
  select(id) {
    this._selected = MovementResolver.resolve(id);
    return this._selected;
  }

  get current() {
    return this._selected;
  }

  static list()                  { return MovementResolver.list(); }
  static byCategory(cat)         { return MovementResolver.byCategory(cat); }
  static categories()            { return MovementResolver.categories(); }
  static validate(profile)       { return MovementResolver.validate(profile); }
}