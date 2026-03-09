/**
 * motion/contracts/frame.types.js
 * Canonical data shapes for the motion pipeline.
 */

/**
 * Factory: MotionFrame — the standard payload emitted each frame.
 * @param {Object} overrides
 */
export function makeMotionFrame(overrides = {}) {
  return {
    tMs:           Date.now(),
    joints:        {},
    worldJoints:   {},
    visibility:    {},
    angles:        {},
    velocities:    {},
    asymmetry:     {},
    lockState:     'SEARCHING',
    readinessScore: 0,
    confidence:    0,
    phase:         null,
    faults:        [],
    repState:      'START',
    repCount:      0,
    activeCue:     null,
    ...overrides,
  };
}

/**
 * Factory: SessionSummary — the finalized session result.
 * @param {Object} overrides
 */
export function makeSessionSummary(overrides = {}) {
  return {
    sessionId:    null,
    movementId:   null,
    startedAt:    Date.now(),
    endedAt:      null,
    repCount:     0,
    avgScore:     null,
    faultCounts:  {},
    topCues:      [],
    timeline:     [],
    phaseMetrics: {},
    ...overrides,
  };
}

/**
 * Factory: FaultEvent — a confirmed, surfaced fault.
 * @param {Object} overrides
 */
export function makeFaultEvent(overrides = {}) {
  return {
    id:          'unknown',
    label:       '',
    cue:         '',
    severity:    'MODERATE',
    phase:       null,
    startedAt:   null,
    persistedMs: 0,
    ...overrides,
  };
}

/**
 * Factory: RepEvent — emitted when a rep is confirmed complete.
 * @param {Object} overrides
 */
export function makeRepEvent(overrides = {}) {
  return {
    type:          'REP_COMPLETE',
    repNumber:     0,
    tMs:           Date.now(),
    rangeOfMotion: null,
    durationMs:    null,
    eccentricTime: null,
    concentricTime:null,
    pauseTime:     null,
    phaseTimeline: [],
    repScore:      null,
    ...overrides,
  };
}