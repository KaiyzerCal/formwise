// Layer 4a: Rep Detector — velocity + angle state machine, sub-100ms event latency

import { calcAngle } from "../poseEngine";

export const REP_CONFIGS = {
  squat: {
    repJoint:         'l_knee',
    angleJoints:      ['l_hip', 'l_knee', 'l_ankle'],
    bottomAngle:      95,
    descentThreshold: 0.008,
    ascentThreshold:  0.005,
    minRepDurationMs: 1200,
  },
  deadlift: {
    repJoint:         'l_hip',
    angleJoints:      ['l_shoulder', 'l_hip', 'l_knee'],
    bottomAngle:      70,
    descentThreshold: 0.005,
    ascentThreshold:  0.004,
    minRepDurationMs: 1500,
  },
  push_up: {
    repJoint:         'l_elbow',
    angleJoints:      ['l_shoulder', 'l_elbow', 'l_wrist'],
    bottomAngle:      90,
    descentThreshold: 0.007,
    ascentThreshold:  0.005,
    minRepDurationMs: 800,
  },
  overhead_press: {
    repJoint:         'r_elbow',
    angleJoints:      ['r_shoulder', 'r_elbow', 'r_wrist'],
    bottomAngle:      90,
    descentThreshold: 0.007,
    ascentThreshold:  0.005,
    minRepDurationMs: 1000,
  },
  lunge: {
    repJoint:         'l_knee',
    angleJoints:      ['l_hip', 'l_knee', 'l_ankle'],
    bottomAngle:      100,
    descentThreshold: 0.006,
    ascentThreshold:  0.004,
    minRepDurationMs: 1000,
  },
  basketball_jump_shot: {
    repJoint:         'r_wrist',
    angleJoints:      ['r_shoulder', 'r_elbow', 'r_wrist'],
    bottomAngle:      160,
    descentThreshold: 0.012,
    ascentThreshold:  0.010,
    minRepDurationMs: 600,
  },
  baseball_swing: {
    repJoint:         'r_wrist',
    angleJoints:      ['r_shoulder', 'r_elbow', 'r_wrist'],
    bottomAngle:      140,
    descentThreshold: 0.015,
    ascentThreshold:  0.008,
    minRepDurationMs: 500,
  },
};

// Map exercise IDs to REP_CONFIGS keys
const ID_MAP = {
  back_squat: 'squat', squat: 'squat',
  deadlift: 'deadlift',
  push_up: 'push_up', pushup: 'push_up',
  overhead_press: 'overhead_press', ohp: 'overhead_press',
  lunge: 'lunge',
  basketball_jump_shot: 'basketball_jump_shot',
  baseball_swing: 'baseball_swing',
};

export class RepDetector {
  constructor(exerciseId) {
    const key = ID_MAP[exerciseId] ?? exerciseId;
    this.config   = REP_CONFIGS[key] ?? REP_CONFIGS.squat;
    this.state    = 'LOCKOUT';
    this.repCount = 0;
    this.buffer   = [];
    this.repStart = null;
  }

  ingest(smoothedJoints, tMs) {
    this.buffer.push({ joints: smoothedJoints, tMs });
    if (this.buffer.length > 60) this.buffer.shift();
    return this._evaluate(tMs);
  }

  _evaluate(tMs) {
    if (this.buffer.length < 8) return null;

    const velY  = this._velocityY(this.config.repJoint, 5);
    const angle = this._keyAngle();
    let event   = null;

    switch (this.state) {
      case 'LOCKOUT':
        if (velY > this.config.descentThreshold) {
          this.state    = 'DESCENT';
          this.repStart = tMs;
          event = { type: 'PHASE_DESCENT', tMs };
        }
        break;

      case 'DESCENT':
        if (angle !== null && angle < this.config.bottomAngle) {
          this.state = 'BOTTOM';
          event = { type: 'PHASE_BOTTOM', tMs, angle };
        }
        break;

      case 'BOTTOM':
        if (velY < -this.config.ascentThreshold) {
          this.state = 'ASCENT';
          event = { type: 'PHASE_ASCENT', tMs };
        }
        break;

      case 'ASCENT':
        if (velY > -this.config.descentThreshold * 0.3 &&
            tMs - this.repStart >= this.config.minRepDurationMs) {
          this.state = 'LOCKOUT';
          this.repCount++;
          event = {
            type:       'REP_COMPLETE',
            tMs,
            repNumber:  this.repCount,
            durationMs: tMs - this.repStart,
          };
        }
        break;
    }

    return event;
  }

  _velocityY(jointId, windowFrames) {
    const recent = this.buffer.slice(-windowFrames);
    if (recent.length < 2) return 0;
    const y0 = recent[0].joints[jointId]?.y ?? 0;
    const y1 = recent[recent.length - 1].joints[jointId]?.y ?? 0;
    return (y1 - y0) / recent.length;
  }

  _keyAngle() {
    const j   = this.buffer[this.buffer.length - 1]?.joints;
    const cfg = this.config;
    if (!j || !cfg.angleJoints) return null;
    const [a, b, c] = cfg.angleJoints;
    if (!j[a] || !j[b] || !j[c]) return null;
    // calcAngle expects {x,y} objects
    return calcAngle(j[a], j[b], j[c]);
  }

  getCount() { return this.repCount; }
  getState()  { return this.state; }
}