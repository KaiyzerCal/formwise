/**
 * MovementLibraryData — 20 seeded movements mapped to PhaseTemplates + FaultRuleLibrary.
 * Each entry follows the MovementProfile extended schema.
 */

import { PhaseTemplates } from './PhaseTemplates.js';
import { FaultRuleLibrary as F } from './FaultRuleLibrary.js';

const kneeSquatPhaseMap  = { START:'start', ECCENTRIC:'eccentric', BOTTOM:'bottom', CONCENTRIC:'concentric', LOCKOUT:'lockout' };
const hipHingePhaseMap   = { START:'start', ECCENTRIC:'hinge_descent', BOTTOM:'hinge_bottom', CONCENTRIC:'hinge_ascent', LOCKOUT:'lockout' };
const pushPhaseMap       = { START:'start', ECCENTRIC:'lower', BOTTOM:'bottom', CONCENTRIC:'press', LOCKOUT:'lockout' };
const pullPhaseMap       = { START:'start', ECCENTRIC:'lower', BOTTOM:'hang', CONCENTRIC:'pull', LOCKOUT:'top' };
const defaultWeights     = { rom:0.4, stability:0.2, symmetry:0.2, tempo:0.2 };

export const MOVEMENT_LIBRARY = [

  // ── KNEE DOMINANT ──────────────────────────────────────────────────────────
  {
    id: 'air_squat', displayName: 'Air Squat',
    movementFamily: 'bilateral_knee_dominant',
    phaseTemplate: PhaseTemplates.BILATERAL_KNEE_DOMINANT,
    phaseMap: kneeSquatPhaseMap,
    primaryAngleKey: 'hipHingeL', secondaryAngleKey: 'kneeL',
    visibilityJoints: ['l_hip','r_hip','l_knee','r_knee'],
    thresholds: { descentVel:0.006, ascentVel:0.004, bottomAngle:90, lockoutAngle:170, minDepth:90 },
    faultRules: [F.kneeValgus, F.heelRise, F.trunkCollapse],
    repValidationMode: 'rom_return',
    confidenceWeights: defaultWeights,
  },
  {
    id: 'goblet_squat', displayName: 'Goblet Squat',
    movementFamily: 'bilateral_knee_dominant',
    phaseTemplate: PhaseTemplates.BILATERAL_KNEE_DOMINANT,
    phaseMap: kneeSquatPhaseMap,
    primaryAngleKey: 'hipHingeL', secondaryAngleKey: 'kneeL',
    visibilityJoints: ['l_hip','r_hip','l_knee','r_knee'],
    thresholds: { descentVel:0.006, ascentVel:0.004, bottomAngle:90, lockoutAngle:170, minDepth:90 },
    faultRules: [F.kneeValgus, F.heelRise, F.trunkCollapse, F.hipShift],
    repValidationMode: 'rom_return',
    confidenceWeights: defaultWeights,
  },
  {
    id: 'back_squat', displayName: 'Back Squat',
    movementFamily: 'bilateral_knee_dominant',
    phaseTemplate: PhaseTemplates.BILATERAL_KNEE_DOMINANT,
    phaseMap: kneeSquatPhaseMap,
    primaryAngleKey: 'hipHingeL', secondaryAngleKey: 'kneeL',
    visibilityJoints: ['l_hip','r_hip','l_knee','r_knee'],
    thresholds: { descentVel:0.006, ascentVel:0.004, bottomAngle:100, lockoutAngle:170, minDepth:100 },
    faultRules: [F.kneeValgus, F.heelRise, F.trunkCollapse, F.asymmetricPush, F.lumbarFlexion],
    repValidationMode: 'rom_return',
    confidenceWeights: defaultWeights,
  },

  // ── HIP DOMINANT ──────────────────────────────────────────────────────────
  {
    id: 'romanian_deadlift', displayName: 'Romanian Deadlift',
    movementFamily: 'bilateral_hip_dominant',
    phaseTemplate: PhaseTemplates.BILATERAL_HIP_DOMINANT,
    phaseMap: hipHingePhaseMap,
    primaryAngleKey: 'hipHingeL', secondaryAngleKey: 'kneeL',
    visibilityJoints: ['l_hip','r_hip','l_knee'],
    thresholds: { descentVel:0.004, ascentVel:0.003, bottomAngle:60, lockoutAngle:170 },
    faultRules: [F.lumbarFlexion, F.trunkCollapse, F.hipShift],
    repValidationMode: 'rom_return',
    confidenceWeights: defaultWeights,
  },
  {
    id: 'deadlift', displayName: 'Deadlift',
    movementFamily: 'bilateral_hip_dominant',
    phaseTemplate: PhaseTemplates.BILATERAL_HIP_DOMINANT,
    phaseMap: hipHingePhaseMap,
    primaryAngleKey: 'hipHingeL', secondaryAngleKey: 'kneeL',
    visibilityJoints: ['l_hip','r_hip','l_knee'],
    thresholds: { descentVel:0.004, ascentVel:0.003, bottomAngle:75, lockoutAngle:170 },
    faultRules: [F.lumbarFlexion, F.trunkCollapse, F.hipShift, F.pelvicDrift],
    repValidationMode: 'rom_return',
    confidenceWeights: defaultWeights,
  },
  {
    id: 'glute_bridge', displayName: 'Glute Bridge',
    movementFamily: 'bilateral_hip_dominant',
    phaseTemplate: PhaseTemplates.BILATERAL_HIP_DOMINANT,
    phaseMap: hipHingePhaseMap,
    primaryAngleKey: 'hipHingeL', secondaryAngleKey: 'kneeL',
    visibilityJoints: ['l_hip','r_hip','l_knee'],
    thresholds: { descentVel:0.003, ascentVel:0.003, bottomAngle:80, lockoutAngle:170 },
    faultRules: [F.hipShift, F.pelvicDrift],
    repValidationMode: 'rom_return',
    confidenceWeights: defaultWeights,
  },

  // ── UNILATERAL KNEE ───────────────────────────────────────────────────────
  {
    id: 'forward_lunge', displayName: 'Forward Lunge',
    movementFamily: 'unilateral_knee',
    phaseTemplate: PhaseTemplates.UNILATERAL_KNEE,
    phaseMap: { START:'start', ECCENTRIC:'descent', BOTTOM:'bottom', CONCENTRIC:'ascent', LOCKOUT:'stabilize' },
    primaryAngleKey: 'hipHingeL', secondaryAngleKey: 'kneeL',
    visibilityJoints: ['l_hip','l_knee','l_ankle'],
    thresholds: { descentVel:0.005, ascentVel:0.004, bottomAngle:100, lockoutAngle:160 },
    faultRules: [F.kneeValgus, F.trunkCollapse, F.hipShift],
    repValidationMode: 'rom_return',
    confidenceWeights: defaultWeights,
  },
  {
    id: 'reverse_lunge', displayName: 'Reverse Lunge',
    movementFamily: 'unilateral_knee',
    phaseTemplate: PhaseTemplates.UNILATERAL_KNEE,
    phaseMap: { START:'start', ECCENTRIC:'descent', BOTTOM:'bottom', CONCENTRIC:'ascent', LOCKOUT:'stabilize' },
    primaryAngleKey: 'hipHingeL', secondaryAngleKey: 'kneeL',
    visibilityJoints: ['l_hip','l_knee','l_ankle'],
    thresholds: { descentVel:0.005, ascentVel:0.004, bottomAngle:100, lockoutAngle:160 },
    faultRules: [F.kneeValgus, F.trunkCollapse],
    repValidationMode: 'rom_return',
    confidenceWeights: defaultWeights,
  },
  {
    id: 'split_squat', displayName: 'Split Squat',
    movementFamily: 'unilateral_knee',
    phaseTemplate: PhaseTemplates.UNILATERAL_KNEE,
    phaseMap: { START:'start', ECCENTRIC:'descent', BOTTOM:'bottom', CONCENTRIC:'ascent', LOCKOUT:'stabilize' },
    primaryAngleKey: 'hipHingeL', secondaryAngleKey: 'kneeL',
    visibilityJoints: ['l_hip','l_knee','l_ankle'],
    thresholds: { descentVel:0.005, ascentVel:0.004, bottomAngle:90, lockoutAngle:160 },
    faultRules: [F.kneeValgus, F.trunkCollapse, F.heelRise],
    repValidationMode: 'rom_return',
    confidenceWeights: defaultWeights,
  },
  {
    id: 'step_up', displayName: 'Step Up',
    movementFamily: 'unilateral_knee',
    phaseTemplate: PhaseTemplates.UNILATERAL_KNEE,
    phaseMap: { START:'start', ECCENTRIC:'descent', BOTTOM:'bottom', CONCENTRIC:'ascent', LOCKOUT:'stabilize' },
    primaryAngleKey: 'hipHingeL', secondaryAngleKey: 'kneeL',
    visibilityJoints: ['l_hip','l_knee','l_ankle'],
    thresholds: { descentVel:0.004, ascentVel:0.004, bottomAngle:90, lockoutAngle:160 },
    faultRules: [F.kneeValgus, F.hipShift],
    repValidationMode: 'rom_return',
    confidenceWeights: defaultWeights,
  },

  // ── HORIZONTAL PUSH ───────────────────────────────────────────────────────
  {
    id: 'push_up', displayName: 'Push Up',
    movementFamily: 'horizontal_push',
    phaseTemplate: PhaseTemplates.HORIZONTAL_PUSH,
    phaseMap: { START:'start', ECCENTRIC:'lower', BOTTOM:'bottom', CONCENTRIC:'press', LOCKOUT:'lockout' },
    primaryAngleKey: 'elbowL', secondaryAngleKey: 'elbowR',
    visibilityJoints: ['l_elbow','r_elbow','l_wrist','r_wrist'],
    thresholds: { descentVel:0.005, ascentVel:0.004, bottomAngle:90, lockoutAngle:155 },
    faultRules: [F.elbowFlare, F.trunkCollapse, F.hipShift],
    repValidationMode: 'rom_return',
    confidenceWeights: defaultWeights,
  },
  {
    id: 'bench_press', displayName: 'Bench Press',
    movementFamily: 'horizontal_push',
    phaseTemplate: PhaseTemplates.HORIZONTAL_PUSH,
    phaseMap: { START:'start', ECCENTRIC:'lower', BOTTOM:'bottom', CONCENTRIC:'press', LOCKOUT:'lockout' },
    primaryAngleKey: 'elbowL', secondaryAngleKey: 'elbowR',
    visibilityJoints: ['l_elbow','r_elbow','l_wrist','r_wrist'],
    thresholds: { descentVel:0.005, ascentVel:0.004, bottomAngle:90, lockoutAngle:160 },
    faultRules: [F.elbowFlare, F.asymmetricPush],
    repValidationMode: 'rom_return',
    confidenceWeights: defaultWeights,
  },

  // ── VERTICAL PUSH ─────────────────────────────────────────────────────────
  {
    id: 'overhead_press', displayName: 'Overhead Press',
    movementFamily: 'vertical_push',
    phaseTemplate: PhaseTemplates.VERTICAL_PUSH,
    phaseMap: { START:'start', ECCENTRIC:'dip', BOTTOM:'dip', CONCENTRIC:'drive', LOCKOUT:'lockout' },
    primaryAngleKey: 'elbowR', secondaryAngleKey: 'elbowL',
    visibilityJoints: ['r_elbow','r_wrist','r_shoulder'],
    thresholds: { descentVel:0.005, ascentVel:0.004, bottomAngle:90, lockoutAngle:160 },
    faultRules: [F.lumbarFlexion, F.trunkCollapse],
    repValidationMode: 'rom_return',
    confidenceWeights: defaultWeights,
  },
  {
    id: 'landmine_press', displayName: 'Landmine Press',
    movementFamily: 'vertical_push',
    phaseTemplate: PhaseTemplates.VERTICAL_PUSH,
    phaseMap: { START:'start', ECCENTRIC:'dip', BOTTOM:'dip', CONCENTRIC:'drive', LOCKOUT:'lockout' },
    primaryAngleKey: 'elbowR', secondaryAngleKey: 'elbowL',
    visibilityJoints: ['r_elbow','r_wrist','r_shoulder'],
    thresholds: { descentVel:0.005, ascentVel:0.004, bottomAngle:90, lockoutAngle:155 },
    faultRules: [F.lumbarFlexion, F.hipShift],
    repValidationMode: 'rom_return',
    confidenceWeights: defaultWeights,
  },

  // ── HORIZONTAL PULL ───────────────────────────────────────────────────────
  {
    id: 'bent_over_row', displayName: 'Bent Over Row',
    movementFamily: 'horizontal_pull',
    phaseTemplate: PhaseTemplates.HORIZONTAL_PULL,
    phaseMap: { START:'start', ECCENTRIC:'lower', BOTTOM:'lower', CONCENTRIC:'pull', LOCKOUT:'peak' },
    primaryAngleKey: 'elbowL', secondaryAngleKey: 'elbowR',
    visibilityJoints: ['l_elbow','r_elbow','l_wrist','r_wrist'],
    thresholds: { descentVel:0.004, ascentVel:0.004, bottomAngle:60, lockoutAngle:140 },
    faultRules: [F.lumbarFlexion, F.trunkCollapse, F.asymmetricPush],
    repValidationMode: 'rom_return',
    confidenceWeights: defaultWeights,
  },
  {
    id: 'seated_cable_row', displayName: 'Seated Cable Row',
    movementFamily: 'horizontal_pull',
    phaseTemplate: PhaseTemplates.HORIZONTAL_PULL,
    phaseMap: { START:'start', ECCENTRIC:'lower', BOTTOM:'lower', CONCENTRIC:'pull', LOCKOUT:'peak' },
    primaryAngleKey: 'elbowL', secondaryAngleKey: 'elbowR',
    visibilityJoints: ['l_elbow','r_elbow','l_wrist','r_wrist'],
    thresholds: { descentVel:0.004, ascentVel:0.004, bottomAngle:60, lockoutAngle:140 },
    faultRules: [F.lumbarFlexion, F.trunkCollapse],
    repValidationMode: 'rom_return',
    confidenceWeights: defaultWeights,
  },

  // ── VERTICAL PULL ─────────────────────────────────────────────────────────
  {
    id: 'lat_pulldown', displayName: 'Lat Pulldown',
    movementFamily: 'vertical_pull',
    phaseTemplate: PhaseTemplates.VERTICAL_PULL,
    phaseMap: { START:'hang', ECCENTRIC:'descent', BOTTOM:'hang', CONCENTRIC:'pull', LOCKOUT:'top' },
    primaryAngleKey: 'elbowL', secondaryAngleKey: 'elbowR',
    visibilityJoints: ['l_elbow','r_elbow','l_shoulder','r_shoulder'],
    thresholds: { descentVel:0.005, ascentVel:0.004, bottomAngle:90, lockoutAngle:155 },
    faultRules: [F.lumbarFlexion, F.asymmetricPush],
    repValidationMode: 'rom_return',
    confidenceWeights: defaultWeights,
  },
  {
    id: 'pull_up', displayName: 'Pull Up',
    movementFamily: 'vertical_pull',
    phaseTemplate: PhaseTemplates.VERTICAL_PULL,
    phaseMap: { START:'hang', ECCENTRIC:'descent', BOTTOM:'hang', CONCENTRIC:'pull', LOCKOUT:'top' },
    primaryAngleKey: 'elbowL', secondaryAngleKey: 'elbowR',
    visibilityJoints: ['l_elbow','r_elbow','l_shoulder','r_shoulder'],
    thresholds: { descentVel:0.005, ascentVel:0.004, bottomAngle:90, lockoutAngle:155 },
    faultRules: [F.asymmetricPush, F.hipShift],
    repValidationMode: 'rom_return',
    confidenceWeights: defaultWeights,
  },

  // ── LOCOMOTION ────────────────────────────────────────────────────────────
  {
    id: 'sprint', displayName: 'Sprint',
    movementFamily: 'locomotion',
    phaseTemplate: PhaseTemplates.LOCOMOTION,
    phaseMap: { START:'stance', ECCENTRIC:'drive', BOTTOM:'flight', CONCENTRIC:'contact', LOCKOUT:'stance' },
    primaryAngleKey: 'kneeL', secondaryAngleKey: null,
    visibilityJoints: ['l_knee','r_knee','pelvis'],
    thresholds: { descentVel:0.020, ascentVel:0.015, bottomAngle:80, lockoutAngle:150 },
    faultRules: [F.overstride, F.lowKneeDrive, F.trunkCollapse],
    repValidationMode: 'stride_cycle',
    confidenceWeights: { rom:0.3, stability:0.3, symmetry:0.2, tempo:0.2 },
  },

  // ── JUMP / ATHLETIC ───────────────────────────────────────────────────────
  {
    id: 'vertical_jump', displayName: 'Vertical Jump',
    movementFamily: 'jump_landing',
    phaseTemplate: PhaseTemplates.JUMP_LANDING,
    phaseMap: { START:'load', ECCENTRIC:'load', BOTTOM:'takeoff', CONCENTRIC:'flight', LOCKOUT:'land' },
    primaryAngleKey: 'kneeL', secondaryAngleKey: 'kneeR',
    visibilityJoints: ['l_knee','r_knee','pelvis','l_ankle','r_ankle'],
    thresholds: { descentVel:0.025, ascentVel:0.020, bottomAngle:90, lockoutAngle:160 },
    faultRules: [F.valgusLanding, F.kneeValgus, F.asymmetricPush],
    repValidationMode: 'peak_detect',
    confidenceWeights: { rom:0.3, stability:0.2, symmetry:0.3, tempo:0.2 },
  },
];

/** Quick lookup by id */
export function getMovement(id) {
  return MOVEMENT_LIBRARY.find(m => m.id === id) ?? MOVEMENT_LIBRARY[0];
}