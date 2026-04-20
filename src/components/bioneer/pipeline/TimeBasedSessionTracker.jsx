/**
 * TimeBasedSessionTracker — for sports movements with repAngle: null
 * Counts "session units" every 8 seconds of active tracked movement
 */

const UNIT_INTERVAL_MS = 8000;

export class TimeBasedSessionTracker {
  constructor() {
    this.sessionUnits = 0;
    this.activeMs = 0;
    this.lastTimestamp = null;
    this.isTracking = false;
  }

  /**
   * @param {number} tMs — current timestamp in ms
   * @param {boolean} isActive — whether pose tracking is active/visible
   * @returns {{ type: string, sessionUnits: number } | null}
   */
  update(tMs, isActive) {
    if (!isActive) {
      this.lastTimestamp = null;
      this.isTracking = false;
      return null;
    }

    if (!this.isTracking || this.lastTimestamp === null) {
      this.lastTimestamp = tMs;
      this.isTracking = true;
      return null;
    }

    const delta = tMs - this.lastTimestamp;
    this.lastTimestamp = tMs;

    // Skip large gaps (>2s)
    if (delta > 2000) return null;

    this.activeMs += delta;

    if (this.activeMs >= UNIT_INTERVAL_MS) {
      this.sessionUnits++;
      this.activeMs -= UNIT_INTERVAL_MS;
      return { type: 'SESSION_UNIT', sessionUnits: this.sessionUnits };
    }

    return null;
  }

  getSessionUnits() { return this.sessionUnits; }

  reset() {
    this.sessionUnits = 0;
    this.activeMs = 0;
    this.lastTimestamp = null;
    this.isTracking = false;
  }
}