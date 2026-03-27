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
      phases: ['descent','bottom','ascent'],  // squat phases
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
      phases: ['descent','bottom'],
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
      phases: ['descent','bottom'],
      check(j, angles, baseline) {
        if (!j.l_ankle || !baseline?.ankleY) return false;
        return j.l_ankle.y < baseline.ankleY - 0.04;
      },
    },
    {
      id: 'asymmetric_load', label: 'Asymmetric loading', cue: 'Even your weight',
      severity: 'MODERATE', isRisk: false,
      phases: ['descent','bottom','ascent'],
      check(j, angles) {
        return angles.asymmetry?.knee != null && angles.asymmetry.knee > 18;
      },
    },
  ],

  // ─── DEADLIFT ─────────────────────────────────────────────────────────────
  deadlift: [
    {
      id: 'rounded_spine', label: 'Rounded spine', cue: 'Keep chest proud',
      severity: 'HIGH', isRisk: true,
      phases: ['pull','lower'],
      check(j, angles) {
        return angles.trunkFwd != null && angles.trunkFwd < 155;
      },
    },
    {
      id: 'bar_drift', label: 'Bar drifting forward', cue: 'Keep bar close',
      severity: 'HIGH', isRisk: false,
      phases: ['pull'],
      check(j, angles) {
        if (!j.l_wrist || !j.l_ankle) return false;
        return Math.abs(j.l_wrist.x - j.l_ankle.x) > 0.10;
      },
    },
    {
      id: 'hips_rise_first', label: 'Hips rising early', cue: 'Push floor away',
      severity: 'MODERATE', isRisk: false,
      phases: ['pull'],
      check(j, angles, baseline, velocities) {
        if (!velocities?.l_hip || !velocities?.chest) return false;
        return velocities.l_hip.y < -0.008 && Math.abs(velocities.chest.y) < 0.003;
      },
    },
  ],

  // ─── PUSH-UP ──────────────────────────────────────────────────────────────
  push_up: [
    {
      id: 'hip_sag', label: 'Hips sagging', cue: 'Squeeze core',
      severity: 'HIGH', isRisk: true,
      phases: ['lowering','bottom','press'],
      check(j, angles) {
        if (!j.chest || !j.pelvis || !j.l_ankle) return false;
        const bodyLineY = (j.chest.y + j.l_ankle.y) / 2;
        return j.pelvis.y > bodyLineY + 0.06;
      },
    },
    {
      id: 'elbow_flare', label: 'Elbows flaring', cue: 'Tuck elbows in',
      severity: 'MODERATE', isRisk: false,
      phases: ['lowering','bottom'],
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
      phases: ['separation','launch'],
      check(j, angles, baseline, velocities) {
        if (!velocities?.chest || !velocities?.l_hip) return false;
        return Math.abs(velocities.chest.x) > Math.abs(velocities.l_hip.x) * 1.3;
      },
    },
    {
      id: 'casting', label: 'Casting (hands away)', cue: 'Hands inside the ball',
      severity: 'HIGH', isRisk: false,
      phases: ['launch','contact'],
      check(j, angles) {
        if (!j.r_wrist || !j.r_elbow) return false;
        return j.r_wrist.x < j.r_elbow.x - 0.06;
      },
    },
    {
      id: 'collapse_contact', label: 'Collapsing at contact', cue: 'Stay through the ball',
      severity: 'MODERATE', isRisk: false,
      phases: ['contact'],
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
      phases: ['press','lockout','concentric'],
      check(j, angles) {
        if (!j.chest || !j.pelvis) return false;
        return Math.abs(j.chest.x - j.pelvis.x) > 0.10;
      },
    },
    {
      id: 'forward_lean', label: 'Bar drifting forward', cue: 'Press over ears',
      severity: 'MODERATE', isRisk: false,
      phases: ['press','concentric'],
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

  // ─── BARBELL ROW / DUMBBELL ROW ───────────────────────────────────────────
  barbell_row: [
    {
      id: 'rounded_spine', label: 'Rounded spine', cue: 'Chest proud — flat back',
      severity: 'HIGH', isRisk: true,
      phases: ['pull','peak','lower'],
      check(j, angles) { return angles.trunkFwd != null && angles.trunkFwd < 150; },
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
      phases: ['pull','peak'],
      check(j, angles) {
        if (!j.chest || !j.pelvis) return false;
        return Math.abs(j.chest.x - j.pelvis.x) > 0.14;
      },
    },
    {
      id: 'elbow_flare', label: 'Elbows flaring', cue: 'Elbows down and back',
      severity: 'MODERATE', isRisk: false,
      phases: ['pull','peak'],
      check(j, angles) {
        if (!j.l_elbow || !j.l_shoulder) return false;
        return Math.abs(j.l_elbow.x - j.l_shoulder.x) > 0.16;
      },
    },
    {
      id: 'short_range', label: 'Insufficient range', cue: 'Full arm extension',
      severity: 'LOW', isRisk: false,
      phases: ['hang','extend'],
      check(j, angles) { return angles.elbowL != null && angles.elbowL < 145; },
    },
  ],

  // ─── DIP ──────────────────────────────────────────────────────────────────
  dip: [
    {
      id: 'elbow_flare', label: 'Elbows flaring wide', cue: 'Elbows track back',
      severity: 'MODERATE', isRisk: true,
      phases: ['descent','bottom'],
      check(j, angles) {
        if (!j.l_elbow || !j.l_shoulder) return false;
        return Math.abs(j.l_elbow.x - j.l_shoulder.x) > 0.15;
      },
    },
    {
      id: 'too_deep', label: 'Excessive depth', cue: 'Stop at 90 degrees elbow',
      severity: 'MODERATE', isRisk: true,
      phases: ['bottom'],
      check(j, angles) { return angles.elbowL != null && angles.elbowL < 75; },
    },
    {
      id: 'forward_lean', label: 'Excessive forward lean', cue: 'Stay upright for triceps',
      severity: 'LOW', isRisk: false,
      phases: ['descent','bottom','press'],
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
      phases: ['lowering','bottom'],
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
      check(j, angles) { return angles.trunkFwd != null && angles.trunkFwd < 148; },
    },
    {
      id: 'knee_bend', label: 'Excessive knee bend', cue: 'Soft knee — not a squat',
      severity: 'MODERATE', isRisk: false,
      phases: ['hinge','bottom'],
      check(j, angles) { return angles.kneeL != null && angles.kneeL < 140; },
    },
    {
      id: 'incomplete_lockout', label: 'Incomplete hip extension', cue: 'Stand fully at top',
      severity: 'LOW', isRisk: false,
      phases: ['lockout'],
      check(j, angles) { return angles.hipHingeL != null && angles.hipHingeL < 165; },
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

  // ─── LATERAL SHUFFLE ──────────────────────────────────────────────────────
  lateral_shuffle: [
    {
      id: 'stance_too_high', label: 'Standing too tall', cue: 'Stay low in athletic stance',
      severity: 'MODERATE', isRisk: false,
      phases: ['shuffle','setup'],
      check(j, angles) { return angles.kneeL != null && angles.kneeL > 155; },
    },
    {
      id: 'feet_crossing', label: 'Feet too close together', cue: 'Keep shoulder-width base',
      severity: 'MODERATE', isRisk: true,
      phases: ['shuffle'],
      check(j, angles) {
        if (!j.l_ankle || !j.r_ankle) return false;
        return Math.abs(j.l_ankle.x - j.r_ankle.x) < 0.08;
      },
    },
    {
      id: 'trunk_bounce', label: 'Trunk bouncing', cue: 'Smooth head height — stay level',
      severity: 'LOW', isRisk: false,
      phases: ['shuffle'],
      check(j, angles, baseline, velocities) {
        if (!velocities?.chest) return false;
        return Math.abs(velocities.chest.y) > 0.015;
      },
    },
  ],
};

// Alias common variants
FAULT_MODULES['squat'] = FAULT_MODULES['back_squat'];
FAULT_MODULES['dumbbell_row'] = FAULT_MODULES['barbell_row'];
FAULT_MODULES['cable_row'] = FAULT_MODULES['barbell_row'];
FAULT_MODULES['decline_bench_press'] = FAULT_MODULES['incline_bench_press'];
FAULT_MODULES['chin_up'] = FAULT_MODULES['pull_up'];
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