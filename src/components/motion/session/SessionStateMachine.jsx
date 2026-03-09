/**
 * motion/session/SessionStateMachine.js
 *
 * Owns the session lifecycle state: IDLE → STARTING → ACTIVE → FINISHING → COMPLETE.
 * Consumed by LiveSessionOrchestrator to gate pipeline actions.
 *
 * Transitions:
 *   IDLE      → STARTING  (start())
 *   STARTING  → ACTIVE    (onReady())
 *   ACTIVE    → FINISHING (stop())
 *   FINISHING → COMPLETE  (finalize())
 *   any       → IDLE      (reset())
 *   any       → ERROR     (error())
 */

import { SESSION_STATES } from '../contracts/states.js';

export class SessionStateMachine {
  constructor() {
    this._state    = SESSION_STATES.IDLE;
    this._startedAt = null;
    this._endedAt   = null;
    this._onTransition = null;
  }

  /** Register a callback invoked on every transition: fn(newState, prevState) */
  onTransition(fn) { this._onTransition = fn; }

  get state()     { return this._state; }
  get startedAt() { return this._startedAt; }
  get endedAt()   { return this._endedAt; }
  get isActive()  { return this._state === SESSION_STATES.ACTIVE; }

  start() {
    if (this._state !== SESSION_STATES.IDLE) return false;
    this._startedAt = Date.now();
    return this._transition(SESSION_STATES.STARTING);
  }

  onReady() {
    if (this._state !== SESSION_STATES.STARTING) return false;
    return this._transition(SESSION_STATES.ACTIVE);
  }

  stop() {
    if (this._state !== SESSION_STATES.ACTIVE) return false;
    return this._transition(SESSION_STATES.FINISHING);
  }

  finalize() {
    if (this._state !== SESSION_STATES.FINISHING) return false;
    this._endedAt = Date.now();
    return this._transition(SESSION_STATES.COMPLETE);
  }

  error(reason) {
    return this._transition(SESSION_STATES.ERROR, reason);
  }

  reset() {
    this._startedAt = null;
    this._endedAt   = null;
    return this._transition(SESSION_STATES.IDLE);
  }

  _transition(next, meta) {
    const prev = this._state;
    this._state = next;
    this._onTransition?.(next, prev, meta);
    return true;
  }
}