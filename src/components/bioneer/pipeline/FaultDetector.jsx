/**
 * FaultDetector — phase-gated per-movement fault checks
 * Rule: NO fault check ever runs outside its defined phase window.
 * All checks read from smoothedJoints and KinematicsEngine angles/velocities.
 */

// ── FAULT MODULES ──────────────────────────────────────────────────────────

const FAULT_MODULES = {

  // ─── BACK SQUAT / SQUAT ──────────────────────────────────────────────────
  back_squat: [
    {
      id: 'knee_valgus', label: 'Knee valgus', cue: 'Drive knees out',
      severity: 'HIGH', isRisk: true,
      phases: ['eccentric','bottom','concentric'],  // squat phases (matches PM_KNEE_SQ)
      check(j, angles) {
        if (!j.l_knee || !j.r_knee || !j.l_ankle || !j.r_ankle) return false;
        const kneeW  = j.r_knee.x  - j.l_knee.x;
        const ankleW = j.r_ankle.x - j.l_ankle.x;
        return ankleW > 0 && (kneeW / ankleW) < 0.72;
      },
    },
    {
      id: 'spine_collapse', label: 'Torso collapse', cue: 'Stay taller',
      severity: 'HIGH', isRisk: true,
      phases: ['eccentric','bottom'],
      check(j, angles) {
        if (!j.chest || !j.pelvis) return false;
        return Math.abs(j.chest.x - j.pelvis.x) > 0.12;
      },
    },
    {
      id: 'shallow_depth', label: 'Shallow depth', cue: 'Sit deeper',
      severity: 'MODERATE', isRisk: false,
      phases: ['bottom'],
      check(j, angles) {
        return angles.kneeL != null && angles.kneeL > 110;
      },
    },
    {
      id: 'heel_rise', label: 'Heel rise', cue: 'Press heels down',
      severity: 'MODERATE', isRisk: false,
      phases: ['eccentric','bottom'],
      check(j, angles, baseline) {
        if (!j.l_ankle || !baseline?.ankleY) return false;
        return j.l_ankle.y < baseline.ankleY - 0.04;
      },
    },
    {
      id: 'asymmetric_load', label: 'Asymmetric loading', cue: 'Even your weight',
      severity: 'MODERATE', isRisk: false,
      phases: ['eccentric','bottom','concentric'],
      check(j, angles) {
        return angles.asymmetry?.knee != null && angles.asymmetry.knee > 18;
      },
    },
    {
      id: 'incomplete_lockout', label: 'Incomplete hip extension', cue: 'Stand tall — lock hips out',
      severity: 'HIGH', isRisk: false,
      phases: ['lockout','concentric'],
      check(j, angles) { return angles.hipHingeL != null && angles.hipHingeL < 168; },
    },
    {
      // Position-based competition depth standard (hip crease at/below top of
      // knee) — distinct from the angle-based 'shallow_depth' check above.
      // Only fires once world/normalized landmarks put the hip clearly above
      // knee height, so it doesn't double up with 'shallow_depth' on borderline reps.
      id: 'insufficient_depth_competition', label: 'Above competition depth', cue: 'Hip crease below knee for a good lift',
      severity: 'MODERATE', isRisk: false,
      phases: ['bottom'],
      check(j, angles) {
        const delta = angles.hipKneeDeltaM ?? angles.hipKneeDeltaNorm ?? null;
        return delta != null && delta < -0.02;
      },
    },
  ],

  // ─── DEADLIFT ─────────────────────────────────────────────────────────────
  deadlift: [
    {
      id: 'rounded_spine', label: 'Rounded spine', cue: 'Keep chest proud',
      severity: 'HIGH', isRisk: true,
      phases: ['hinge_ascent','hinge_descent'],
      check(j, angles) {
        // angles.trunkFwd was never computed by KinematicsEngine (dead check).
        // torsoLean is the closest real metric — degrees of deviation from
        // vertical — using the same >30 threshold FaultRuleLibrary.lumbarFlexion
        // already applies for the same "rounded spine" intent.
        return angles.torsoLean != null && angles.torsoLean > 30;
      },
    },
    {
      id: 'bar_drift', label: 'Bar drifting forward', cue: 'Keep bar close',
      severity: 'HIGH', isRisk: false,
      phases: ['hinge_ascent'],
      check(j, angles) {
        if (!j.l_wrist || !j.l_ankle) return false;
        return Math.abs(j.l_wrist.x - j.l_ankle.x) > 0.10;
      },
    },
    {
      id: 'hips_rise_first', label: 'Hips rising early', cue: 'Push floor away',
      severity: 'MODERATE', isRisk: false,
      phases: ['hinge_ascent'],
      check(j, angles, baseline, velocities) {
        if (!velocities?.l_hip || !velocities?.chest) return false;
        return velocities.l_hip.y < -0.008 && Math.abs(velocities.chest.y) < 0.003;
      },
    },
    {
      id: 'incomplete_lockout', label: 'Incomplete hip extension', cue: 'Drive hips through — full lockout',
      severity: 'HIGH', isRisk: false,
      phases: ['lockout'],
      check(j, angles) { return angles.hipHingeL != null && angles.hipHingeL < 168; },
    },
  ],

  // ─── PUSH-UP ──────────────────────────────────────────────────────────────
  push_up: [
    {
      id: 'hip_sag', label: 'Hips sagging', cue: 'Squeeze core',
      severity: 'HIGH', isRisk: true,
      phases: ['lower','bottom','press'],
      check(j, angles) {
        if (!j.chest || !j.pelvis || !j.l_ankle) return false;
        const bodyLineY = (j.chest.y + j.l_ankle.y) / 2;
        return j.pelvis.y > bodyLineY + 0.06;
      },
    },
    {
      id: 'elbow_flare', label: 'Elbows flaring', cue: 'Tuck elbows in',
      severity: 'MODERATE', isRisk: false,
      phases: ['lower','bottom'],
      check(j, angles) {
        if (!j.l_elbow || !j.l_shoulder) return false;
        return Math.abs(j.l_elbow.x - j.l_shoulder.x) > 0.14;
      },
    },
    {
      id: 'shallow_pushup', label: 'Insufficient depth', cue: 'Go lower',
      severity: 'MODERATE', isRisk: false,
      phases: ['bottom'],
      check(j, angles) {
        return angles.elbowL != null && angles.elbowL > 100;
      },
    },
  ],

  // ─── SPRINT ───────────────────────────────────────────────────────────────
  sprint: [
    {
      id: 'overstride', label: 'Overstriding', cue: 'Land under hips',
      severity: 'HIGH', isRisk: true,
      phases: ['maxvel','transition'],
      check(j, angles) {
        if (!j.l_ankle || !j.pelvis) return false;
        return Math.abs(j.l_ankle.x - j.pelvis.x) > 0.22;
      },
    },
    {
      id: 'low_knee_drive', label: 'Low knee drive', cue: 'Drive knee up',
      severity: 'MODERATE', isRisk: false,
      phases: ['drive','maxvel'],
      check(j, angles) {
        if (!j.l_knee || !j.pelvis) return false;
        return j.l_knee.y > j.pelvis.y + 0.05;
      },
    },
    {
      id: 'trunk_collapse', label: 'Trunk collapse', cue: 'Run tall',
      severity: 'MODERATE', isRisk: false,
      phases: ['drive','maxvel'],
      check(j, angles) {
        if (!j.chest || !j.pelvis) return false;
        return Math.abs(j.chest.x - j.pelvis.x) > 0.10;
      },
    },
  ],

  // ─── BASEBALL SWING ───────────────────────────────────────────────────────
  baseball_swing: [
    {
      id: 'early_shoulder', label: 'Early shoulder opening', cue: 'Hips before hands',
      severity: 'HIGH', isRisk: false,
      phases: ['load','rotation'],
      check(j, angles, baseline, velocities) {
        if (!velocities?.chest || !velocities?.l_hip) return false;
        return Math.abs(velocities.chest.x) > Math.abs(velocities.l_hip.x) * 1.3;
      },
    },
    {
      id: 'casting', label: 'Casting (hands away)', cue: 'Hands inside the ball',
      severity: 'HIGH', isRisk: false,
      phases: ['rotation','finish'],
      check(j, angles) {
        if (!j.r_wrist || !j.r_elbow) return false;
        return j.r_wrist.x < j.r_elbow.x - 0.06;
      },
    },
    {
      id: 'collapse_contact', label: 'Collapsing at contact', cue: 'Stay through the ball',
      severity: 'MODERATE', isRisk: false,
      phases: ['finish'],
      check(j, angles) {
        return angles.kneeL != null && angles.kneeL < 130;
      },
    },
  ],

  // ─── JUMP LANDING ─────────────────────────────────────────────────────────
  jump_landing: [
    {
      id: 'valgus_landing', label: 'Knee collapse on landing', cue: 'Knees over toes',
      severity: 'HIGH', isRisk: true,
      phases: ['contact','absorption'],
      check(j, angles) {
        if (!j.l_knee || !j.r_knee || !j.l_ankle || !j.r_ankle) return false;
        const kneeW  = j.r_knee.x  - j.l_knee.x;
        const ankleW = j.r_ankle.x - j.l_ankle.x;
        return ankleW > 0 && (kneeW / ankleW) < 0.70;
      },
    },
    {
      id: 'stiff_landing', label: 'Stiff landing', cue: 'Absorb through legs',
      severity: 'MODERATE', isRisk: true,
      phases: ['contact'],
      check(j, angles) {
        return angles.kneeL != null && angles.kneeL > 155;
      },
    },
  ],

  // ─── OVERHEAD PRESS ───────────────────────────────────────────────────────
  overhead_press: [
    {
      id: 'back_arch', label: 'Excessive back arch', cue: 'Brace your core',
      severity: 'HIGH', isRisk: true,
      phases: ['drive','lockout'],
      check(j, angles) {
        if (!j.chest || !j.pelvis) return false;
        return Math.abs(j.chest.x - j.pelvis.x) > 0.10;
      },
    },
    {
      id: 'forward_lean', label: 'Bar drifting forward', cue: 'Press over ears',
      severity: 'MODERATE', isRisk: false,
      phases: ['drive'],
      check(j, angles) {
        if (!j.r_wrist || !j.r_shoulder) return false;
        return j.r_wrist.x > j.r_shoulder.x + 0.06;
      },
    },
  ],

  // ─── LUNGE ────────────────────────────────────────────────────────────────
  lunge: [
    {
      id: 'knee_over_toe', label: 'Knee over toe', cue: 'Keep shin vertical',
      severity: 'MODERATE', isRisk: true,
      phases: ['bottom'],
      check(j, angles) {
        if (!j.l_knee || !j.l_ankle) return false;
        return j.l_knee.x < j.l_ankle.x - 0.05;
      },
    },
    {
      id: 'trunk_lean', label: 'Excessive trunk lean', cue: 'Stay upright',
      severity: 'MODERATE', isRisk: false,
      phases: ['step','bottom'],
      check(j, angles) {
        if (!j.chest || !j.pelvis) return false;
        return Math.abs(j.chest.x - j.pelvis.x) > 0.12;
      },
    },
  ],

  // ─── BENT OVER ROW (barbell_row/dumbbell_row/cable_row are orphaned ids with
  // no movement profile — keyed here under bent_over_row, the id that actually
  // resolves via MovementLibraryData.jsx) ────────────────────────────────────
  bent_over_row: [
    {
      id: 'rounded_spine', label: 'Rounded spine', cue: 'Chest proud — flat back',
      severity: 'HIGH', isRisk: true,
      phases: ['pull','peak','lower'],
      check(j, angles) { return angles.torsoLean != null && angles.torsoLean > 30; },
    },
    {
      id: 'elbow_flare', label: 'Elbows flaring out', cue: 'Drive elbows back',
      severity: 'MODERATE', isRisk: false,
      phases: ['pull','peak'],
      check(j, angles) {
        if (!j.l_elbow || !j.l_shoulder) return false;
        return Math.abs(j.l_elbow.x - j.l_shoulder.x) > 0.16;
      },
    },
    {
      id: 'hip_extension', label: 'Standing up on row', cue: 'Maintain hinge angle',
      severity: 'MODERATE', isRisk: false,
      phases: ['pull','peak'],
      check(j, angles) { return angles.hipHingeL != null && angles.hipHingeL > 140; },
    },
  ],

  // ─── LAT PULLDOWN ─────────────────────────────────────────────────────────
  lat_pulldown: [
    {
      id: 'excessive_lean', label: 'Excessive back lean', cue: 'Slight lean only',
      severity: 'MODERATE', isRisk: false,
      phases: ['pull','top'],
      check(j, angles) {
        if (!j.chest || !j.pelvis) return false;
        return Math.abs(j.chest.x - j.pelvis.x) > 0.14;
      },
    },
    {
      id: 'elbow_flare', label: 'Elbows flaring', cue: 'Elbows down and back',
      severity: 'MODERATE', isRisk: false,
      phases: ['pull','top'],
      check(j, angles) {
        if (!j.l_elbow || !j.l_shoulder) return false;
        return Math.abs(j.l_elbow.x - j.l_shoulder.x) > 0.16;
      },
    },
    {
      id: 'short_range', label: 'Insufficient range', cue: 'Full arm extension',
      severity: 'LOW', isRisk: false,
      phases: ['hang','descent'],
      check(j, angles) { return angles.elbowL != null && angles.elbowL < 145; },
    },
  ],

  // ─── DIP ──────────────────────────────────────────────────────────────────
  dip: [
    {
      id: 'elbow_flare', label: 'Elbows flaring wide', cue: 'Elbows track back',
      severity: 'MODERATE', isRisk: true,
      phases: ['dip'],
      check(j, angles) {
        if (!j.l_elbow || !j.l_shoulder) return false;
        return Math.abs(j.l_elbow.x - j.l_shoulder.x) > 0.15;
      },
    },
    {
      id: 'too_deep', label: 'Excessive depth', cue: 'Stop at 90 degrees elbow',
      severity: 'MODERATE', isRisk: true,
      phases: ['dip'],
      check(j, angles) { return angles.elbowL != null && angles.elbowL < 75; },
    },
    {
      id: 'forward_lean', label: 'Excessive forward lean', cue: 'Stay upright for triceps',
      severity: 'LOW', isRisk: false,
      phases: ['dip','drive'],
      check(j, angles) {
        if (!j.chest || !j.pelvis) return false;
        return Math.abs(j.chest.x - j.pelvis.x) > 0.15;
      },
    },
  ],

  // ─── INCLINE BENCH PRESS ──────────────────────────────────────────────────
  incline_bench_press: [
    {
      id: 'elbow_flare', label: 'Elbows flaring', cue: '45-degree elbow angle',
      severity: 'MODERATE', isRisk: true,
      phases: ['lower','bottom'],
      check(j, angles) {
        if (!j.l_elbow || !j.l_shoulder) return false;
        return Math.abs(j.l_elbow.x - j.l_shoulder.x) > 0.14;
      },
    },
    {
      id: 'short_range', label: 'Incomplete press', cue: 'Full elbow lockout',
      severity: 'LOW', isRisk: false,
      phases: ['lockout'],
      check(j, angles) { return angles.elbowL != null && angles.elbowL < 145; },
    },
    {
      id: 'asymmetric_press', label: 'Uneven press', cue: 'Equal force both sides',
      severity: 'MODERATE', isRisk: false,
      phases: ['press','lockout'],
      check(j, angles) {
        return angles.asymmetry?.elbow != null && angles.asymmetry.elbow > 18;
      },
    },
  ],

  // ─── CLOSE GRIP BENCH ─────────────────────────────────────────────────────
  close_grip_bench: [
    {
      id: 'elbow_drift', label: 'Elbows drifting out', cue: 'Tuck elbows tight',
      severity: 'MODERATE', isRisk: true,
      phases: ['lowering','bottom'],
      check(j, angles) {
        if (!j.l_elbow || !j.l_shoulder) return false;
        return Math.abs(j.l_elbow.x - j.l_shoulder.x) > 0.10;
      },
    },
    {
      id: 'shallow_depth', label: 'Shallow rep', cue: 'Touch chest on each rep',
      severity: 'MODERATE', isRisk: false,
      phases: ['bottom'],
      check(j, angles) { return angles.elbowL != null && angles.elbowL > 100; },
    },
    {
      id: 'wrist_break', label: 'Wrists bending back', cue: 'Grip firm — wrists neutral',
      severity: 'MODERATE', isRisk: true,
      phases: ['press','lockout'],
      check(j, angles) {
        if (!j.r_wrist || !j.r_elbow) return false;
        return Math.abs(j.r_wrist.y - j.r_elbow.y) > 0.08;
      },
    },
  ],

  // ─── OVERHEAD SQUAT ───────────────────────────────────────────────────────
  overhead_squat: [
    {
      id: 'arm_collapse', label: 'Arms caving forward', cue: 'Press bar to ceiling',
      severity: 'HIGH', isRisk: true,
      phases: ['descent','bottom','ascent'],
      check(j, angles) { return angles.elbowL != null && angles.elbowL < 155; },
    },
    {
      id: 'shallow_depth', label: 'Shallow depth', cue: 'Squat below parallel',
      severity: 'MODERATE', isRisk: false,
      phases: ['bottom'],
      check(j, angles) { return angles.kneeL != null && angles.kneeL > 110; },
    },
    {
      id: 'knee_valgus', label: 'Knee valgus', cue: 'Drive knees over toes',
      severity: 'HIGH', isRisk: true,
      phases: ['descent','bottom','ascent'],
      check(j, angles) {
        if (!j.l_knee || !j.r_knee || !j.l_ankle || !j.r_ankle) return false;
        const kneeW = j.r_knee.x - j.l_knee.x;
        const ankleW = j.r_ankle.x - j.l_ankle.x;
        return ankleW > 0 && (kneeW / ankleW) < 0.72;
      },
    },
  ],

  // ─── SINGLE LEG SQUAT ─────────────────────────────────────────────────────
  single_leg_squat: [
    {
      id: 'knee_valgus', label: 'Knee valgus', cue: 'Knee tracks over toe',
      severity: 'HIGH', isRisk: true,
      phases: ['descent','bottom','ascent'],
      check(j, angles) {
        if (!j.l_knee || !j.l_ankle) return false;
        return j.l_knee.x < j.l_ankle.x - 0.06;
      },
    },
    {
      id: 'hip_drop', label: 'Hip dropping', cue: 'Level hips throughout',
      severity: 'HIGH', isRisk: true,
      phases: ['descent','bottom'],
      check(j, angles) {
        if (!j.l_hip || !j.r_hip) return false;
        return Math.abs(j.l_hip.y - j.r_hip.y) > 0.06;
      },
    },
    {
      id: 'trunk_lean', label: 'Excessive trunk lean', cue: 'Stay upright',
      severity: 'MODERATE', isRisk: false,
      phases: ['descent','bottom'],
      check(j, angles) {
        if (!j.chest || !j.pelvis) return false;
        return Math.abs(j.chest.x - j.pelvis.x) > 0.12;
      },
    },
  ],

  // ─── BOX JUMP ─────────────────────────────────────────────────────────────
  box_jump: [
    {
      id: 'valgus_landing', label: 'Knee valgus on landing', cue: 'Land with knees out',
      severity: 'HIGH', isRisk: true,
      phases: ['land','absorb'],
      check(j, angles) {
        if (!j.l_knee || !j.r_knee || !j.l_ankle || !j.r_ankle) return false;
        const kneeW = j.r_knee.x - j.l_knee.x;
        const ankleW = j.r_ankle.x - j.l_ankle.x;
        return ankleW > 0 && (kneeW / ankleW) < 0.70;
      },
    },
    {
      id: 'stiff_landing', label: 'Stiff landing', cue: 'Absorb through legs',
      severity: 'MODERATE', isRisk: true,
      phases: ['land'],
      check(j, angles) { return angles.kneeL != null && angles.kneeL > 155; },
    },
    {
      id: 'shallow_load', label: 'Shallow takeoff load', cue: 'Dip deeper before jumping',
      severity: 'LOW', isRisk: false,
      phases: ['load'],
      check(j, angles) { return angles.kneeL != null && angles.kneeL > 130; },
    },
  ],

  // ─── LATERAL BOUND ────────────────────────────────────────────────────────
  lateral_bound: [
    {
      id: 'valgus_landing', label: 'Knee valgus on landing', cue: 'Knee tracks over toe',
      severity: 'HIGH', isRisk: true,
      phases: ['land','absorb'],
      check(j, angles) {
        if (!j.l_knee || !j.l_ankle) return false;
        return j.l_knee.x < j.l_ankle.x - 0.06;
      },
    },
    {
      id: 'balance_loss', label: 'Lost balance on land', cue: 'Stick each landing',
      severity: 'MODERATE', isRisk: false,
      phases: ['absorb'],
      check(j, angles) {
        const drift = angles?.pelvisDriftX ?? null;
        return drift != null && Math.abs(drift) > 0.12;
      },
    },
    {
      id: 'upright_trunk', label: 'Trunk too upright at takeoff', cue: 'Slight forward lean on push',
      severity: 'LOW', isRisk: false,
      phases: ['takeoff'],
      check(j, angles) {
        if (!j.chest || !j.pelvis) return false;
        return Math.abs(j.chest.x - j.pelvis.x) < 0.03;
      },
    },
  ],

  // ─── GOOD MORNING ─────────────────────────────────────────────────────────
  good_morning: [
    {
      id: 'rounded_spine', label: 'Rounded spine', cue: 'Neutral spine throughout',
      severity: 'HIGH', isRisk: true,
      phases: ['hinge','bottom'],
      check(j, angles) { return angles.torsoLean != null && angles.torsoLean > 30; },
    },
    {
      id: 'knee_bend', label: 'Excessive knee bend', cue: 'Soft knee — not a squat',
      severity: 'MODERATE', isRisk: false,
      phases: ['hinge','bottom'],
      check(j, angles) { return angles.kneeL != null && angles.kneeL < 140; },
    },
    {
      id: 'incomplete_lockout', label: 'Incomplete hip extension', cue: 'Stand fully at top',
      severity: 'HIGH', isRisk: false,
      phases: ['lockout'],
      check(j, angles) { return angles.hipHingeL != null && angles.hipHingeL < 168; },
    },
  ],

  // ─── NORDIC CURL ──────────────────────────────────────────────────────────
  nordic_curl: [
    {
      id: 'hip_flexion', label: 'Hips breaking forward', cue: 'Keep hips extended',
      severity: 'HIGH', isRisk: true,
      phases: ['lower','bottom'],
      check(j, angles) { return angles.hipHingeL != null && angles.hipHingeL < 155; },
    },
    {
      id: 'lateral_shift', label: 'Lateral trunk shift', cue: 'Stay centred',
      severity: 'MODERATE', isRisk: false,
      phases: ['lower','bottom'],
      check(j, angles) {
        if (!j.chest || !j.pelvis) return false;
        return Math.abs(j.chest.x - j.pelvis.x) > 0.10;
      },
    },
    {
      id: 'fast_descent', label: 'Uncontrolled descent', cue: 'Slow and controlled lower',
      severity: 'MODERATE', isRisk: false,
      phases: ['lower'],
      check(j, angles, baseline, velocities) {
        if (!velocities?.l_knee) return false;
        return Math.abs(velocities.l_knee.y) > 0.020;
      },
    },
  ],

  // ─── BIRD DOG ─────────────────────────────────────────────────────────────
  bird_dog: [
    {
      id: 'hip_rotation', label: 'Hip rotating out', cue: 'Keep hips level and square',
      severity: 'MODERATE', isRisk: false,
      phases: ['extend','hold'],
      check(j, angles) {
        if (!j.l_hip || !j.r_hip) return false;
        return Math.abs(j.l_hip.y - j.r_hip.y) > 0.06;
      },
    },
    {
      id: 'lumbar_extension', label: 'Lower back arching', cue: 'Neutral spine throughout',
      severity: 'HIGH', isRisk: true,
      phases: ['extend','hold'],
      check(j, angles) {
        if (!j.chest || !j.pelvis) return false;
        return j.chest.x - j.pelvis.x < -0.08;
      },
    },
    {
      id: 'short_extension', label: 'Insufficient hip extension', cue: 'Extend fully at top',
      severity: 'LOW', isRisk: false,
      phases: ['hold'],
      check(j, angles) { return angles.hipHingeL != null && angles.hipHingeL < 150; },
    },
  ],

  // ─── DEAD BUG ─────────────────────────────────────────────────────────────
  dead_bug: [
    {
      id: 'back_arch', label: 'Lower back lifting', cue: 'Press lower back into floor',
      severity: 'HIGH', isRisk: true,
      phases: ['extend','return'],
      check(j, angles) {
        if (!j.chest || !j.pelvis) return false;
        return j.chest.x - j.pelvis.x < -0.08;
      },
    },
    {
      id: 'hip_hike', label: 'Hip hiking', cue: 'Keep hips level',
      severity: 'MODERATE', isRisk: false,
      phases: ['extend'],
      check(j, angles) {
        if (!j.l_hip || !j.r_hip) return false;
        return Math.abs(j.l_hip.y - j.r_hip.y) > 0.06;
      },
    },
    {
      id: 'fast_movement', label: 'Too fast — losing tension', cue: 'Slow and controlled',
      severity: 'LOW', isRisk: false,
      phases: ['extend','return'],
      check(j, angles, baseline, velocities) {
        if (!velocities?.l_knee) return false;
        return Math.abs(velocities.l_knee.y) > 0.018;
      },
    },
  ],

  // ─── HANGING KNEE RAISE ───────────────────────────────────────────────────
  hanging_knee_raise: [
    {
      id: 'swing', label: 'Swinging for momentum', cue: 'Control — no swing',
      severity: 'MODERATE', isRisk: false,
      phases: ['raise','lower'],
      check(j, angles, baseline, velocities) {
        if (!velocities?.pelvis) return false;
        return Math.abs(velocities.pelvis.x) > 0.015;
      },
    },
    {
      id: 'shallow_raise', label: 'Insufficient range', cue: 'Raise knees to parallel',
      severity: 'MODERATE', isRisk: false,
      phases: ['top'],
      check(j, angles) { return angles.hipHingeL != null && angles.hipHingeL > 115; },
    },
    {
      id: 'shoulder_shrug', label: 'Shoulders shrugging', cue: 'Pack shoulders down',
      severity: 'LOW', isRisk: false,
      phases: ['raise','lower'],
      check(j, angles) {
        if (!j.l_shoulder || !j.neck) return false;
        return j.neck.y - j.l_shoulder.y < 0.04;
      },
    },
  ],

  // ─── SPRINT ACCELERATION ──────────────────────────────────────────────────
  sprint_acceleration: [
    {
      id: 'overstride', label: 'Overstriding', cue: 'Push ground back — don\'t reach',
      severity: 'HIGH', isRisk: true,
      phases: ['drive','flight'],
      check(j, angles) {
        if (!j.l_ankle || !j.pelvis) return false;
        return Math.abs(j.l_ankle.x - j.pelvis.x) > 0.22;
      },
    },
    {
      id: 'low_knee_drive', label: 'Low knee drive', cue: 'Drive knee to 90 degrees',
      severity: 'MODERATE', isRisk: false,
      phases: ['drive'],
      check(j, angles) {
        if (!j.l_knee || !j.pelvis) return false;
        return j.l_knee.y > j.pelvis.y + 0.05;
      },
    },
    {
      id: 'upright_torso', label: 'Too upright', cue: '45-degree forward lean',
      severity: 'MODERATE', isRisk: false,
      phases: ['drive','stance'],
      check(j, angles) {
        if (!j.chest || !j.pelvis) return false;
        return Math.abs(j.chest.x - j.pelvis.x) < 0.04;
      },
    },
  ],

  // ─── BENCH PRESS ──────────────────────────────────────────────────────────
  bench_press: [
    {
      id: 'elbow_flare', label: 'Elbows flaring', cue: 'Tuck elbows 45 degrees',
      severity: 'HIGH', isRisk: true,
      phases: ['lower', 'bottom', 'press'],
      check(j, angles) {
        if (!j.l_elbow || !j.l_shoulder) return false;
        return Math.abs(j.l_elbow.x - j.l_shoulder.x) > 0.18;
      },
    },
    {
      id: 'bar_path', label: 'Uneven bar path', cue: 'Drive evenly — both sides',
      severity: 'MODERATE', isRisk: false,
      phases: ['press', 'lower'],
      check(j, angles) {
        if (!j.l_wrist || !j.r_wrist) return false;
        return Math.abs(j.l_wrist.y - j.r_wrist.y) > 0.07;
      },
    },
    {
      id: 'shallow_press', label: 'Insufficient depth', cue: 'Touch chest — full range',
      severity: 'MODERATE', isRisk: false,
      phases: ['bottom'],
      check(j, angles) {
        return angles.elbowL != null && angles.elbowL > 95;
      },
    },
    {
      id: 'chest_contact_missed', label: 'Bar not reaching chest', cue: 'Lower bar to chest — full ROM',
      severity: 'MODERATE', isRisk: false,
      phases: ['bottom'],
      check(j, angles) {
        if (!j.l_wrist || !j.chest) return false;
        return j.l_wrist.y < j.chest.y - 0.05;
      },
    },
    {
      id: 'wrist_break', label: 'Wrists breaking back', cue: 'Stack wrists — neutral',
      severity: 'MODERATE', isRisk: true,
      phases: ['press', 'lower', 'bottom'],
      check(j, angles) {
        if (!j.l_wrist || !j.l_elbow) return false;
        return j.l_wrist.y < j.l_elbow.y - 0.06;
      },
    },
  ],

  // ─── PULL-UP ──────────────────────────────────────────────────────────────
  pull_up: [
    {
      id: 'kipping', label: 'Excessive kipping', cue: 'Dead hang — control it',
      severity: 'MODERATE', isRisk: false,
      phases: ['pull', 'descent'],
      check(j, angles) {
        if (!j.pelvis || !j.chest) return false;
        return Math.abs(j.pelvis.x - j.chest.x) > 0.12;
      },
    },
    {
      id: 'chin_below_bar', label: 'Not reaching top', cue: 'Pull chin over the bar',
      severity: 'MODERATE', isRisk: false,
      phases: ['top'],
      check(j, angles) {
        if (!j.l_ear || !j.l_wrist) return false;
        return j.l_ear.y > j.l_wrist.y + 0.04;
      },
    },
    {
      id: 'elbow_width', label: 'Elbows too wide', cue: 'Drive elbows down — not out',
      severity: 'LOW', isRisk: false,
      phases: ['pull', 'top'],
      check(j, angles) {
        if (!j.l_elbow || !j.r_elbow || !j.l_shoulder || !j.r_shoulder) return false;
        const shoulderWidth = Math.abs(j.l_shoulder.x - j.r_shoulder.x);
        const elbowWidth = Math.abs(j.l_elbow.x - j.r_elbow.x);
        return elbowWidth > shoulderWidth * 1.6;
      },
    },
  ],

  // ─── REVERSE LUNGE ────────────────────────────────────────────────────────
  reverse_lunge: [
    {
      id: 'knee_cave', label: 'Front knee caving in', cue: 'Push knee out',
      severity: 'HIGH', isRisk: true,
      phases: ['descent', 'bottom'],
      check(j, angles) {
        if (!j.l_knee || !j.l_hip || !j.l_ankle) return false;
        const midX = (j.l_hip.x + j.l_ankle.x) / 2;
        return j.l_knee.x < midX - 0.06;
      },
    },
    {
      id: 'trunk_lean', label: 'Excessive forward lean', cue: 'Chest up — stay tall',
      severity: 'MODERATE', isRisk: false,
      phases: ['descent', 'bottom'],
      check(j, angles) {
        if (!j.chest || !j.pelvis) return false;
        return Math.abs(j.chest.x - j.pelvis.x) > 0.11;
      },
    },
    {
      id: 'back_knee_height', label: 'Back knee not lowering', cue: 'Lower back knee toward floor',
      severity: 'LOW', isRisk: false,
      phases: ['bottom'],
      check(j, angles) {
        return angles.kneeR != null && angles.kneeR < 130;
      },
    },
  ],

  // ─── BULGARIAN SPLIT SQUAT ────────────────────────────────────────────────
  bulgarian_split_squat: [
    {
      id: 'knee_cave', label: 'Front knee caving', cue: 'Drive knee out over toes',
      severity: 'HIGH', isRisk: true,
      phases: ['descent', 'bottom'],
      check(j, angles) {
        if (!j.l_knee || !j.l_hip || !j.l_ankle) return false;
        const midX = (j.l_hip.x + j.l_ankle.x) / 2;
        return j.l_knee.x < midX - 0.07;
      },
    },
    {
      id: 'forward_lean', label: 'Excessive forward lean', cue: 'Torso upright — chin up',
      severity: 'MODERATE', isRisk: false,
      phases: ['descent', 'bottom'],
      check(j, angles) {
        if (!j.chest || !j.pelvis) return false;
        return Math.abs(j.chest.x - j.pelvis.x) > 0.13;
      },
    },
    {
      id: 'depth', label: 'Insufficient depth', cue: 'Lower until thigh is parallel',
      severity: 'MODERATE', isRisk: false,
      phases: ['bottom'],
      check(j, angles) {
        return angles.kneeL != null && angles.kneeL > 110;
      },
    },
  ],

  // ─── PLANK ────────────────────────────────────────────────────────────────
  plank: [
    {
      id: 'hip_sag', label: 'Hips sagging', cue: 'Squeeze glutes — lift hips',
      severity: 'HIGH', isRisk: true,
      phases: ['bottom'],
      check(j, angles) {
        if (!j.chest || !j.pelvis || !j.l_ankle) return false;
        const bodyLineY = (j.chest.y + j.l_ankle.y) / 2;
        return j.pelvis.y > bodyLineY + 0.07;
      },
    },
    {
      id: 'hip_pike', label: 'Hips too high', cue: 'Lower hips — keep body flat',
      severity: 'MODERATE', isRisk: false,
      phases: ['bottom'],
      check(j, angles) {
        if (!j.chest || !j.pelvis || !j.l_ankle) return false;
        const bodyLineY = (j.chest.y + j.l_ankle.y) / 2;
        return j.pelvis.y < bodyLineY - 0.07;
      },
    },
    {
      id: 'head_drop', label: 'Head dropping', cue: 'Neutral spine — eyes down',
      severity: 'LOW', isRisk: false,
      phases: ['bottom'],
      check(j, angles) {
        if (!j.l_ear || !j.chest) return false;
        return j.l_ear.y > j.chest.y + 0.08;
      },
    },
  ],

  // ─── WALKING LUNGE ────────────────────────────────────────────────────────
  walking_lunge: [
    {
      id: 'knee_over_toe', label: 'Knee over toe', cue: 'Keep shin vertical',
      severity: 'MODERATE', isRisk: true,
      phases: ['bottom'],
      check(j, angles) {
        if (!j.l_knee || !j.l_ankle) return false;
        return j.l_knee.x < j.l_ankle.x - 0.05;
      },
    },
    {
      id: 'knee_cave', label: 'Knee caving in', cue: 'Push knee out over toes',
      severity: 'HIGH', isRisk: true,
      phases: ['descent', 'bottom'],
      check(j, angles) {
        if (!j.l_knee || !j.l_hip || !j.l_ankle) return false;
        const midX = (j.l_hip.x + j.l_ankle.x) / 2;
        return j.l_knee.x < midX - 0.06;
      },
    },
    {
      id: 'short_stride', label: 'Stride too short', cue: 'Step further forward',
      severity: 'LOW', isRisk: false,
      phases: ['bottom'],
      check(j, angles) {
        if (!j.l_ankle || !j.r_ankle) return false;
        return Math.abs(j.l_ankle.x - j.r_ankle.x) < 0.15;
      },
    },
  ],

  // ─── LATERAL SHUFFLE ──────────────────────────────────────────────────────
  lateral_shuffle: [
    {
      id: 'stance_too_high', label: 'Standing too tall', cue: 'Stay low in athletic stance',
      severity: 'MODERATE', isRisk: false,
      phases: ['stance','drive'],
      check(j, angles) { return angles.kneeL != null && angles.kneeL > 155; },
    },
    {
      id: 'feet_crossing', label: 'Feet too close together', cue: 'Keep shoulder-width base',
      severity: 'MODERATE', isRisk: true,
      phases: ['contact'],
      check(j, angles) {
        if (!j.l_ankle || !j.r_ankle) return false;
        return Math.abs(j.l_ankle.x - j.r_ankle.x) < 0.08;
      },
    },
    {
      id: 'trunk_bounce', label: 'Trunk bouncing', cue: 'Smooth head height — stay level',
      severity: 'LOW', isRisk: false,
      phases: ['drive','contact'],
      check(j, angles, baseline, velocities) {
        if (!velocities?.chest) return false;
        return Math.abs(velocities.chest.y) > 0.015;
      },
    },
  ],

  // ─── GLUTE BRIDGE / HIP THRUST ───────────────────────────────────────────
  glute_bridge: [
    {
      id: 'incomplete_extension', label: 'Incomplete hip extension', cue: 'Drive hips higher — squeeze glutes',
      severity: 'HIGH', isRisk: false,
      phases: ['lockout', 'hinge_ascent'],
      check(j, angles) { return angles.hipHingeL != null && angles.hipHingeL < 168; },
    },
    {
      id: 'asymmetric_bridge', label: 'Hips not level', cue: 'Drive both hips equally',
      severity: 'MODERATE', isRisk: false,
      phases: ['lockout', 'hinge_ascent'],
      check(j, angles) {
        if (!j.l_hip || !j.r_hip) return false;
        return Math.abs(j.l_hip.y - j.r_hip.y) > 0.05;
      },
    },
    {
      id: 'knee_cave', label: 'Knees caving in', cue: 'Push knees apart',
      severity: 'MODERATE', isRisk: true,
      phases: ['hinge_ascent', 'lockout'],
      check(j, angles) {
        if (!j.l_knee || !j.r_knee || !j.l_ankle || !j.r_ankle) return false;
        const kneeW  = j.r_knee.x  - j.l_knee.x;
        const ankleW = j.r_ankle.x - j.l_ankle.x;
        return ankleW > 0 && (kneeW / ankleW) < 0.72;
      },
    },
    {
      id: 'lumbar_hyperextension', label: 'Lower back overarching', cue: 'Rib cage down at top',
      severity: 'MODERATE', isRisk: true,
      phases: ['lockout'],
      check(j, angles) {
        if (!j.chest || !j.pelvis) return false;
        return j.chest.x - j.pelvis.x < -0.08;
      },
    },
  ],

  // ─── CROSSFIT / HYROX ───────────────────────────────────────────────────────
  // Phase strings below match each movement's real phaseMap in
  // MovementLibraryData.jsx (PM_KNEE_SQ / PM_LOCO / PM_HIP_HINGE / PM_V_PULL) —
  // see the phase-gating fix earlier this session for why that matters.
  wall_ball: [
    {
      id: 'knee_valgus', label: 'Knee valgus', cue: 'Drive knees out',
      severity: 'HIGH', isRisk: true,
      phases: ['eccentric', 'bottom'],
      check(j, angles) {
        if (!j.l_knee || !j.r_knee || !j.l_ankle || !j.r_ankle) return false;
        const kneeW  = j.r_knee.x  - j.l_knee.x;
        const ankleW = j.r_ankle.x - j.l_ankle.x;
        return ankleW > 0 && (kneeW / ankleW) < 0.72;
      },
    },
    {
      id: 'shallow_catch', label: 'Shallow catch depth', cue: 'Sit deeper into the catch',
      severity: 'MODERATE', isRisk: false,
      phases: ['bottom'],
      check(j, angles) { return angles.kneeL != null && angles.kneeL > 115; },
    },
    {
      id: 'incomplete_extension', label: 'Released below full extension', cue: 'Fully extend before release',
      severity: 'MODERATE', isRisk: false,
      phases: ['concentric', 'lockout'],
      check(j, angles) { return angles.elbowL != null && angles.elbowL < 160; },
    },
  ],

  thruster: [
    {
      id: 'knee_valgus', label: 'Knee valgus', cue: 'Drive knees out',
      severity: 'HIGH', isRisk: true,
      phases: ['eccentric', 'bottom'],
      check(j, angles) {
        if (!j.l_knee || !j.r_knee || !j.l_ankle || !j.r_ankle) return false;
        const kneeW  = j.r_knee.x  - j.l_knee.x;
        const ankleW = j.r_ankle.x - j.l_ankle.x;
        return ankleW > 0 && (kneeW / ankleW) < 0.72;
      },
    },
    {
      id: 'spine_collapse', label: 'Torso collapse', cue: 'Stay taller out of the squat',
      severity: 'HIGH', isRisk: true,
      phases: ['eccentric', 'bottom'],
      check(j, angles) {
        if (!j.chest || !j.pelvis) return false;
        return Math.abs(j.chest.x - j.pelvis.x) > 0.12;
      },
    },
    {
      id: 'incomplete_lockout', label: 'Incomplete overhead lockout', cue: 'Punch the bar fully overhead',
      severity: 'MODERATE', isRisk: false,
      phases: ['concentric', 'lockout'],
      check(j, angles) { return angles.elbowR != null && angles.elbowR < 160; },
    },
  ],

  sled_push: [
    {
      id: 'asymmetric_drive', label: 'Uneven drive', cue: 'Push evenly through both legs',
      severity: 'MODERATE', isRisk: false,
      phases: ['drive', 'contact'],
      check(j, angles) { return angles.asymmetry?.knee != null && angles.asymmetry.knee > 18; },
    },
    {
      id: 'knee_valgus', label: 'Knee valgus', cue: 'Knees track over toes',
      severity: 'MODERATE', isRisk: true,
      phases: ['drive'],
      check(j, angles) {
        if (!j.l_knee || !j.r_knee || !j.l_ankle || !j.r_ankle) return false;
        const kneeW  = j.r_knee.x  - j.l_knee.x;
        const ankleW = j.r_ankle.x - j.l_ankle.x;
        return ankleW > 0 && (kneeW / ankleW) < 0.72;
      },
    },
  ],

  sled_pull: [
    {
      id: 'asymmetric_pull', label: 'Uneven pull', cue: 'Pull evenly through both legs',
      severity: 'MODERATE', isRisk: false,
      phases: ['drive', 'contact'],
      check(j, angles) { return angles.asymmetry?.knee != null && angles.asymmetry.knee > 18; },
    },
    {
      id: 'knee_valgus', label: 'Knee valgus', cue: 'Knees track over toes',
      severity: 'MODERATE', isRisk: true,
      phases: ['drive'],
      check(j, angles) {
        if (!j.l_knee || !j.r_knee || !j.l_ankle || !j.r_ankle) return false;
        const kneeW  = j.r_knee.x  - j.l_knee.x;
        const ankleW = j.r_ankle.x - j.l_ankle.x;
        return ankleW > 0 && (kneeW / ankleW) < 0.72;
      },
    },
  ],

  toes_to_bar: [
    {
      id: 'excessive_swing', label: 'Excessive kip swing', cue: 'Control the swing before you pull',
      severity: 'MODERATE', isRisk: false,
      phases: ['hinge_descent', 'hinge_ascent'],
      check(j, angles) {
        const drift = angles?.pelvisDriftX ?? null;
        return drift != null && Math.abs(drift) > 0.12;
      },
    },
    {
      id: 'shallow_raise', label: "Toes not reaching the bar", cue: 'Drive toes all the way to the bar',
      severity: 'LOW', isRisk: false,
      phases: ['hinge_bottom'],
      check(j, angles) { return angles.hipHingeL != null && angles.hipHingeL > 35; },
    },
  ],

  rowing_erg: [
    {
      id: 'rounded_back', label: 'Rounded back on the drive', cue: 'Flat back through the drive',
      severity: 'HIGH', isRisk: true,
      phases: ['hinge_ascent'],
      check(j, angles) { return angles.torsoLean != null && angles.torsoLean > 30; },
    },
    {
      id: 'collapsed_finish', label: 'Collapsing at the finish', cue: 'Stay tall at the finish',
      severity: 'MODERATE', isRisk: false,
      phases: ['lockout'],
      check(j, angles) {
        if (!j.chest || !j.pelvis) return false;
        return Math.abs(j.chest.x - j.pelvis.x) > 0.12;
      },
    },
  ],

  muscle_up: [
    {
      id: 'asymmetric_pull', label: 'Uneven pull', cue: 'Pull evenly through both arms',
      severity: 'MODERATE', isRisk: false,
      phases: ['descent', 'pull'],
      check(j, angles) {
        if (angles.elbowL == null || angles.elbowR == null) return false;
        const avg = (angles.elbowL + angles.elbowR) / 2;
        return avg > 0 && (Math.abs(angles.elbowL - angles.elbowR) / avg) * 100 > 18;
      },
    },
    {
      id: 'excessive_kip', label: 'Excessive kip before the pull', cue: 'Settle the swing before pulling',
      severity: 'LOW', isRisk: false,
      phases: ['hang'],
      check(j, angles) {
        const drift = angles?.pelvisDriftX ?? null;
        return drift != null && Math.abs(drift) > 0.12;
      },
    },
    {
      id: 'incomplete_lockout', label: 'Incomplete support lockout', cue: 'Press out to full lockout at the top',
      severity: 'MODERATE', isRisk: false,
      phases: ['top'],
      check(j, angles) { return angles.elbowL != null && angles.elbowL < 160; },
    },
  ],

  // ─── SELF-DEFENSE / KICKBOXING ──────────────────────────────────────────────
  // Phase strings match PM_STRIKE_ARM / PM_STRIKE_LEG / PM_KNEE_STRIKE in
  // MovementLibraryData.jsx: guard/retract/chamber/extend/impact for strikes,
  // stance/drive/impact/reset/stance for the knee strike.
  jab: [
    {
      id: 'guard_drop', label: 'Guard dropping', cue: 'Rear hand stays up',
      severity: 'MODERATE', isRisk: false,
      phases: ['chamber', 'extend', 'impact'],
      check(j, angles) {
        if (!j.l_shoulder || !j.neck) return false;
        return j.neck.y - j.l_shoulder.y < 0.04;
      },
    },
    {
      id: 'head_exposed', label: 'Chin exposed', cue: 'Chin down behind the shoulder',
      severity: 'MODERATE', isRisk: false,
      phases: ['extend', 'impact'],
      check(j, angles) {
        if (!j.nose || !j.neck) return false;
        return j.nose.x - j.neck.x > 0.10;
      },
    },
  ],

  cross: [
    {
      id: 'guard_drop', label: 'Guard dropping', cue: 'Lead hand stays up',
      severity: 'MODERATE', isRisk: false,
      phases: ['chamber', 'extend', 'impact'],
      check(j, angles) {
        if (!j.l_shoulder || !j.neck) return false;
        return j.neck.y - j.l_shoulder.y < 0.04;
      },
    },
    {
      id: 'head_exposed', label: 'Chin exposed', cue: 'Head stays level through the rotation',
      severity: 'MODERATE', isRisk: false,
      phases: ['extend', 'impact'],
      check(j, angles) {
        if (!j.nose || !j.neck) return false;
        return j.nose.x - j.neck.x > 0.10;
      },
    },
  ],

  hook: [
    {
      id: 'guard_drop', label: 'Guard dropping', cue: 'Rear hand stays up',
      severity: 'MODERATE', isRisk: false,
      phases: ['chamber', 'extend', 'impact'],
      check(j, angles) {
        if (!j.l_shoulder || !j.neck) return false;
        return j.neck.y - j.l_shoulder.y < 0.04;
      },
    },
    {
      id: 'head_exposed', label: 'Chin exposed', cue: 'Chin tucked through the arc',
      severity: 'MODERATE', isRisk: false,
      phases: ['extend', 'impact'],
      check(j, angles) {
        if (!j.nose || !j.neck) return false;
        return j.nose.x - j.neck.x > 0.10;
      },
    },
  ],

  uppercut: [
    {
      id: 'guard_drop', label: 'Guard dropping', cue: 'Lead hand stays up',
      severity: 'MODERATE', isRisk: false,
      phases: ['chamber', 'extend', 'impact'],
      check(j, angles) {
        if (!j.l_shoulder || !j.neck) return false;
        return j.neck.y - j.l_shoulder.y < 0.04;
      },
    },
    {
      id: 'head_exposed', label: 'Chin exposed', cue: 'Drive up through the legs, not just the arm',
      severity: 'MODERATE', isRisk: false,
      phases: ['extend', 'impact'],
      check(j, angles) {
        if (!j.nose || !j.neck) return false;
        return j.nose.x - j.neck.x > 0.10;
      },
    },
  ],

  front_kick: [
    {
      id: 'loss_of_balance', label: 'Losing balance on the kick', cue: 'Post the base leg firmly',
      severity: 'MODERATE', isRisk: false,
      phases: ['extend', 'impact'],
      check(j, angles) {
        const drift = angles?.pelvisDriftX ?? null;
        return drift != null && Math.abs(drift) > 0.12;
      },
    },
    {
      id: 'head_drop', label: 'Chin dropping off target', cue: 'Eyes on target, chin level',
      severity: 'LOW', isRisk: false,
      phases: ['extend', 'impact'],
      check(j, angles) {
        if (!j.nose || !j.neck) return false;
        return j.nose.x - j.neck.x > 0.10;
      },
    },
  ],

  roundhouse_kick: [
    {
      id: 'loss_of_balance', label: 'Losing balance on the kick', cue: "Pivot the base foot — don't reach off-balance",
      severity: 'MODERATE', isRisk: false,
      phases: ['extend', 'impact'],
      check(j, angles) {
        const drift = angles?.pelvisDriftX ?? null;
        return drift != null && Math.abs(drift) > 0.12;
      },
    },
    {
      id: 'head_drop', label: 'Chin dropping', cue: 'Keep chin down through the rotation',
      severity: 'LOW', isRisk: false,
      phases: ['extend', 'impact'],
      check(j, angles) {
        if (!j.nose || !j.neck) return false;
        return j.nose.x - j.neck.x > 0.10;
      },
    },
  ],

  knee_strike: [
    {
      id: 'loss_of_balance', label: 'Losing balance on the strike', cue: 'Stay balanced on the post leg',
      severity: 'MODERATE', isRisk: false,
      phases: ['drive', 'impact'],
      check(j, angles) {
        const drift = angles?.pelvisDriftX ?? null;
        return drift != null && Math.abs(drift) > 0.12;
      },
    },
    {
      id: 'guard_drop', label: 'Guard dropping', cue: 'Pull the target into the knee with your hands',
      severity: 'LOW', isRisk: false,
      phases: ['drive', 'impact'],
      check(j, angles) {
        if (!j.l_shoulder || !j.neck) return false;
        return j.neck.y - j.l_shoulder.y < 0.04;
      },
    },
  ],

  // ─── OLYMPIC LIFT ACCESSORIES ───────────────────────────────────────────────
  // Same phaseMap as deadlift (PM_HIP_HINGE), same real phase ids.
  clean_pull: [
    {
      id: 'rounded_spine', label: 'Rounded spine', cue: 'Keep chest proud',
      severity: 'HIGH', isRisk: true,
      phases: ['hinge_ascent', 'hinge_descent'],
      check(j, angles) { return angles.torsoLean != null && angles.torsoLean > 30; },
    },
    {
      id: 'bar_drift', label: 'Bar drifting forward', cue: 'Keep bar close',
      severity: 'HIGH', isRisk: false,
      phases: ['hinge_ascent'],
      check(j, angles) {
        if (!j.l_wrist || !j.l_ankle) return false;
        return Math.abs(j.l_wrist.x - j.l_ankle.x) > 0.10;
      },
    },
    {
      id: 'incomplete_lockout', label: 'Incomplete extension', cue: 'Finish tall — full hip and knee extension',
      severity: 'HIGH', isRisk: false,
      phases: ['lockout'],
      check(j, angles) { return angles.hipHingeL != null && angles.hipHingeL < 168; },
    },
  ],

  snatch_pull: [
    {
      id: 'rounded_spine', label: 'Rounded spine', cue: 'Keep chest proud',
      severity: 'HIGH', isRisk: true,
      phases: ['hinge_ascent', 'hinge_descent'],
      check(j, angles) { return angles.torsoLean != null && angles.torsoLean > 30; },
    },
    {
      id: 'bar_drift', label: 'Bar drifting forward', cue: 'Keep bar close',
      severity: 'HIGH', isRisk: false,
      phases: ['hinge_ascent'],
      check(j, angles) {
        if (!j.l_wrist || !j.l_ankle) return false;
        return Math.abs(j.l_wrist.x - j.l_ankle.x) > 0.10;
      },
    },
    {
      id: 'incomplete_lockout', label: 'Incomplete extension', cue: 'Finish tall — full hip and knee extension',
      severity: 'HIGH', isRisk: false,
      phases: ['lockout'],
      check(j, angles) { return angles.hipHingeL != null && angles.hipHingeL < 168; },
    },
  ],

  high_pull: [
    {
      id: 'rounded_spine', label: 'Rounded spine', cue: 'Keep chest proud',
      severity: 'HIGH', isRisk: true,
      phases: ['hinge_ascent', 'hinge_descent'],
      check(j, angles) { return angles.torsoLean != null && angles.torsoLean > 30; },
    },
    {
      id: 'bar_drift', label: 'Bar drifting forward', cue: 'Keep bar close',
      severity: 'HIGH', isRisk: false,
      phases: ['hinge_ascent'],
      check(j, angles) {
        if (!j.l_wrist || !j.l_ankle) return false;
        return Math.abs(j.l_wrist.x - j.l_ankle.x) > 0.10;
      },
    },
    {
      id: 'low_elbow_finish', label: 'Elbows not driving up', cue: 'Lead with the elbows, not the hands',
      severity: 'MODERATE', isRisk: false,
      phases: ['lockout'],
      check(j, angles) { return angles.elbowL != null && angles.elbowL > 140; },
    },
  ],
};

// Alias common variants
FAULT_MODULES['squat'] = FAULT_MODULES['back_squat'];
FAULT_MODULES['barbell_row'] = FAULT_MODULES['bent_over_row'];
FAULT_MODULES['dumbbell_row'] = FAULT_MODULES['bent_over_row'];
FAULT_MODULES['cable_row'] = FAULT_MODULES['bent_over_row'];
FAULT_MODULES['decline_bench_press'] = FAULT_MODULES['incline_bench_press'];
FAULT_MODULES['chin_up'] = FAULT_MODULES['pull_up'];
FAULT_MODULES['pullup'] = FAULT_MODULES['pull_up'];
FAULT_MODULES['chinup'] = FAULT_MODULES['pull_up'];
FAULT_MODULES['pushup'] = FAULT_MODULES['push_up'];
FAULT_MODULES['incline_pushup'] = FAULT_MODULES['push_up'];
FAULT_MODULES['decline_pushup'] = FAULT_MODULES['push_up'];
FAULT_MODULES['romanian_deadlift'] = FAULT_MODULES['deadlift'];
FAULT_MODULES['sumo_deadlift'] = FAULT_MODULES['deadlift'];
FAULT_MODULES['goblet_squat'] = FAULT_MODULES['back_squat'];
FAULT_MODULES['front_squat'] = FAULT_MODULES['back_squat'];
FAULT_MODULES['cossack_squat'] = FAULT_MODULES['single_leg_squat'];
FAULT_MODULES['lateral_bound'] = FAULT_MODULES['lateral_bound'];
FAULT_MODULES['diamond_push_up'] = FAULT_MODULES['push_up'];
FAULT_MODULES['wide_push_up'] = FAULT_MODULES['push_up'];
FAULT_MODULES['pike_push_up'] = FAULT_MODULES['push_up'];
FAULT_MODULES['hip_thrust'] = FAULT_MODULES['glute_bridge'];
FAULT_MODULES['single_leg_glute_bridge'] = FAULT_MODULES['glute_bridge'];
FAULT_MODULES['good_morning'] = FAULT_MODULES['good_morning'];
FAULT_MODULES['overhead_squat'] = FAULT_MODULES['overhead_squat'];

// ── FAULT PERSISTENCE BUFFER ──────────────────────────────────────────────

export class FaultPersistenceBuffer {
  constructor(minPersistMs = 400) {
    this.minPersistMs = minPersistMs;
    this.pending      = {};  // faultId → { startMs, count }
  }

  update(detectedFaultIds, tMs) {
    const confirmed = [];

    for (const id of detectedFaultIds) {
      if (!this.pending[id]) {
        this.pending[id] = { startMs: tMs, count: 1 };
      } else {
        this.pending[id].count++;
        if (tMs - this.pending[id].startMs >= this.minPersistMs) {
          confirmed.push(id);
        }
      }
    }

    // Clear faults that are no longer detected
    for (const id of Object.keys(this.pending)) {
      if (!detectedFaultIds.includes(id)) {
        delete this.pending[id];
      }
    }

    return confirmed;
  }

  reset() {
    this.pending = {};
  }
}

// ── FAULT DETECTOR ────────────────────────────────────────────────────────

export class FaultDetector {
  constructor(exerciseId) {
    this.exerciseId = exerciseId;
    this.modules    = FAULT_MODULES[exerciseId] ?? [];
  }

  /**
   * Evaluate faults for the current frame.
   * Phase gating: only runs checks valid for currentPhase.
   */
  evaluate(smoothedJoints, currentPhase, tMs, angles, velocities, baseline) {
    const phaseId   = typeof currentPhase === 'object' ? currentPhase?.id : currentPhase;
    const triggered = [];

    for (const fault of this.modules) {
      // ── PHASE GATE — critical: skip wrong-phase checks ──
      if (phaseId && !fault.phases.includes(phaseId)) continue;

      const detected = fault.check(smoothedJoints, angles, baseline, velocities);
      if (detected) triggered.push(fault);
    }

    return triggered;
  }

  getFaultById(id) {
    return this.modules.find(f => f.id === id);
  }
}