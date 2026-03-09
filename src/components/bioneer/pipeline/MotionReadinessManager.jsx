/**
 * MotionReadinessManager
 *
 * Gate between SubjectLockEngine and KinematicsEngine.
 * Ensures pose confidence and joint visibility are sufficient
 * before allowing the kinematic pipeline to run.
 *
 * Usage:
 *   const mgr = new MotionReadinessManager();
 *   const ready = mgr.check(poseConf, visibility, lockState);
 *   if (ready) { ... run kinematics ... }
 */

import { CONFIDENCE, LOCK_STATES } from './contracts.js';

const REQUIRED_JOINTS = [
  'l_hip', 'r_hip', 'l_knee', 'r_knee',
  'l_shoulder', 'r_shoulder',
];

const JOINT_VIS_MIN = 0.55;
const READY_FRAMES  = 3;  // must pass N consecutive frames before "ready"

export class MotionReadinessManager {
  constructor(requiredJoints = REQUIRED_JOINTS) {
    this._required     = requiredJoints;
    this._passStreak   = 0;
    this.isReady       = false;
    this.readinessScore = 0; // 0–1
  }

  /**
   * @param {number} poseConf   — avg landmark visibility [0,1]
   * @param {object} visibility — { jointName: visScore }
   * @param {string} lockState  — LOCK_STATES value
   * @returns {boolean}
   */
  check(poseConf, visibility = {}, lockState = LOCK_STATES.SEARCHING) {
    // Hard gate: lost tracking
    if (lockState === LOCK_STATES.LOST) {
      this._fail();
      return false;
    }

    // Pose confidence gate
    if (poseConf < CONFIDENCE.POSE_MIN) {
      this._fail();
      return false;
    }

    // Required joint visibility gate
    const missingJoints = this._required.filter(j => {
      const v = visibility[j];
      return v == null || v < JOINT_VIS_MIN;
    });

    if (missingJoints.length > 0) {
      this._fail();
      return false;
    }

    // Accumulate streak
    this._passStreak++;
    this.readinessScore = Math.min(1, this._passStreak / READY_FRAMES);
    this.isReady = this._passStreak >= READY_FRAMES;
    return this.isReady;
  }

  _fail() {
    this._passStreak    = Math.max(0, this._passStreak - 1);
    this.readinessScore = this._passStreak / READY_FRAMES;
    this.isReady        = false;
  }

  reset() {
    this._passStreak    = 0;
    this.readinessScore = 0;
    this.isReady        = false;
  }
}