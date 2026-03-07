/**
 * SubjectLockEngine
 * 4-state machine: SEARCHING → LOCKED ⇄ DEGRADED → LOST
 * Handles persistent tracking, re-acquisition, multi-person selection.
 */

export class SubjectLockEngine {
  constructor() {
    this.state        = 'SEARCHING';
    this.trackId      = null;
    this.boundingBox  = null;
    this.lastGoodBox  = null;
    this.stableFrames = 0;
    this.lostMs       = null;
    this.STABLE_REQ   = 5;
    this.DEGRADE_CONF = 0.40;
    this.LOST_MS      = 1000;
    this.REACQUIRE_MS = 2000;
    this._idCounter   = 0;
  }

  process(rawLandmarks, frameConfidence, tMs) {
    if (!rawLandmarks || rawLandmarks.length === 0) {
      return this._handleEmpty(tMs);
    }

    const box = this._computeBoundingBox(rawLandmarks);

    switch (this.state) {
      case 'SEARCHING':
        if (frameConfidence >= 0.70) {
          this.stableFrames++;
          if (this.stableFrames >= this.STABLE_REQ) {
            this.trackId      = ++this._idCounter;
            this.boundingBox  = box;
            this.lastGoodBox  = box;
            this.stableFrames = 0;
            this.state        = 'LOCKED';
          }
        } else {
          this.stableFrames = 0;
        }
        return { locked: false, landmarks: null, frozen: false };

      case 'LOCKED':
        if (frameConfidence < this.DEGRADE_CONF) {
          this.state  = 'DEGRADED';
          this.lostMs = tMs;
        } else {
          this.lastGoodBox = box;
          this.boundingBox = this._smoothBox(this.boundingBox, box, 0.3);
        }
        return {
          locked:    this.state === 'LOCKED',
          landmarks: rawLandmarks,
          frozen:    false,
        };

      case 'DEGRADED':
        if (frameConfidence >= 0.60) {
          this.state = 'LOCKED';
          this.lastGoodBox = box;
          return { locked: true, landmarks: rawLandmarks, frozen: false };
        }
        if (tMs - this.lostMs > this.REACQUIRE_MS) {
          this.state = 'LOST';
        }
        return { locked: false, landmarks: null, frozen: true };

      case 'LOST':
        if (frameConfidence >= 0.70) {
          this.stableFrames++;
          if (this.stableFrames >= this.STABLE_REQ) {
            this.trackId      = ++this._idCounter;
            this.boundingBox  = box;
            this.lastGoodBox  = box;
            this.stableFrames = 0;
            this.state        = 'LOCKED';
          }
        } else {
          this.stableFrames = 0;
        }
        return { locked: false, landmarks: null, frozen: false };

      default:
        return { locked: false, landmarks: null, frozen: false };
    }
  }

  _handleEmpty(tMs) {
    if (this.state === 'LOCKED') {
      this.state  = 'DEGRADED';
      this.lostMs = tMs;
    } else if (this.state === 'DEGRADED' && tMs - this.lostMs > this.REACQUIRE_MS) {
      this.state        = 'LOST';
      this.stableFrames = 0;
    }
    return { locked: false, landmarks: null, frozen: this.state === 'DEGRADED' };
  }

  /** When multiple pose sets are available, pick the one closest to last known box */
  selectPrimarySubject(poseResults) {
    if (!poseResults || poseResults.length === 0) return null;
    if (poseResults.length === 1) return poseResults[0];
    if (!this.lastGoodBox) return poseResults[0];

    const lastCX = this.lastGoodBox.x + this.lastGoodBox.w / 2;
    const lastCY = this.lastGoodBox.y + this.lastGoodBox.h / 2;

    return poseResults.reduce((best, pose) => {
      const box    = this._computeBoundingBox(pose.landmarks ?? []);
      const cx     = box.x + box.w / 2;
      const cy     = box.y + box.h / 2;
      const dist   = Math.hypot(cx - lastCX, cy - lastCY);
      const bBox   = this._computeBoundingBox(best.landmarks ?? []);
      const bDist  = Math.hypot(
        bBox.x + bBox.w / 2 - lastCX,
        bBox.y + bBox.h / 2 - lastCY
      );
      return dist < bDist ? pose : best;
    });
  }

  getState()   { return this.state; }
  getTrackId() { return this.trackId; }

  _computeBoundingBox(landmarks) {
    if (!landmarks.length) return { x: 0, y: 0, w: 0, h: 0 };
    const xs = landmarks.map(l => l.x);
    const ys = landmarks.map(l => l.y);
    const x  = Math.min(...xs);
    const y  = Math.min(...ys);
    return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
  }

  _smoothBox(prev, next, α) {
    return {
      x: α * next.x + (1 - α) * prev.x,
      y: α * next.y + (1 - α) * prev.y,
      w: α * next.w + (1 - α) * prev.w,
      h: α * next.h + (1 - α) * prev.h,
    };
  }

  reset() {
    this.state        = 'SEARCHING';
    this.trackId      = null;
    this.boundingBox  = null;
    this.lastGoodBox  = null;
    this.stableFrames = 0;
    this.lostMs       = null;
  }
}