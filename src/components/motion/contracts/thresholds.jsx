/**
 * motion/contracts/thresholds.js
 * Global confidence thresholds and pipeline constants.
 */

export const CONFIDENCE = Object.freeze({
  POSE_MIN:            0.60,
  JOINT_VIS_MIN:       0.55,
  TRACKING_MIN:        0.70,
  GATE_THRESHOLD:      0.72,
  LOCK_STABLE_FRAMES:  5,
  DEGRADE_THRESHOLD:   0.40,
  RECOVER_THRESHOLD:   0.60,
  DEGRADED_TO_LOST_MS: 1000,
  REACQUIRE_MS:        2000,
});

export const REP_DETECTION = Object.freeze({
  CONFIRM_FRAMES:   3,
  JOINT_VIS:        0.70,
  MIN_ROM:          40,
  STATE_TIMEOUT_MS: 8000,
  ANGLE_VEL_EMA:    0.30,
  VEL_DESCEND:     -2,
  VEL_ASCEND:       2,
  VEL_PAUSE:        0.5,
});

export const STABILIZATION = Object.freeze({
  CONFIDENCE_MIN:   0.60,
  OUTLIER_NORMAL:   0.08,
  OUTLIER_FAST:     0.14,
  BONE_TOLERANCE:   0.20,
  EMA_MIN:          0.08,
  EMA_MAX:          0.42,
  VEL_ALPHA:        0.40,
  FAST_VEL_THRESH:  0.012,
});

export const FEEDBACK = Object.freeze({
  LOCK_MS:         8000,
  COOLDOWN_MS:     20000,
  REP_SUPPRESS_MS: 200,
});

export const FAULT_PERSISTENCE = Object.freeze({
  MIN_PERSIST_MS:  400,
  PERSIST_FULL_MS: 800,
});

export const READINESS = Object.freeze({
  READY_FRAMES:    3,
  REQUIRED_JOINTS: ['l_hip', 'r_hip', 'l_knee', 'r_knee', 'l_shoulder', 'r_shoulder'],
});

export const KINEMATICS = Object.freeze({
  Z_EMA_ALPHA: 0.35,
});

export const SCORING = Object.freeze({
  DEFAULT_WEIGHTS:   { rom: 0.4, stability: 0.2, symmetry: 0.2, tempo: 0.1 },
  PENALTY_HIGH:      10,
  PENALTY_MODERATE:  5,
  PENALTY_LOW:       2,
  MAX_PENALTY:       45,
});