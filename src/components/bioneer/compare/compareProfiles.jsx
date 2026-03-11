/**
 * Movement-specific comparison profiles for Technique Compare
 * Defines which joints to compare, target angles, and coaching cues.
 *
 * MediaPipe Pose landmark indices (key ones):
 *   0=nose, 11=l_shoulder, 12=r_shoulder, 13=l_elbow, 14=r_elbow,
 *   15=l_wrist, 16=r_wrist, 23=l_hip, 24=r_hip,
 *   25=l_knee, 26=r_knee, 27=l_ankle, 28=r_ankle
 */

export const COMPARE_PROFILES = {
  back_squat: {
    name: 'Back Squat',
    keyAngles: [
      { id: 'knee_flex', name: 'Knee Flexion', indices: [23, 25, 27], target: 90, tolerance: 15 },
      { id: 'hip_flex',  name: 'Hip Depth',    indices: [11, 23, 25], target: 95, tolerance: 15 },
      { id: 'torso',     name: 'Torso Angle',  indices: [23, 11, 0],  target: 78, tolerance: 20 },
      { id: 'ankle',     name: 'Ankle Dorsi',  indices: [25, 27, 28], target: 70, tolerance: 15 },
    ],
    cueMap: {
      knee_flex: { low: 'Bend deeper at the knee', high: 'Do not collapse past toes' },
      hip_flex:  { low: 'Hips dropping early — drive depth through the hip', high: 'Sit back into the squat' },
      torso:     { low: 'Chest up — torso too upright for this phase', high: 'Chest up — torso leaning too far forward' },
      ankle:     { low: 'Ankle restricting depth — work on dorsiflexion', high: null },
    },
    phases: ['Setup', 'Descent', 'Bottom', 'Ascent', 'Lockout'],
  },

  deadlift: {
    name: 'Deadlift',
    keyAngles: [
      { id: 'hip_hinge', name: 'Hip Hinge',    indices: [11, 23, 25], target: 60,  tolerance: 15 },
      { id: 'knee_bend', name: 'Knee Angle',   indices: [23, 25, 27], target: 130, tolerance: 20 },
      { id: 'spine',     name: 'Spine Angle',  indices: [23, 11, 0],  target: 50,  tolerance: 15 },
      { id: 'shoulder',  name: 'Shoulder Pos', indices: [23, 11, 13], target: 90,  tolerance: 20 },
    ],
    cueMap: {
      hip_hinge: { low: 'Hip hinge deeper — push hips back', high: 'Hip hinge too far — maintain bar path' },
      knee_bend: { low: 'Sit into the bar — bend knees more', high: 'Knees not tracking correctly' },
      spine:     { low: 'Chest up — neutral spine required', high: 'Excessive lumbar arch' },
      shoulder:  { low: 'Shoulders over the bar', high: 'Shoulders behind the bar — initiate from hip' },
    },
    phases: ['Setup', 'Pull', 'Lockout', 'Lower'],
  },

  push_up: {
    name: 'Push Up',
    keyAngles: [
      { id: 'elbow',    name: 'Elbow Angle',  indices: [11, 13, 15], target: 90,  tolerance: 15 },
      { id: 'hip_pos',  name: 'Hip Plank',    indices: [11, 23, 25], target: 178, tolerance: 10 },
      { id: 'shoulder', name: 'Shoulder ROM', indices: [23, 11, 13], target: 45,  tolerance: 15 },
    ],
    cueMap: {
      elbow:    { low: 'Lower further — full range of motion', high: 'Do not flare elbows excessively' },
      hip_pos:  { low: 'Hips sagging — engage core and glutes', high: 'Hips piking up — maintain plank' },
      shoulder: { low: 'Depress scapulae — retract at bottom', high: null },
    },
    phases: ['Top', 'Descent', 'Bottom', 'Ascent'],
  },

  lunge: {
    name: 'Lunge',
    keyAngles: [
      { id: 'front_knee', name: 'Front Knee',  indices: [23, 25, 27], target: 90,  tolerance: 15 },
      { id: 'back_knee',  name: 'Back Knee',   indices: [24, 26, 28], target: 90,  tolerance: 20 },
      { id: 'torso',      name: 'Torso Upright', indices: [23, 11, 0], target: 85, tolerance: 15 },
    ],
    cueMap: {
      front_knee: { low: 'Step further forward — front knee not at 90°', high: 'Front knee tracking past toes' },
      back_knee:  { low: 'Lower the back knee toward the floor', high: null },
      torso:      { low: 'Keep torso upright — avoid forward lean', high: null },
    },
    phases: ['Stand', 'Step', 'Bottom', 'Drive', 'Return'],
  },

  overhead_press: {
    name: 'Overhead Press',
    keyAngles: [
      { id: 'elbow',    name: 'Elbow Angle',  indices: [11, 13, 15], target: 90,  tolerance: 15 },
      { id: 'shoulder', name: 'Shoulder ROM', indices: [13, 11, 23], target: 170, tolerance: 15 },
      { id: 'lumbar',   name: 'Lumbar Arch',  indices: [11, 23, 25], target: 175, tolerance: 10 },
    ],
    cueMap: {
      elbow:    { low: 'Press fully — lock out overhead', high: 'Elbows flaring too wide' },
      shoulder: { low: 'Full lockout overhead required', high: null },
      lumbar:   { low: null, high: 'Excessive lower back arch — brace harder' },
    },
    phases: ['Rack', 'Press', 'Lockout', 'Lower'],
  },

  vertical_jump: {
    name: 'Vertical Jump',
    keyAngles: [
      { id: 'knee_load',  name: 'Load Depth',   indices: [23, 25, 27], target: 115, tolerance: 20 },
      { id: 'hip_ext',    name: 'Hip Extension', indices: [11, 23, 25], target: 170, tolerance: 10 },
      { id: 'arm_swing',  name: 'Arm Drive',     indices: [23, 11, 13], target: 155, tolerance: 20 },
    ],
    cueMap: {
      knee_load: { low: 'Load deeper — bend knees more in countermovement', high: null },
      hip_ext:   { low: 'Drive through the hip at takeoff', high: null },
      arm_swing: { low: 'Drive arms upward forcefully at takeoff', high: null },
    },
    phases: ['Stand', 'Load', 'Drive', 'Flight', 'Land'],
  },
};

export const DEFAULT_PROFILE_ID = 'back_squat';

export function getCompareProfile(exerciseId) {
  if (!exerciseId) return COMPARE_PROFILES[DEFAULT_PROFILE_ID];
  const key = Object.keys(COMPARE_PROFILES).find(k =>
    exerciseId === k || exerciseId.includes(k) || k.includes(exerciseId)
  );
  return COMPARE_PROFILES[key] || COMPARE_PROFILES[DEFAULT_PROFILE_ID];
}

export function buildMetricsFromAngles(leftAngles, rightAngles, profile) {
  if (!profile?.keyAngles) return [];
  return profile.keyAngles.map(({ id, name, target, tolerance }) => {
    const lAngle = leftAngles?.[id] ?? null;
    const rAngle = rightAngles?.[id] ?? null;
    const diff = (lAngle !== null && rAngle !== null) ? Math.round(lAngle - rAngle) : null;
    const lDev = lAngle !== null ? Math.abs(lAngle - target) : null;
    const severity = lDev === null ? 'none' : lDev > tolerance * 1.5 ? 'fault' : lDev > tolerance ? 'warning' : 'clean';
    return { id, name, leftAngle: lAngle !== null ? Math.round(lAngle) : null, rightAngle: rAngle !== null ? Math.round(rAngle) : null, diff, target, severity };
  });
}

export function buildCuesFromMetrics(metrics, profile) {
  if (!profile?.cueMap) return [];
  const cues = [];
  for (const m of metrics) {
    if (m.severity === 'none' || m.leftAngle === null) continue;
    const cueEntry = profile.cueMap[m.id];
    if (!cueEntry) continue;
    const deviation = m.leftAngle - m.target;
    const text = deviation < 0 ? cueEntry.low : cueEntry.high;
    if (text) cues.push({ id: m.id, text, severity: m.severity });
  }
  return cues.slice(0, 3);
}