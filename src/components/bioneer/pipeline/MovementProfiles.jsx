/**
 * MovementProfiles — per-movement config driving RepDetector + PhaseClassifier
 */

export const MOVEMENT_PROFILES = {

  back_squat: {
    category:    'strength',
    repVelJoint: 'pelvis',
    angleKey:    'kneeL',
    thresholds: {
      descentVel:   0.006,
      ascentVel:    0.004,
      bottomAngle:  100,
      lockoutAngle: 160,
    },
    minRepMs:   1200,
    phases:     ['setup','descent','bottom','ascent','lockout'],
  },

  squat: {
    category:    'strength',
    repVelJoint: 'pelvis',
    angleKey:    'kneeL',
    thresholds: {
      descentVel:   0.006,
      ascentVel:    0.004,
      bottomAngle:  100,
      lockoutAngle: 160,
    },
    minRepMs:   1200,
    phases:     ['setup','descent','bottom','ascent','lockout'],
  },

  deadlift: {
    category:    'strength',
    repVelJoint: 'l_hip',
    angleKey:    'hipL',
    thresholds: {
      descentVel:   0.004,
      ascentVel:    0.003,
      bottomAngle:  75,
      lockoutAngle: 170,
    },
    minRepMs:   1500,
    phases:     ['setup','pull','lockout','lower'],
  },

  push_up: {
    category:    'strength',
    repVelJoint: 'chest',
    angleKey:    'elbowL',
    thresholds: {
      descentVel:   0.005,
      ascentVel:    0.004,
      bottomAngle:  90,
      lockoutAngle: 155,
    },
    minRepMs:   800,
    phases:     ['plank','lowering','bottom','press','top'],
  },

  overhead_press: {
    category:    'strength',
    repVelJoint: 'r_wrist',
    angleKey:    'elbowR',
    thresholds: {
      descentVel:   0.005,
      ascentVel:    0.004,
      bottomAngle:  90,
      lockoutAngle: 160,
    },
    minRepMs:   1000,
    phases:     ['start','press','lockout','descent'],
  },

  lunge: {
    category:    'strength',
    repVelJoint: 'pelvis',
    angleKey:    'kneeL',
    thresholds: {
      descentVel:   0.005,
      ascentVel:    0.004,
      bottomAngle:  100,
      lockoutAngle: 160,
    },
    minRepMs:   1000,
    phases:     ['setup','step','bottom','ascent','lockout'],
  },

  sprint: {
    category:    'locomotion',
    repVelJoint: 'pelvis',
    angleKey:    'kneeL',
    thresholds: {
      descentVel:   0.020,
      ascentVel:    0.015,
      bottomAngle:  80,
      lockoutAngle: 150,
    },
    minRepMs:   300,
    phases:     ['drive','transition','maxvel','float'],
  },

  baseball_swing: {
    category:    'rotational',
    repVelJoint: 'r_wrist',
    angleKey:    'elbowR',
    thresholds: {
      descentVel:   0.018,
      ascentVel:    0.008,
      bottomAngle:  130,
      lockoutAngle: 150,
    },
    minRepMs:   400,
    phases:     ['stance','load','stride','separation','launch','contact','finish'],
  },

  jump_landing: {
    category:    'athletic',
    repVelJoint: 'pelvis',
    angleKey:    'kneeL',
    thresholds: {
      descentVel:   0.025,
      ascentVel:    0.020,
      bottomAngle:  90,
      lockoutAngle: 160,
    },
    minRepMs:   400,
    phases:     ['flight','contact','absorption','stabilize'],
  },

  golf_swing: {
    category:    'rotational',
    repVelJoint: 'r_wrist',
    angleKey:    'elbowR',
    thresholds: {
      descentVel:   0.016,
      ascentVel:    0.008,
      bottomAngle:  130,
      lockoutAngle: 150,
    },
    minRepMs:   600,
    phases:     ['address','backswing','transition','impact','follow_through'],
  },

  basketball_shot: {
    category:    'rotational',
    repVelJoint: 'r_wrist',
    angleKey:    'elbowR',
    thresholds: {
      descentVel:   0.014,
      ascentVel:    0.008,
      bottomAngle:  80,
      lockoutAngle: 150,
    },
    minRepMs:   500,
    phases:     ['load','jump','set','release','follow'],
  },
};

export function getProfile(exerciseId) {
  return MOVEMENT_PROFILES[exerciseId] ?? MOVEMENT_PROFILES['back_squat'];
}