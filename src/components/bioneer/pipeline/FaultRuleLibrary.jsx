/**
 * FaultRuleLibrary — reusable biomechanical fault checks.
 * Each rule is a function (j, angles, velocities, baseline) → { detected, severity, metric, message }
 * Rules are movement-agnostic and reused across profiles.
 */

const LOW      = 'low';
const MODERATE = 'moderate';
const CRITICAL = 'critical';

function r(detected, severity, metric, message) {
  return { detected: !!detected, severity, metric: metric ?? null, message };
}

export const FaultRuleLibrary = {

  kneeValgus(j, angles) {
    if (!j.l_knee || !j.r_knee || !j.l_ankle || !j.r_ankle) return r(false, CRITICAL, null, 'Drive knees out');
    const kneeW  = j.r_knee.x  - j.l_knee.x;
    const ankleW = j.r_ankle.x - j.l_ankle.x;
    const ratio  = ankleW > 0 ? kneeW / ankleW : 1;
    return r(ratio < 0.72, CRITICAL, ratio, 'Drive knees out over toes');
  },

  heelRise(j, angles, velocities, baseline) {
    if (!j.l_ankle || !baseline?.ankleY) return r(false, MODERATE, null, 'Press heels into floor');
    const rise = baseline.ankleY - j.l_ankle.y;
    return r(rise > 0.04, MODERATE, rise, 'Keep heels flat on floor');
  },

  lumbarFlexion(j, angles) {
    const metric = angles?.torsoLean ?? null;
    return r(metric != null && metric > 30, CRITICAL, metric, 'Maintain neutral spine');
  },

  trunkCollapse(j, angles) {
    if (!j.chest || !j.pelvis) return r(false, MODERATE, null, 'Stay tall through your trunk');
    const drift = Math.abs(j.chest.x - j.pelvis.x);
    return r(drift > 0.12, MODERATE, drift, 'Keep chest over hips');
  },

  hipShift(j, angles) {
    if (!j.l_hip || !j.r_hip) return r(false, LOW, null, 'Centre your hips');
    const shift = Math.abs(j.l_hip.x - j.r_hip.x);
    return r(shift > 0.08, LOW, shift, 'Keep hips square');
  },

  elbowFlare(j, angles) {
    if (!j.l_elbow || !j.l_shoulder) return r(false, MODERATE, null, 'Tuck elbows in');
    const flare = Math.abs(j.l_elbow.x - j.l_shoulder.x);
    return r(flare > 0.14, MODERATE, flare, 'Tuck elbows toward ribs');
  },

  shoulderEarlyOpen(j, angles, velocities) {
    if (!velocities?.chest || !velocities?.l_hip) return r(false, CRITICAL, null, 'Hips before hands');
    const detected = Math.abs(velocities.chest.x) > Math.abs(velocities.l_hip.x) * 1.3;
    return r(detected, CRITICAL, null, 'Lead with hips, keep shoulders back');
  },

  overstride(j, angles) {
    if (!j.l_ankle || !j.pelvis) return r(false, CRITICAL, null, 'Land under your hips');
    const dist = Math.abs(j.l_ankle.x - j.pelvis.x);
    return r(dist > 0.22, CRITICAL, dist, 'Shorten stride, land under hips');
  },

  lowKneeDrive(j, angles) {
    if (!j.l_knee || !j.pelvis) return r(false, MODERATE, null, 'Drive knee higher');
    const diff = j.l_knee.y - j.pelvis.y;
    return r(diff > 0.05, MODERATE, diff, 'Drive lead knee up aggressively');
  },

  valgusLanding(j, angles) {
    if (!j.l_knee || !j.r_knee || !j.l_ankle || !j.r_ankle) return r(false, CRITICAL, null, 'Knees over toes on landing');
    const kneeW  = j.r_knee.x  - j.l_knee.x;
    const ankleW = j.r_ankle.x - j.l_ankle.x;
    const ratio  = ankleW > 0 ? kneeW / ankleW : 1;
    return r(ratio < 0.70, CRITICAL, ratio, 'Land with knees tracking over toes');
  },

  asymmetricPush(j, angles) {
    const asym = angles?.asymmetry?.knee ?? null;
    return r(asym != null && asym > 18, MODERATE, asym, 'Even out left and right side loading');
  },

  pelvicDrift(j, angles) {
    if (!j.pelvis) return r(false, LOW, null, 'Keep pelvis centred');
    const drift = angles?.pelvisDriftX ?? null;
    return r(drift != null && Math.abs(drift) > 0.06, LOW, drift, 'Keep pelvis level throughout');
  },
};