// PathRecorder — rolling buffer of joint positions per frame
// Reads from existing smoothed landmarks. Does NOT affect pose pipeline.

// MediaPipe landmark indices for named joints
export const LANDMARK_INDEX = {
  left_shoulder: 11,
  right_shoulder: 12,
  left_elbow: 13,
  right_elbow: 14,
  left_wrist: 15,
  right_wrist: 16,
  left_hip: 23,
  right_hip: 24,
  left_knee: 25,
  right_knee: 26,
  left_ankle: 27,
  right_ankle: 28,
};

// Which joints to track per exercise category
export function getTrackedJoints(exercise) {
  const category = exercise.category || "strength";
  const id = exercise.id || "";

  // Lower body exercises
  const lowerBody = ["squat", "lunge", "deadlift"];
  // Upper body exercises
  const upperBody = ["bench_press", "overhead_press", "pushup", "pullup"];

  if (lowerBody.includes(id)) {
    return ["left_hip", "right_hip", "left_knee", "right_knee"];
  }
  if (upperBody.includes(id)) {
    return ["left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist"];
  }
  // Sports — track all
  return [
    "left_hip", "right_hip", "left_knee", "right_knee",
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist",
  ];
}

const MAX_FRAMES = 1800; // 60s at 30fps rolling window

export class PathRecorder {
  constructor(jointIds) {
    this.joints = jointIds;
    this.buffer = {};
    jointIds.forEach((id) => (this.buffer[id] = []));
  }

  record(smoothedLandmarks, timestamp) {
    this.joints.forEach((id) => {
      const idx = LANDMARK_INDEX[id];
      if (idx === undefined) return;
      const lm = smoothedLandmarks[idx];
      if (lm && lm.visibility >= 0.65) {
        this.buffer[id].push({ x: lm.x, y: lm.y, t: timestamp });
        if (this.buffer[id].length > MAX_FRAMES) {
          this.buffer[id].shift(); // rolling window
        }
      }
    });
  }

  getPath(jointId) {
    return this.buffer[jointId] ?? [];
  }

  getSnapshot() {
    // Returns a lightweight snapshot for replay (trim to last 900 frames ~30s)
    const snap = {};
    this.joints.forEach((id) => {
      snap[id] = this.buffer[id].slice(-900);
    });
    return snap;
  }

  clear() {
    this.joints.forEach((id) => (this.buffer[id] = []));
  }
}