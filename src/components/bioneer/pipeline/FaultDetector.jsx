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
};

// Alias common variants
FAULT_MODULES['squat'] = FAULT_MODULES['back_squat'];

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