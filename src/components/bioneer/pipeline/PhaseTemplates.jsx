/**
 * PhaseTemplates — reusable phase definitions for movement families.
 * Import into MovementProfiles to avoid duplicating phase arrays.
 */

export const PhaseTemplates = Object.freeze({
  BILATERAL_KNEE_DOMINANT: ['start','eccentric','bottom','concentric','lockout'],
  BILATERAL_HIP_DOMINANT:  ['start','hinge_descent','hinge_bottom','hinge_ascent','lockout'],
  UNILATERAL_KNEE:         ['start','descent','bottom','ascent','stabilize'],
  HORIZONTAL_PUSH:         ['start','lower','bottom','press','lockout'],
  VERTICAL_PUSH:           ['start','dip','drive','lockout','reset'],
  HORIZONTAL_PULL:         ['start','pull','peak','lower','reset'],
  VERTICAL_PULL:           ['hang','pull','top','descent','hang'],
  LOCOMOTION:              ['stance','drive','flight','contact'],
  ROTATION_STRIKE:         ['load','stride','separation','launch','contact','finish'],
  JUMP_LANDING:            ['load','takeoff','flight','land','stabilize'],
});