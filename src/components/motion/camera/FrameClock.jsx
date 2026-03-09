/**
 * motion/camera/FrameClock.js
 *
 * Drives the rAF frame loop and deduplicates video frames
 * (only processes frames where video.currentTime changed).
 * Decoupled from pose detection — calls an onFrame(video, tMs) callback.
 */

export class FrameClock {
  constructor() {
    this._rafId       = null;
    this._lastTime    = -1;
    this._running     = false;
    this._onFrame     = null;
    this._targetFPS   = 30;
    this._lastFPSTime = 0;
    this._framesSec   = 0;
    this.fps          = 0;
  }

  /**
   * @param {HTMLVideoElement} videoEl
   * @param {Function} onFrame — (videoEl, tMs) => void
   */
  start(videoEl, onFrame) {
    if (this._running) return;
    this._running  = true;
    this._onFrame  = onFrame;

    const tick = () => {
      if (!this._running) return;
      const now = performance.now();

      if (videoEl.readyState >= 2 && videoEl.currentTime !== this._lastTime) {
        this._lastTime = videoEl.currentTime;
        this._onFrame(videoEl, now);

        // FPS counter
        this._framesSec++;
        if (now - this._lastFPSTime >= 1000) {
          this.fps = this._framesSec;
          this._framesSec  = 0;
          this._lastFPSTime = now;
        }
      }

      this._rafId = requestAnimationFrame(tick);
    };

    this._rafId = requestAnimationFrame(tick);
  }

  stop() {
    this._running = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }
}