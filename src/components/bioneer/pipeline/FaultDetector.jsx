// Layer 4b: Fault Detector — checks biomechanical fault conditions per-frame

const COOLDOWN_MS = 3000;

// Per-exercise fault definitions
const FAULT_DEFS = {
  squat: [
    {
      id: 'knee_valgus',
      label: 'Knee Cave',
      correction: 'Drive knees out over toes.',
      severity: 'HIGH',
      phases: ['bottom'],
    },
    {
      id: 'spine_collapse',
      label: 'Spine Collapse',
      correction: 'Chest up, spine neutral.',
      severity: 'HIGH',
      phases: ['descent', 'bottom', 'ascent'],
    },
    {
      id: 'forward_lean',
      label: 'Excessive Lean',
      correction: 'Stay upright, weight through heels.',
      severity: 'MODERATE',
      phases: ['descent', 'bottom'],
    },
  ],
  deadlift: [
    {
      id: 'rounded_back',
      label: 'Rounded Back',
      correction: 'Chest tall, hinge from hips.',
      severity: 'HIGH',
      phases: ['setup', 'pull'],
    },
    {
      id: 'bar_drift',
      label: 'Bar Drift',
      correction: 'Keep bar close to shins.',
      severity: 'MODERATE',
      phases: ['pull'],
    },
  ],
  push_up: [
    {
      id: 'sagging_hips',
      label: 'Hip Sag',
      correction: 'Brace core, keep body straight.',
      severity: 'HIGH',
      phases: ['descent', 'bottom'],
    },
    {
      id: 'flared_elbows',
      label: 'Elbows Flared',
      correction: 'Tuck elbows at 45 degrees.',
      severity: 'MODERATE',
      phases: ['descent', 'bottom'],
    },
  ],
  baseball_swing: [
    {
      id: 'casting',
      label: 'Casting',
      correction: 'Keep hands inside the ball.',
      severity: 'HIGH',
      phases: ['rotation'],
    },
    {
      id: 'early_extension',
      label: 'Early Extension',
      correction: 'Stay back, drive hips first.',
      severity: 'MODERATE',
      phases: ['rotation', 'contact'],
    },
  ],
};

// Map exercise IDs to fault defs
const ID_MAP = {
  back_squat: 'squat', squat: 'squat',
  deadlift: 'deadlift',
  push_up: 'push_up', pushup: 'push_up',
  baseball_swing: 'baseball_swing',
};

export class FaultDetector {
  constructor(exerciseId) {
    const key      = ID_MAP[exerciseId] ?? exerciseId;
    this.faults    = FAULT_DEFS[key] ?? [];
    this.lastTime  = {};  // faultId → tMs
    this.history   = [];
  }

  evaluate(smoothedJoints, phaseId, tMs) {
    const detected = [];

    for (const fault of this.faults) {
      // Phase gate
      if (fault.phases && phaseId && !fault.phases.includes(phaseId)) continue;

      // Cooldown
      if (tMs - (this.lastTime[fault.id] ?? 0) < COOLDOWN_MS) continue;

      if (this._check(fault.id, smoothedJoints)) {
        this.lastTime[fault.id] = tMs;
        this.history.push({ ...fault, detectedAt: tMs });
        detected.push({ ...fault, detectedAt: tMs });
      }
    }

    return detected;
  }

  _check(faultId, j) {
    switch (faultId) {
      case 'knee_valgus': {
        if (!j.l_knee || !j.r_knee || !j.l_ankle || !j.r_ankle) return false;
        const kneeGap  = j.r_knee.x - j.l_knee.x;
        const ankleGap = j.r_ankle.x - j.l_ankle.x;
        return ankleGap > 0.01 && kneeGap < ankleGap * 0.70;
      }
      case 'spine_collapse':
      case 'rounded_back': {
        if (!j.chest || !j.pelvis) return false;
        return Math.abs(j.chest.x - j.pelvis.x) > 0.10;
      }
      case 'forward_lean': {
        if (!j.chest || !j.pelvis) return false;
        return Math.abs(j.chest.x - j.pelvis.x) > 0.07;
      }
      case 'sagging_hips': {
        if (!j.chest || !j.pelvis || !j.l_ankle) return false;
        // If pelvis y is higher than midpoint between chest and ankles
        const midY = (j.chest.y + j.l_ankle.y) / 2;
        return j.pelvis.y > midY + 0.05;
      }
      case 'flared_elbows': {
        if (!j.l_elbow || !j.l_shoulder || !j.r_elbow || !j.r_shoulder) return false;
        const lFlare = Math.abs(j.l_elbow.x - j.l_shoulder.x);
        const rFlare = Math.abs(j.r_elbow.x - j.r_shoulder.x);
        return lFlare > 0.15 || rFlare > 0.15;
      }
      case 'casting': {
        if (!j.r_wrist || !j.r_elbow || !j.r_shoulder) return false;
        return j.r_wrist.x > j.r_elbow.x + 0.04;
      }
      case 'early_extension': {
        if (!j.pelvis || !j.l_knee) return false;
        return j.pelvis.y < j.l_knee.y - 0.25;
      }
      case 'bar_drift': {
        if (!j.l_wrist || !j.l_ankle) return false;
        return Math.abs(j.l_wrist.x - j.l_ankle.x) > 0.12;
      }
      default:
        return false;
    }
  }

  getHistory() { return this.history; }
}