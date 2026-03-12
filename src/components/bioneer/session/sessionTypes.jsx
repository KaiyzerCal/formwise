/**
 * Session type definitions for Freestyle and other modes
 */

export const SESSION_MODES = {
  FREESTYLE: 'freestyle',
  EXERCISE: 'exercise',
};

export const SESSION_CATEGORIES = {
  STRENGTH: 'strength',
  SPORTS: 'sports',
};

/**
 * Freestyle session structure
 */
export function createFreestyleSession({
  sessionId,
  category = SESSION_CATEGORIES.STRENGTH,
  videoBlob,
  poseFrames = [],
  angleFrames = [],
  duration = 0,
}) {
  return {
    sessionId,
    mode: SESSION_MODES.FREESTYLE,
    category,
    createdAt: new Date().toISOString(),
    duration,
    videoBlob,
    poseFrames,
    angleFrames,
  };
}

/**
 * Pose frame structure
 */
export function createPoseFrame({
  timestamp,
  landmarks = [],
  angles = {},
  visibility = 0,
}) {
  return {
    timestamp,
    landmarks,
    angles,
    visibility,
  };
}

/**
 * Angle frame structure (aggregated angles for display)
 */
export function createAngleFrame({
  timestamp,
  kneeLeft,
  kneeRight,
  hipLeft,
  hipRight,
  elbowLeft,
  elbowRight,
  shoulderLeft,
  shoulderRight,
  spineAngle,
}) {
  return {
    timestamp,
    kneeLeft,
    kneeRight,
    hipLeft,
    hipRight,
    elbowLeft,
    elbowRight,
    shoulderLeft,
    shoulderRight,
    spineAngle,
  };
}