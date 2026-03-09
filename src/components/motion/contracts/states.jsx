/**
 * motion/contracts/states.js
 * Shared state enumerations — single source of truth for the engine.
 */

export const REP_STATES = Object.freeze({
  START:      'START',
  ECCENTRIC:  'ECCENTRIC',
  BOTTOM:     'BOTTOM',
  CONCENTRIC: 'CONCENTRIC',
  LOCKOUT:    'LOCKOUT',
});

export const LOCK_STATES = Object.freeze({
  SEARCHING: 'SEARCHING',
  LOCKED:    'LOCKED',
  DEGRADED:  'DEGRADED',
  LOST:      'LOST',
});

export const SESSION_STATES = Object.freeze({
  IDLE:      'IDLE',
  STARTING:  'STARTING',
  ACTIVE:    'ACTIVE',
  PAUSED:    'PAUSED',
  FINISHING: 'FINISHING',
  COMPLETE:  'COMPLETE',
  ERROR:     'ERROR',
});

export const SEVERITY = Object.freeze({
  LOW:      'LOW',
  MODERATE: 'MODERATE',
  HIGH:     'HIGH',
  CRITICAL: 'CRITICAL',
});

export const MOVEMENT_FAMILY = Object.freeze({
  BILATERAL_KNEE_DOMINANT: 'bilateral_knee_dominant',
  BILATERAL_HIP_DOMINANT:  'bilateral_hip_dominant',
  UNILATERAL_KNEE:         'unilateral_knee',
  HORIZONTAL_PUSH:         'horizontal_push',
  VERTICAL_PUSH:           'vertical_push',
  HORIZONTAL_PULL:         'horizontal_pull',
  VERTICAL_PULL:           'vertical_pull',
  LOCOMOTION:              'locomotion',
  ROTATIONAL:              'rotational',
  JUMP_LANDING:            'jump_landing',
  ATHLETIC:                'athletic',
  REHAB:                   'rehab',
});

export const MOVEMENT_CATEGORY = Object.freeze({
  STRENGTH:     'strength',
  SPORTS:       'sports',
  REHAB:        'rehab',
  CONDITIONING: 'conditioning',
});