/**
 * FaultRuleLibrary — reusable biomechanical fault checks.
 * Each rule: (j, angles, velocities, baseline) → { detected, severity, metric, message, cue }
 * Rules are movement-agnostic and reused across profiles.
 */

const LOW      = 'low';
const MODERATE = 'moderate';
const CRITICAL = 'critical';

function r(detected, severity, metric, message, cue) {
  return { detected: !!detected, severity, metric: metric ?? null, message, cue: cue ?? message };
}

export const FaultRuleLibrary = {

  // ── LOWER BODY ──────────────────────────────────────────────────────────────

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

  shallowDepth(j, angles) {
    const knee = angles?.kneeL ?? null;
    return r(knee != null && knee > 110, MODERATE, knee, 'Sit deeper into the rep');
  },

  hipShift(j, angles) {
    if (!j.l_hip || !j.r_hip) return r(false, LOW, null, 'Centre your hips');
    const shift = Math.abs(j.l_hip.x - j.r_hip.x);
    return r(shift > 0.08, LOW, shift, 'Keep hips square');
  },

  pelvicDrift(j, angles) {
    if (!j.pelvis) return r(false, LOW, null, 'Keep pelvis centred');
    const drift = angles?.pelvisDriftX ?? null;
    return r(drift != null && Math.abs(drift) > 0.06, LOW, drift, 'Keep pelvis level throughout');
  },

  stiffLanding(j, angles) {
    const knee = angles?.kneeL ?? null;
    return r(knee != null && knee > 155, CRITICAL, knee, 'Absorb through your legs on landing');
  },

  valgusLanding(j, angles) {
    if (!j.l_knee || !j.r_knee || !j.l_ankle || !j.r_ankle) return r(false, CRITICAL, null, 'Knees over toes on landing');
    const kneeW  = j.r_knee.x  - j.l_knee.x;
    const ankleW = j.r_ankle.x - j.l_ankle.x;
    const ratio  = ankleW > 0 ? kneeW / ankleW : 1;
    return r(ratio < 0.70, CRITICAL, ratio, 'Land with knees tracking over toes');
  },

  ankleCollapse(j, angles) {
    if (!j.l_ankle || !j.l_knee) return r(false, MODERATE, null, 'Support your arch');
    const collapse = j.l_knee.x - j.l_ankle.x;
    return r(collapse > 0.06, MODERATE, collapse, 'Keep ankle stacked under knee');
  },

  // ── TRUNK / SPINE ───────────────────────────────────────────────────────────

  lumbarFlexion(j, angles) {
    const metric = angles?.torsoLean ?? null;
    return r(metric != null && metric > 30, CRITICAL, metric, 'Maintain neutral spine');
  },

  trunkCollapse(j, angles) {
    if (!j.chest || !j.pelvis) return r(false, MODERATE, null, 'Stay tall through your trunk');
    const drift = Math.abs(j.chest.x - j.pelvis.x);
    return r(drift > 0.12, MODERATE, drift, 'Keep chest over hips');
  },

  excessiveTorsoLean(j, angles) {
    const lean = angles?.torsoLean ?? null;
    return r(lean != null && lean > 20, MODERATE, lean, 'Stay more upright');
  },

  lowerBackArch(j, angles) {
    if (!j.chest || !j.pelvis) return r(false, MODERATE, null, 'Brace your core');
    const arch = j.chest.x - j.pelvis.x;
    return r(arch < -0.08, MODERATE, arch, 'Brace core to prevent arching');
  },

  lateralTrunkShift(j, angles) {
    if (!j.chest || !j.pelvis) return r(false, LOW, null, 'Stay centred');
    const shift = Math.abs(j.chest.x - j.pelvis.x);
    return r(shift > 0.10, LOW, shift, 'Keep trunk upright and centred');
  },

  // ── UPPER BODY ──────────────────────────────────────────────────────────────

  elbowFlare(j, angles) {
    if (!j.l_elbow || !j.l_shoulder) return r(false, MODERATE, null, 'Tuck elbows in');
    const flare = Math.abs(j.l_elbow.x - j.l_shoulder.x);
    return r(flare > 0.14, MODERATE, flare, 'Tuck elbows toward ribs');
  },

  asymmetricPush(j, angles) {
    const asym = angles?.asymmetry?.knee ?? null;
    return r(asym != null && asym > 18, MODERATE, asym, 'Even out left and right side loading');
  },

  shoulderEarlyOpen(j, angles, velocities) {
    if (!velocities?.chest || !velocities?.l_hip) return r(false, CRITICAL, null, 'Hips before hands');
    const detected = Math.abs(velocities.chest.x) > Math.abs(velocities.l_hip.x) * 1.3;
    return r(detected, CRITICAL, null, 'Lead with hips, keep shoulders back');
  },

  poorShoulderPacking(j, angles) {
    if (!j.l_shoulder || !j.neck) return r(false, LOW, null, 'Pack your shoulders');
    const shrug = j.neck.y - j.l_shoulder.y;
    return r(shrug < 0.04, LOW, shrug, 'Pull shoulders away from ears');
  },

  wristBreak(j, angles) {
    if (!j.r_wrist || !j.r_elbow) return r(false, MODERATE, null, 'Keep wrists firm');
    const bend = Math.abs(j.r_wrist.y - j.r_elbow.y);
    return r(bend > 0.08, MODERATE, bend, 'Keep wrists neutral through contact');
  },

  castingHands(j, angles) {
    if (!j.r_wrist || !j.r_elbow) return r(false, CRITICAL, null, 'Hands inside the ball');
    return r(j.r_wrist.x < j.r_elbow.x - 0.06, CRITICAL, null, 'Keep hands inside — avoid casting');
  },

  // ── LOCOMOTION ──────────────────────────────────────────────────────────────

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

  armSwingAsymmetry(j, angles) {
    const sym = angles?.armSwingSymmetry ?? null;
    return r(sym != null && sym < 0.7, LOW, sym, 'Match arm swing left and right');
  },

  narrowStance(j, angles) {
    const stride = angles?.strideLength ?? null;
    return r(stride != null && stride < 0.12, LOW, stride, 'Widen stance slightly');
  },

  // ── ROTATIONAL / SPORTS ─────────────────────────────────────────────────────

  earlyExtension(j, angles) {
    if (!j.pelvis || !j.chest) return r(false, CRITICAL, null, 'Stay in posture');
    const ext = j.pelvis.y - j.chest.y;
    return r(ext < -0.05, CRITICAL, ext, 'Maintain spine angle — avoid early extension');
  },

  sway(j, angles) {
    if (!j.pelvis) return r(false, MODERATE, null, 'Stay centred');
    const drift = angles?.pelvisDriftX ?? null;
    return r(drift != null && Math.abs(drift) > 0.08, MODERATE, drift, 'Minimise lateral hip sway');
  },

  poorHipRotation(j, angles) {
    const rot = angles?.hipRotation ?? null;
    return r(rot != null && Math.abs(rot) < 20, MODERATE, rot, 'Drive from the hips — open up more');
  },

  poorFollowThrough(j, angles) {
    if (!j.r_wrist || !j.pelvis) return r(false, LOW, null, 'Finish through the movement');
    const ext = j.r_wrist.y;
    return r(ext > 0.6, LOW, ext, 'Follow through high — finish the swing');
  },

  hipBeforeShoulderSequence(j, angles) {
    const hipRot  = Math.abs(angles?.hipRotation ?? 0);
    const shrRot  = Math.abs(angles?.shoulderRotation ?? 0);
    return r(hipRot > 0 && shrRot > hipRot * 1.1, CRITICAL, null, 'Let hips lead — delay shoulder turn');
  },

  // ── NEW RULES ───────────────────────────────────────────────────────────────

  buttWink(j, angles) {
    if (!j.pelvis || !j.l_hip) return r(false, CRITICAL, null, 'Neutral pelvis at bottom');
    const tuck = j.pelvis.y - j.l_hip.y;
    return r(tuck < -0.04, CRITICAL, tuck, 'Stop before pelvis tucks under');
  },

  excessiveKneeTravelFwd(j, angles) {
    if (!j.l_knee || !j.l_ankle) return r(false, MODERATE, null, 'Keep shin more vertical');
    const travel = j.l_knee.x - j.l_ankle.x;
    return r(travel < -0.12, MODERATE, travel, 'Drive knee back — more vertical shin');
  },

  barPathDrift(j, angles) {
    if (!j.l_wrist || !j.l_ankle) return r(false, CRITICAL, null, 'Keep bar over mid-foot');
    const drift = Math.abs(j.l_wrist.x - j.l_ankle.x);
    return r(drift > 0.10, CRITICAL, drift, 'Bar stays over mid-foot — keep it close');
  },

  hipRiseBeforeChest(j, angles, velocities) {
    if (!velocities?.l_hip || !velocities?.chest) return r(false, CRITICAL, null, 'Push floor away evenly');
    const hipRising   = velocities.l_hip.y < -0.006;
    const chestStatic = Math.abs(velocities.chest.y) < 0.002;
    return r(hipRising && chestStatic, CRITICAL, null, 'Chest and hips rise together');
  },

  forwardHeadPosture(j, angles) {
    if (!j.nose || !j.neck) return r(false, LOW, null, 'Head neutral');
    const fwd = j.nose.x - j.neck.x;
    return r(fwd > 0.10, LOW, fwd, 'Chin slightly back — neutral neck');
  },

  elbowFlaredOnPull(j, angles) {
    if (!j.l_elbow || !j.l_shoulder || !j.l_wrist) return r(false, MODERATE, null, 'Elbows track back');
    const elbowLat = Math.abs(j.l_elbow.x - j.l_shoulder.x);
    return r(elbowLat > 0.16, MODERATE, elbowLat, 'Drive elbows back and down — not flared');
  },

  incompleteHipLockout(j, angles) {
    const hip = angles?.hipHingeL ?? null;
    return r(hip != null && hip < 165, MODERATE, hip, 'Squeeze glutes — fully extend at top');
  },

  // ── BALANCE / STABILITY ─────────────────────────────────────────────────────

  lossOfBalance(j, angles) {
    const drift = angles?.pelvisDriftX ?? null;
    return r(drift != null && Math.abs(drift) > 0.12, CRITICAL, drift, 'Stay balanced — reset stance');
  },

  trunkRotationLoss(j, angles) {
    const rot = angles?.trunkRotation ?? null;
    return r(rot != null && Math.abs(rot) < 10, LOW, rot, 'Allow natural trunk rotation');
  },

  singleLegStability(j, angles) {
    if (!j.l_knee || !j.l_ankle) return r(false, MODERATE, null, 'Hold your balance');
    const wobble = Math.abs(j.l_knee.x - j.l_ankle.x);
    return r(wobble > 0.07, MODERATE, wobble, 'Control balance over the stance leg');
  },
};