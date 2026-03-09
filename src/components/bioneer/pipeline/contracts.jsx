/**
 * contracts.js — shared type contracts / constants for the Bioneer pipeline.
 * All pipeline modules import from here so shape definitions stay in one place.
 */

// ── Rep-detector states ───────────────────────────────────────────────────────
export const REP_STATES = Object.freeze({
  IDLE:       'IDLE',
  START:      'START',
  ECCENTRIC:  'ECCENTRIC',
  BOTTOM:     'BOTTOM',
  CONCENTRIC: 'CONCENTRIC',
  LOCKOUT:    'LOCKOUT',
  RESET:      'RESET',
});

// ── Subject lock states ───────────────────────────────────────────────────────
export const LOCK_STATES = Object.freeze({
  SEARCHING: 'SEARCHING',
  LOCKED:    'LOCKED',
  DEGRADED:  'DEGRADED',
  LOST:      'LOST',
});

// ── Fault severity levels ─────────────────────────────────────────────────────
export const FAULT_SEVERITY = Object.freeze({
  LOW:      'LOW',
  MODERATE: 'MODERATE',
  HIGH:     'HIGH',
});

// ── Confidence thresholds ─────────────────────────────────────────────────────
export const CONFIDENCE = Object.freeze({
  POSE_MIN:       0.60,
  POSE_GOOD:      0.75,
  TRACKING_MIN:   0.55,
  FAULT_SURFACE:  0.70,
});

// ── Pipeline frame shape (documentation only — JS has no enforced types) ──────
/**
 * PipelineFrame {
 *   tMs:        number,          // timestamp ms
 *   landmarks:  object|null,     // raw mediapipe landmarks
 *   joints:     object,          // normalized named joints { name: {x,y,z,vis} }
 *   world:      object,          // GHUM 3D world joints
 *   angles:     object,          // KinematicsEngine output
 *   velocities: object,
 *   phase:      string|null,     // RepDetector state
 *   phaseId:    string|null,     // PhaseClassifier display id
 *   faults:     Fault[],
 *   repCount:   number,
 *   lockState:  string,
 *   confidence: number,
 * }
 *
 * Fault {
 *   id:       string,
 *   severity: FAULT_SEVERITY,
 *   cue:      string,
 *   phase:    string|null,
 * }
 */