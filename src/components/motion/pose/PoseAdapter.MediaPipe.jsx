/**
 * motion/pose/PoseAdapter.MediaPipe.js
 *
 * Thin adapter around MediaPipe Tasks Vision PoseLandmarker.
 * Normalizes the provider output into the canonical {poseLandmarks, poseWorldLandmarks} shape
 * consumed by PoseNormalizer and the rest of the pipeline.
 *
 * This adapter keeps the rest of the engine provider-agnostic.
 * Swapping to MoveNet, OpenPose, or a custom model only requires a new adapter.
 */

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task';
const WASM_PATH =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const CDN       =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';

export class PoseAdapterMediaPipe {
  constructor(options = {}) {
    this._landmarker = null;
    this._options    = {
      numPoses:                   1,
      minPoseDetectionConfidence: 0.65,
      minPosePresenceConfidence:  0.60,
      minTrackingConfidence:      0.60,
      outputSegmentationMasks:    false,
      ...options,
    };
  }

  /**
   * Load the model. Call once before processFrame.
   * @returns {Promise<void>}
   */
  async load() {
    const { PoseLandmarker, FilesetResolver } = await import(CDN);
    const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
    this._landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      ...this._options,
    });
  }

  /**
   * Process one video frame.
   * @param {HTMLVideoElement} videoEl
   * @param {number}           tMs     — performance.now() timestamp
   * @returns {{ poseLandmarks, poseWorldLandmarks } | null}
   */
  processFrame(videoEl, tMs) {
    if (!this._landmarker) return null;
    const result = this._landmarker.detectForVideo(videoEl, tMs);
    return {
      poseLandmarks:      result.landmarks?.[0]      ?? null,
      poseWorldLandmarks: result.worldLandmarks?.[0] ?? null,
    };
  }

  /** Release model resources. */
  dispose() {
    try { this._landmarker?.close(); } catch (_) {}
    this._landmarker = null;
  }

  get isLoaded() { return !!this._landmarker; }
}