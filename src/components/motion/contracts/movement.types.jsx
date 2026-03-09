/**
 * motion/contracts/movement.types.js
 * MovementProfile canonical shape and factory.
 */

/**
 * Factory: create a MovementProfile with safe defaults.
 * @param {Object} overrides
 * @returns {MovementProfile}
 */
export function makeMovementProfile(overrides = {}) {
  return {
    id:                'unknown',
    displayName:       'Unknown Movement',
    category:          'strength',
    movementFamily:    null,
    phases:            ['start', 'eccentric', 'bottom', 'concentric', 'lockout'],
    phaseMap:          {},
    primaryAngleKey:   'hipHingeL',
    secondaryAngleKey: null,
    lockoutAngle:      170,
    minRepMs:          1000,
    visibilityJoints:  ['l_hip', 'r_hip', 'l_knee', 'r_knee'],
    repVelJoint:       'pelvis',
    thresholds: {
      descentVel:   0.006,
      ascentVel:    0.004,
      bottomAngle:  100,
      lockoutAngle: 170,
    },
    faultRules:        [],
    confidenceWeights: { rom: 0.4, stability: 0.2, symmetry: 0.2, tempo: 0.2 },
    repValidationMode: 'rom_return',
    ...overrides,
  };
}