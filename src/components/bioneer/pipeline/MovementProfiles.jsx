/**
 * MovementProfiles — per-movement config for RepDetector + PhaseClassifier
 *
 * primaryAngleKey:   angle from KinematicsEngine to drive state machine
 * secondaryAngleKey: confirmation joint (must agree on direction)
 * lockoutAngle:      degrees above which LOCKOUT is valid
 * visibilityJoints:  joints that must be visible (score > 0.7) to process frame
 */

export const MOVEMENT_PROFILES = {

  back_squat: {
    category:          'strength',
    primaryAngleKey:   'hipHingeL',
    secondaryAngleKey: 'kneeL',
    lockoutAngle:      170,
    minRepMs:          1200,
    visibilityJoints:  ['l_hip', 'r_hip', 'l_knee', 'r_knee'],
    phases:            ['setup','descent','bottom','ascent','lockout'],
    phaseMap:          { START:'setup', ECCENTRIC:'descent', BOTTOM:'bottom', CONCENTRIC:'ascent', LOCKOUT:'lockout' },
    repVelJoint:       'pelvis',
    angleKey:          'hipHingeL',
    thresholds:        { descentVel: 0.006, ascentVel: 0.004, bottomAngle: 100, lockoutAngle: 170 },
  },

  squat: {
    category:          'strength',
    primaryAngleKey:   'hipHingeL',
    secondaryAngleKey: 'kneeL',
    lockoutAngle:      170,
    minRepMs:          1200,
    visibilityJoints:  ['l_hip', 'r_hip', 'l_knee', 'r_knee'],
    phases:            ['setup','descent','bottom','ascent','lockout'],
    phaseMap:          { START:'setup', ECCENTRIC:'descent', BOTTOM:'bottom', CONCENTRIC:'ascent', LOCKOUT:'lockout' },
    repVelJoint:       'pelvis',
    angleKey:          'hipHingeL',
    thresholds:        { descentVel: 0.006, ascentVel: 0.004, bottomAngle: 100, lockoutAngle: 170 },
  },

  deadlift: {
    category:          'strength',
    primaryAngleKey:   'hipHingeL',
    secondaryAngleKey: 'kneeL',
    lockoutAngle:      170,
    minRepMs:          1500,
    visibilityJoints:  ['l_hip', 'r_hip', 'l_knee'],
    phases:            ['setup','pull','lockout','lower'],
    phaseMap:          { START:'setup', ECCENTRIC:'lower', BOTTOM:'setup', CONCENTRIC:'pull', LOCKOUT:'lockout' },
    repVelJoint:       'l_hip',
    angleKey:          'hipHingeL',
    thresholds:        { descentVel: 0.004, ascentVel: 0.003, bottomAngle: 75, lockoutAngle: 170 },
  },

  push_up: {
    category:          'strength',
    primaryAngleKey:   'elbowL',
    secondaryAngleKey: 'elbowR',
    lockoutAngle:      155,
    minRepMs:          800,
    visibilityJoints:  ['l_elbow', 'r_elbow', 'l_wrist', 'r_wrist'],
    phases:            ['plank','lowering','bottom','press','top'],
    phaseMap:          { START:'plank', ECCENTRIC:'lowering', BOTTOM:'bottom', CONCENTRIC:'press', LOCKOUT:'top' },
    repVelJoint:       'chest',
    angleKey:          'elbowL',
    thresholds:        { descentVel: 0.005, ascentVel: 0.004, bottomAngle: 90, lockoutAngle: 155 },
  },

  overhead_press: {
    category:          'strength',
    primaryAngleKey:   'elbowR',
    secondaryAngleKey: 'elbowL',
    lockoutAngle:      160,
    minRepMs:          1000,
    visibilityJoints:  ['r_elbow', 'r_wrist', 'r_shoulder'],
    phases:            ['start','descent','bottom','press','lockout'],
    phaseMap:          { START:'start', ECCENTRIC:'descent', BOTTOM:'bottom', CONCENTRIC:'press', LOCKOUT:'lockout' },
    repVelJoint:       'r_wrist',
    angleKey:          'elbowR',
    thresholds:        { descentVel: 0.005, ascentVel: 0.004, bottomAngle: 90, lockoutAngle: 160 },
  },

  bench_press: {
    category:          'strength',
    primaryAngleKey:   'elbowL',
    secondaryAngleKey: 'elbowR',
    lockoutAngle:      160,
    minRepMs:          1000,
    visibilityJoints:  ['l_elbow', 'r_elbow', 'l_wrist', 'r_wrist'],
    phases:            ['setup','lowering','bottom','press','lockout'],
    phaseMap:          { START:'setup', ECCENTRIC:'lowering', BOTTOM:'bottom', CONCENTRIC:'press', LOCKOUT:'lockout' },
    repVelJoint:       'chest',
    angleKey:          'elbowL',
    thresholds:        { descentVel: 0.005, ascentVel: 0.004, bottomAngle: 90, lockoutAngle: 160 },
  },

  pull_up: {
    category:          'strength',
    primaryAngleKey:   'elbowL',
    secondaryAngleKey: 'elbowR',
    lockoutAngle:      155,
    minRepMs:          1000,
    visibilityJoints:  ['l_elbow', 'r_elbow', 'l_shoulder', 'r_shoulder'],
    phases:            ['hang','pull','top','lower'],
    phaseMap:          { START:'hang', ECCENTRIC:'lower', BOTTOM:'hang', CONCENTRIC:'pull', LOCKOUT:'top' },
    repVelJoint:       'pelvis',
    angleKey:          'elbowL',
    thresholds:        { descentVel: 0.005, ascentVel: 0.004, bottomAngle: 90, lockoutAngle: 155 },
  },

  lunge: {
    category:          'strength',
    primaryAngleKey:   'hipHingeL',
    secondaryAngleKey: 'kneeL',
    lockoutAngle:      160,
    minRepMs:          1000,
    visibilityJoints:  ['l_hip', 'l_knee', 'l_ankle'],
    phases:            ['setup','step','bottom','ascent','lockout'],
    phaseMap:          { START:'setup', ECCENTRIC:'step', BOTTOM:'bottom', CONCENTRIC:'ascent', LOCKOUT:'lockout' },
    repVelJoint:       'pelvis',
    angleKey:          'hipHingeL',
    thresholds:        { descentVel: 0.005, ascentVel: 0.004, bottomAngle: 100, lockoutAngle: 160 },
  },

  // ── Non-cyclical / sports movements — use legacy velocity approach ────────

  sprint: {
    category:    'locomotion',
    primaryAngleKey:   'kneeL',
    secondaryAngleKey: null,
    lockoutAngle: 150,
    minRepMs:    300,
    repVelJoint: 'pelvis',
    angleKey:    'kneeL',
    thresholds:  { descentVel: 0.020, ascentVel: 0.015, bottomAngle: 80, lockoutAngle: 150 },
    phases:      ['drive','transition','maxvel','float'],
  },

  baseball_swing: {
    category:    'rotational',
    primaryAngleKey:   'elbowR',
    secondaryAngleKey: null,
    lockoutAngle: 150,
    minRepMs:    400,
    repVelJoint: 'r_wrist',
    angleKey:    'elbowR',
    thresholds:  { descentVel: 0.018, ascentVel: 0.008, bottomAngle: 130, lockoutAngle: 150 },
    phases:      ['stance','load','stride','separation','launch','contact','finish'],
  },

  jump_landing: {
    category:    'athletic',
    primaryAngleKey:   'kneeL',
    secondaryAngleKey: 'kneeR',
    lockoutAngle: 160,
    minRepMs:    400,
    repVelJoint: 'pelvis',
    angleKey:    'kneeL',
    thresholds:  { descentVel: 0.025, ascentVel: 0.020, bottomAngle: 90, lockoutAngle: 160 },
    phases:      ['flight','contact','absorption','stabilize'],
  },

  golf_swing: {
    category:    'rotational',
    primaryAngleKey:   'elbowR',
    secondaryAngleKey: null,
    lockoutAngle: 150,
    minRepMs:    600,
    repVelJoint: 'r_wrist',
    angleKey:    'elbowR',
    thresholds:  { descentVel: 0.016, ascentVel: 0.008, bottomAngle: 130, lockoutAngle: 150 },
    phases:      ['address','backswing','transition','impact','follow_through'],
  },

  basketball_shot: {
    category:    'rotational',
    primaryAngleKey:   'elbowR',
    secondaryAngleKey: null,
    lockoutAngle: 150,
    minRepMs:    500,
    repVelJoint: 'r_wrist',
    angleKey:    'elbowR',
    thresholds:  { descentVel: 0.014, ascentVel: 0.008, bottomAngle: 80, lockoutAngle: 150 },
    phases:      ['load','jump','set','release','follow'],
  },
};

export function getProfile(exerciseId) {
  return MOVEMENT_PROFILES[exerciseId] ?? MOVEMENT_PROFILES['back_squat'];
}