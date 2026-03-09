/**
 * motion/camera/CameraManager.js
 *
 * Owns camera stream lifecycle — permissions, resolution policy,
 * front/back switching, and clean teardown.
 * Completely separate from UI rendering.
 */

const DEFAULT_CONSTRAINTS = {
  video: {
    facingMode: 'environment',
    width:  { ideal: 1280 },
    height: { ideal: 720  },
  },
};

export class CameraManager {
  constructor(constraints = DEFAULT_CONSTRAINTS) {
    this._constraints = constraints;
    this._stream      = null;
    this._videoEl     = null;
    this._facing      = 'environment';
  }

  /**
   * Attach to a <video> element and start streaming.
   * @param {HTMLVideoElement} videoEl
   * @returns {Promise<void>}
   */
  async start(videoEl) {
    this._videoEl = videoEl;
    this._stream  = await navigator.mediaDevices.getUserMedia(this._constraints);
    videoEl.srcObject = this._stream;
    await videoEl.play();
  }

  /**
   * Stop all tracks and release the stream.
   */
  stop() {
    if (this._stream) {
      this._stream.getTracks().forEach(t => t.stop());
      this._stream = null;
    }
    if (this._videoEl) {
      this._videoEl.srcObject = null;
      this._videoEl = null;
    }
  }

  /**
   * Switch between front and back camera.
   * @param {HTMLVideoElement} videoEl
   */
  async switchFacing(videoEl) {
    this.stop();
    this._facing      = this._facing === 'environment' ? 'user' : 'environment';
    this._constraints = {
      video: { ...this._constraints.video, facingMode: this._facing },
    };
    await this.start(videoEl);
  }

  get isActive() { return !!this._stream; }
  get facing()   { return this._facing;   }
}