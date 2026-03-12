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

  // ── New strength movements ────────────────────────────────────────────────

  goblet_squat: {
    category: 'strength', primaryAngleKey: 'hipHingeL', secondaryAngleKey: 'kneeL',
    lockoutAngle: 170, minRepMs: 1200,
    visibilityJoints: ['l_hip','r_hip','l_knee','r_knee'],
    phases: ['setup','descent','bottom','ascent','lockout'],
    phaseMap: { START:'setup', ECCENTRIC:'descent', BOTTOM:'bottom', CONCENTRIC:'ascent', LOCKOUT:'lockout' },
    repVelJoint: 'pelvis', angleKey: 'hipHingeL',
    thresholds: { descentVel:0.006, ascentVel:0.004, bottomAngle:90, lockoutAngle:170 },
  },

  front_squat: {
    category: 'strength', primaryAngleKey: 'hipHingeL', secondaryAngleKey: 'kneeL',
    lockoutAngle: 170, minRepMs: 1200,
    visibilityJoints: ['l_hip','r_hip','l_knee','r_knee'],
    phases: ['setup','descent','bottom','ascent','lockout'],
    phaseMap: { START:'setup', ECCENTRIC:'descent', BOTTOM:'bottom', CONCENTRIC:'ascent', LOCKOUT:'lockout' },
    repVelJoint: 'pelvis', angleKey: 'hipHingeL',
    thresholds: { descentVel:0.006, ascentVel:0.004, bottomAngle:100, lockoutAngle:170 },
  },

  romanian_deadlift: {
    category: 'strength', primaryAngleKey: 'hipHingeL', secondaryAngleKey: 'kneeL',
    lockoutAngle: 170, minRepMs: 1500,
    visibilityJoints: ['l_hip','r_hip','l_knee'],
    phases: ['setup','hinge','bottom','ascent','lockout'],
    phaseMap: { START:'setup', ECCENTRIC:'hinge', BOTTOM:'bottom', CONCENTRIC:'ascent', LOCKOUT:'lockout' },
    repVelJoint: 'l_hip', angleKey: 'hipHingeL',
    thresholds: { descentVel:0.004, ascentVel:0.003, bottomAngle:60, lockoutAngle:170 },
  },

  incline_pushup: {
    category: 'strength', primaryAngleKey: 'elbowL', secondaryAngleKey: 'elbowR',
    lockoutAngle: 148, minRepMs: 800,
    visibilityJoints: ['l_elbow','r_elbow','l_wrist','r_wrist'],
    phases: ['plank','lowering','bottom','press','top'],
    phaseMap: { START:'plank', ECCENTRIC:'lowering', BOTTOM:'bottom', CONCENTRIC:'press', LOCKOUT:'top' },
    repVelJoint: 'chest', angleKey: 'elbowL',
    thresholds: { descentVel:0.005, ascentVel:0.004, bottomAngle:85, lockoutAngle:148 },
  },

  chinup: {
    category: 'strength', primaryAngleKey: 'elbowL', secondaryAngleKey: 'elbowR',
    lockoutAngle: 155, minRepMs: 1000,
    visibilityJoints: ['l_elbow','r_elbow','l_shoulder','r_shoulder'],
    phases: ['hang','pull','top','lower'],
    phaseMap: { START:'hang', ECCENTRIC:'lower', BOTTOM:'hang', CONCENTRIC:'pull', LOCKOUT:'top' },
    repVelJoint: 'pelvis', angleKey: 'elbowL',
    thresholds: { descentVel:0.005, ascentVel:0.004, bottomAngle:90, lockoutAngle:155 },
  },

  bent_row: {
    category: 'strength', primaryAngleKey: 'elbowL', secondaryAngleKey: 'elbowR',
    lockoutAngle: 140, minRepMs: 1000,
    visibilityJoints: ['l_elbow','r_elbow','l_wrist','r_wrist'],
    phases: ['setup','pull','peak','lower'],
    phaseMap: { START:'setup', ECCENTRIC:'lower', BOTTOM:'setup', CONCENTRIC:'pull', LOCKOUT:'peak' },
    repVelJoint: 'chest', angleKey: 'elbowL',
    thresholds: { descentVel:0.004, ascentVel:0.004, bottomAngle:60, lockoutAngle:140 },
  },

  reverse_lunge: {
    category: 'strength', primaryAngleKey: 'hipHingeL', secondaryAngleKey: 'kneeL',
    lockoutAngle: 160, minRepMs: 1000,
    visibilityJoints: ['l_hip','l_knee','l_ankle'],
    phases: ['setup','step','bottom','ascent','lockout'],
    phaseMap: { START:'setup', ECCENTRIC:'step', BOTTOM:'bottom', CONCENTRIC:'ascent', LOCKOUT:'lockout' },
    repVelJoint: 'pelvis', angleKey: 'hipHingeL',
    thresholds: { descentVel:0.005, ascentVel:0.004, bottomAngle:100, lockoutAngle:160 },
  },

  bulgarian_split_squat: {
    category: 'strength', primaryAngleKey: 'hipHingeL', secondaryAngleKey: 'kneeL',
    lockoutAngle: 155, minRepMs: 1200,
    visibilityJoints: ['l_hip','l_knee','l_ankle'],
    phases: ['setup','descent','bottom','ascent','lockout'],
    phaseMap: { START:'setup', ECCENTRIC:'descent', BOTTOM:'bottom', CONCENTRIC:'ascent', LOCKOUT:'lockout' },
    repVelJoint: 'pelvis', angleKey: 'hipHingeL',
    thresholds: { descentVel:0.005, ascentVel:0.004, bottomAngle:90, lockoutAngle:155 },
  },

  glute_bridge: {
    category: 'strength', primaryAngleKey: 'hipHingeL', secondaryAngleKey: 'kneeL',
    lockoutAngle: 170, minRepMs: 800,
    visibilityJoints: ['l_hip','r_hip','l_knee'],
    phases: ['floor','lift','top','lower'],
    phaseMap: { START:'floor', ECCENTRIC:'lower', BOTTOM:'floor', CONCENTRIC:'lift', LOCKOUT:'top' },
    repVelJoint: 'l_hip', angleKey: 'hipHingeL',
    thresholds: { descentVel:0.003, ascentVel:0.003, bottomAngle:80, lockoutAngle:170 },
  },

  hip_thrust: {
    category: 'strength', primaryAngleKey: 'hipHingeL', secondaryAngleKey: 'kneeL',
    lockoutAngle: 175, minRepMs: 1000,
    visibilityJoints: ['l_hip','r_hip','l_knee'],
    phases: ['floor','lift','top','lower'],
    phaseMap: { START:'floor', ECCENTRIC:'lower', BOTTOM:'floor', CONCENTRIC:'lift', LOCKOUT:'top' },
    repVelJoint: 'l_hip', angleKey: 'hipHingeL',
    thresholds: { descentVel:0.004, ascentVel:0.004, bottomAngle:90, lockoutAngle:175 },
  },

  plank: {
    category: 'strength', primaryAngleKey: 'elbowL', secondaryAngleKey: null,
    lockoutAngle: 175, minRepMs: 3000,
    visibilityJoints: ['l_shoulder','r_shoulder','l_hip','r_hip','l_ankle'],
    phases: ['hold'],
    phaseMap: { START:'hold', ECCENTRIC:'hold', BOTTOM:'hold', CONCENTRIC:'hold', LOCKOUT:'hold' },
    repVelJoint: 'chest', angleKey: 'elbowL',
    thresholds: { descentVel:0.002, ascentVel:0.002, bottomAngle:170, lockoutAngle:175 },
  },

  side_plank: {
    category: 'strength', primaryAngleKey: 'elbowL', secondaryAngleKey: null,
    lockoutAngle: 175, minRepMs: 3000,
    visibilityJoints: ['l_shoulder','l_hip','l_ankle'],
    phases: ['hold'],
    phaseMap: { START:'hold', ECCENTRIC:'hold', BOTTOM:'hold', CONCENTRIC:'hold', LOCKOUT:'hold' },
    repVelJoint: 'chest', angleKey: 'elbowL',
    thresholds: { descentVel:0.002, ascentVel:0.002, bottomAngle:170, lockoutAngle:175 },
  },

  mountain_climber: {
    category: 'strength', primaryAngleKey: 'hipHingeL', secondaryAngleKey: null,
    lockoutAngle: 160, minRepMs: 500,
    visibilityJoints: ['l_hip','r_hip','l_knee','r_knee','l_wrist','r_wrist'],
    phases: ['plank','drive','extend'],
    phaseMap: { START:'plank', ECCENTRIC:'extend', BOTTOM:'plank', CONCENTRIC:'drive', LOCKOUT:'extend' },
    repVelJoint: 'pelvis', angleKey: 'hipHingeL',
    thresholds: { descentVel:0.010, ascentVel:0.010, bottomAngle:80, lockoutAngle:160 },
  },

  // ── New athletic movements ────────────────────────────────────────────────

  sprint: {
    category: 'locomotion', primaryAngleKey: 'kneeL', secondaryAngleKey: null,
    lockoutAngle: 150, minRepMs: 300,
    phases: ['drive','transition','maxvel','float'],
    repVelJoint: 'pelvis', angleKey: 'kneeL',
    thresholds: { descentVel:0.020, ascentVel:0.015, bottomAngle:80, lockoutAngle:150 },
  },

  acceleration_start: {
    category: 'athletic', primaryAngleKey: 'kneeL', secondaryAngleKey: null,
    lockoutAngle: 150, minRepMs: 300,
    phases: ['stance','first_step','drive','transition'],
    repVelJoint: 'pelvis', angleKey: 'kneeL',
    thresholds: { descentVel:0.020, ascentVel:0.015, bottomAngle:80, lockoutAngle:150 },
  },

  vertical_jump: {
    category: 'athletic', primaryAngleKey: 'kneeL', secondaryAngleKey: 'kneeR',
    lockoutAngle: 155, minRepMs: 400,
    phases: ['load','takeoff','flight','land'],
    repVelJoint: 'pelvis', angleKey: 'kneeL',
    thresholds: { descentVel:0.025, ascentVel:0.020, bottomAngle:90, lockoutAngle:155 },
  },

  broad_jump: {
    category: 'athletic', primaryAngleKey: 'kneeL', secondaryAngleKey: 'kneeR',
    lockoutAngle: 155, minRepMs: 400,
    phases: ['load','takeoff','flight','land'],
    repVelJoint: 'pelvis', angleKey: 'kneeL',
    thresholds: { descentVel:0.025, ascentVel:0.020, bottomAngle:90, lockoutAngle:155 },
  },

  lateral_shuffle: {
    category: 'athletic', primaryAngleKey: 'kneeL', secondaryAngleKey: null,
    lockoutAngle: 158, minRepMs: 300,
    phases: ['set','push','receive','reset'],
    repVelJoint: 'pelvis', angleKey: 'kneeL',
    thresholds: { descentVel:0.012, ascentVel:0.010, bottomAngle:100, lockoutAngle:158 },
  },

  skater_jump: {
    category: 'athletic', primaryAngleKey: 'kneeL', secondaryAngleKey: null,
    lockoutAngle: 155, minRepMs: 400,
    phases: ['load','push','flight','land'],
    repVelJoint: 'pelvis', angleKey: 'kneeL',
    thresholds: { descentVel:0.018, ascentVel:0.015, bottomAngle:100, lockoutAngle:155 },
  },

  cut: {
    category: 'athletic', primaryAngleKey: 'kneeL', secondaryAngleKey: 'kneeR',
    lockoutAngle: 155, minRepMs: 300,
    phases: ['approach','plant','cut','acceleration'],
    repVelJoint: 'pelvis', angleKey: 'kneeL',
    thresholds: { descentVel:0.020, ascentVel:0.018, bottomAngle:95, lockoutAngle:155 },
  },

  pivot: {
    category: 'athletic', primaryAngleKey: 'kneeL', secondaryAngleKey: null,
    lockoutAngle: 155, minRepMs: 300,
    phases: ['set','load','rotate','stabilize'],
    repVelJoint: 'pelvis', angleKey: 'kneeL',
    thresholds: { descentVel:0.014, ascentVel:0.010, bottomAngle:100, lockoutAngle:155 },
  },

  rotation_throw: {
    category: 'rotational', primaryAngleKey: 'elbowR', secondaryAngleKey: null,
    lockoutAngle: 150, minRepMs: 400,
    phases: ['load','rotate','release','follow_through'],
    repVelJoint: 'r_wrist', angleKey: 'elbowR',
    thresholds: { descentVel:0.016, ascentVel:0.010, bottomAngle:80, lockoutAngle:150 },
  },

  medicine_ball_throw: {
    category: 'rotational', primaryAngleKey: 'elbowR', secondaryAngleKey: 'elbowL',
    lockoutAngle: 150, minRepMs: 400,
    phases: ['load','drive','release','follow_through'],
    repVelJoint: 'r_wrist', angleKey: 'elbowR',
    thresholds: { descentVel:0.014, ascentVel:0.010, bottomAngle:85, lockoutAngle:150 },
  },

  // ── Missing strength movements ─────────────────────────────────────────────

  sumo_deadlift: {
    category: 'strength', primaryAngleKey: 'hipHingeL', secondaryAngleKey: 'kneeL',
    lockoutAngle: 170, minRepMs: 1500,
    visibilityJoints: ['l_hip','r_hip','l_knee'],
    phases: ['setup','pull','lockout','lower'],
    phaseMap: { START:'setup', ECCENTRIC:'lower', BOTTOM:'setup', CONCENTRIC:'pull', LOCKOUT:'lockout' },
    repVelJoint: 'l_hip', angleKey: 'hipHingeL',
    thresholds: { descentVel:0.004, ascentVel:0.003, bottomAngle:70, lockoutAngle:170 },
  },

  decline_pushup: {
    category: 'strength', primaryAngleKey: 'elbowL', secondaryAngleKey: 'elbowR',
    lockoutAngle: 150, minRepMs: 800,
    visibilityJoints: ['l_elbow','r_elbow','l_wrist','r_wrist'],
    phases: ['plank','lowering','bottom','press','top'],
    phaseMap: { START:'plank', ECCENTRIC:'lowering', BOTTOM:'bottom', CONCENTRIC:'press', LOCKOUT:'top' },
    repVelJoint: 'chest', angleKey: 'elbowL',
    thresholds: { descentVel:0.005, ascentVel:0.004, bottomAngle:88, lockoutAngle:150 },
  },

  walking_lunge: {
    category: 'strength', primaryAngleKey: 'hipHingeL', secondaryAngleKey: 'kneeL',
    lockoutAngle: 158, minRepMs: 800,
    visibilityJoints: ['l_hip','l_knee','l_ankle'],
    phases: ['step','bottom','drive','recover'],
    phaseMap: { START:'step', ECCENTRIC:'step', BOTTOM:'bottom', CONCENTRIC:'drive', LOCKOUT:'recover' },
    repVelJoint: 'pelvis', angleKey: 'hipHingeL',
    thresholds: { descentVel:0.006, ascentVel:0.005, bottomAngle:95, lockoutAngle:158 },
  },

  step_up: {
    category: 'strength', primaryAngleKey: 'hipHingeL', secondaryAngleKey: 'kneeL',
    lockoutAngle: 165, minRepMs: 1000,
    visibilityJoints: ['l_hip','l_knee','l_ankle'],
    phases: ['stand','step','drive','top','lower'],
    phaseMap: { START:'stand', ECCENTRIC:'lower', BOTTOM:'stand', CONCENTRIC:'drive', LOCKOUT:'top' },
    repVelJoint: 'pelvis', angleKey: 'hipHingeL',
    thresholds: { descentVel:0.004, ascentVel:0.004, bottomAngle:100, lockoutAngle:165 },
  },

  // ── Missing athletic movements ─────────────────────────────────────────────

  agility_step: {
    category: 'athletic', primaryAngleKey: 'kneeL', secondaryAngleKey: null,
    lockoutAngle: 158, minRepMs: 200,
    phases: ['ready','step','recover','reset'],
    repVelJoint: 'pelvis', angleKey: 'kneeL',
    thresholds: { descentVel:0.015, ascentVel:0.012, bottomAngle:105, lockoutAngle:158 },
  },

  defensive_slide: {
    category: 'athletic', primaryAngleKey: 'kneeL', secondaryAngleKey: null,
    lockoutAngle: 155, minRepMs: 250,
    phases: ['set','push','receive','reset'],
    repVelJoint: 'pelvis', angleKey: 'kneeL',
    thresholds: { descentVel:0.012, ascentVel:0.010, bottomAngle:100, lockoutAngle:155 },
  },

  jump_landing: {
    category: 'athletic', primaryAngleKey: 'kneeL', secondaryAngleKey: 'kneeR',
    lockoutAngle: 158, minRepMs: 400,
    phases: ['flight','contact','absorption','stabilize'],
    repVelJoint: 'pelvis', angleKey: 'kneeL',
    thresholds: { descentVel:0.025, ascentVel:0.020, bottomAngle:90, lockoutAngle:158 },
  },
};

export function getProfile(exerciseId) {
  return MOVEMENT_PROFILES[exerciseId] ?? MOVEMENT_PROFILES['back_squat'];
}

/**
 * Unified movement lookup — resolves exercise definitions from any library.
 * Used by pipeline modules to ensure consistent exercise metadata.
 */
export function getMovementMetadata(exerciseId) {
  // Try local movement profiles first (phase-aware + kinematics)
  const profile = MOVEMENT_PROFILES[exerciseId];
  if (profile) return profile;
  
  // Fallback: generic strength profile
  return MOVEMENT_PROFILES['back_squat'];
}