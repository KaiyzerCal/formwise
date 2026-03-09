/**
 * motion/pose/PoseEstimator.js
 *
 * Provider-agnostic pose estimator facade.
 * Accepts any adapter that implements { load(), processFrame(), dispose() }.
 * The rest of the engine only ever calls PoseEstimator — never a provider directly.
 */

import { PoseAdapterMediaPipe } from './PoseAdapter.MediaPipe.js';

export class PoseEstimator {
  /**
   * @param {Object} [adapter]  — optional custom adapter (defaults to MediaPipe)
   */
  constructor(adapter) {
    this._adapter = adapter ?? new PoseAdapterMediaPipe();
    this._loaded  = false;
  }

  async load() {
    await this._adapter.load();
    this._loaded = true;
  }

  /**
   * @param {HTMLVideoElement} videoEl
   * @param {number}           tMs
   * @returns {{ poseLandmarks, poseWorldLandmarks } | null}
   */
  processFrame(videoEl, tMs) {
    if (!this._loaded) return null;
    return this._adapter.processFrame(videoEl, tMs);
  }

  dispose() {
    this._adapter.dispose();
    this._loaded = false;
  }

  get isLoaded() { return this._loaded; }
}