// Ideal form blueprints for exercise auto-detection and comparison

export const BLUEPRINTS = {
  squat: {
    id: "squat_ideal",
    exercise: "squat",
    phases: ["setup", "descent", "bottom", "ascent", "lockout"],
    joints: [
      {
        id: "knee",
        label: "Knee",
        landmarks: [23, 25, 27], // hip→knee→ankle left
        altLandmarks: [24, 26, 28],
        phaseRanges: {
          bottom:  { optimal: [80, 95],  acceptable: [70, 105], danger_below: 70, danger_above: 110 },
          descent: { optimal: [100, 160], acceptable: [90, 165], danger_below: 85 },
          ascent:  { optimal: [100, 160], acceptable: [90, 165], danger_below: 85 },
          lockout: { optimal: [165, 180], acceptable: [155, 180], danger_below: 150 },
          setup:   { optimal: [165, 180], acceptable: [155, 180], danger_below: 150 },
        },
        coaching: {
          low_bottom: "Knee angle too acute — reduce depth or improve mobility.",
          valgus: "Drive knees outward over toes throughout descent.",
          soft_lockout: "Fully extend knees at lockout.",
        },
      },
      {
        id: "hip",
        label: "Hip",
        landmarks: [12, 24, 26],
        altLandmarks: [11, 23, 25],
        phaseRanges: {
          bottom:  { optimal: [85, 110],  acceptable: [75, 120], danger_below: 70 },
          descent: { optimal: [100, 155], acceptable: [85, 165], danger_below: 75 },
          ascent:  { optimal: [100, 155], acceptable: [85, 165], danger_below: 75 },
          lockout: { optimal: [170, 180], acceptable: [160, 180], danger_below: 155 },
          setup:   { optimal: [170, 180], acceptable: [160, 180], danger_below: 155 },
        },
        coaching: {
          insufficient_depth: "Reach hip crease below parallel.",
          soft_lockout: "Drive hips fully through at lockout.",
        },
      },
      {
        id: "spine",
        label: "Spine",
        landmarks: "spine_lean",
        phaseRanges: {
          bottom:  { optimal: [5, 20],  acceptable: [0, 30], danger_above: 35 },
          descent: { optimal: [5, 25],  acceptable: [0, 35], danger_above: 40 },
          ascent:  { optimal: [5, 25],  acceptable: [0, 35], danger_above: 40 },
          lockout: { optimal: [0, 10],  acceptable: [0, 20], danger_above: 25 },
          setup:   { optimal: [0, 10],  acceptable: [0, 20], danger_above: 25 },
        },
        coaching: {
          excessive_lean: "Brace core and keep chest lifted through descent.",
        },
      },
    ],
    // Phase detection based on knee angle
    phaseDetect: (angles, prevPhase) => {
      const knee = angles.knee;
      if (knee == null) return prevPhase || "setup";
      if (knee >= 155) return prevPhase === "ascent" ? "lockout" : "setup";
      if (knee >= 110) return prevPhase === "bottom" ? "ascent" : "descent";
      return "bottom";
    },
  },

  deadlift: {
    id: "deadlift_ideal",
    exercise: "deadlift",
    phases: ["setup", "lift", "top", "lower"],
    joints: [
      {
        id: "spine",
        label: "Spine",
        landmarks: "spine_lean",
        phaseRanges: {
          setup:  { optimal: [15, 35], acceptable: [10, 45], danger_above: 50 },
          lift:   { optimal: [10, 30], acceptable: [5, 40],  danger_above: 45 },
          top:    { optimal: [0, 10],  acceptable: [0, 20],  danger_above: 25 },
          lower:  { optimal: [10, 30], acceptable: [5, 40],  danger_above: 45 },
        },
        coaching: {
          excessive_lean: "Brace your back — avoid rounding the spine.",
          hyperextension: "Avoid leaning back too far at lockout.",
        },
      },
      {
        id: "hip",
        label: "Hip",
        landmarks: [12, 24, 26],
        altLandmarks: [11, 23, 25],
        phaseRanges: {
          setup: { optimal: [55, 80],  acceptable: [45, 95],  danger_below: 40 },
          lift:  { optimal: [100, 155], acceptable: [90, 165], danger_below: 80 },
          top:   { optimal: [170, 180], acceptable: [160, 180], danger_below: 155 },
          lower: { optimal: [100, 155], acceptable: [90, 165], danger_below: 80 },
        },
        coaching: {
          insufficient_hinge: "Hinge at the hip — push hips back on descent.",
          soft_lockout: "Drive hips fully through at top.",
        },
      },
      {
        id: "knee",
        label: "Knee",
        landmarks: [23, 25, 27],
        altLandmarks: [24, 26, 28],
        phaseRanges: {
          setup:  { optimal: [90, 120],  acceptable: [80, 135],  danger_below: 70 },
          lift:   { optimal: [140, 170], acceptable: [130, 178], danger_below: 120 },
          top:    { optimal: [168, 180], acceptable: [155, 180], danger_below: 150 },
          lower:  { optimal: [140, 170], acceptable: [130, 178], danger_below: 120 },
        },
        coaching: {
          excess_knee_bend: "Romanian deadlift — keep knees softer, not squatting.",
          soft_lockout: "Lock knees out fully at the top.",
        },
      },
    ],
    phaseDetect: (angles, prevPhase) => {
      const hip = angles.hip;
      if (hip == null) return prevPhase || "setup";
      if (hip >= 165) return "top";
      if (hip >= 100) return prevPhase === "top" ? "lower" : "lift";
      return "setup";
    },
  },

  pushup: {
    id: "pushup_ideal",
    exercise: "pushup",
    phases: ["top", "descent", "bottom", "ascent"],
    joints: [
      {
        id: "elbow",
        label: "Elbow",
        landmarks: [12, 14, 16],
        altLandmarks: [11, 13, 15],
        phaseRanges: {
          top:     { optimal: [160, 180], acceptable: [150, 180], danger_below: 140 },
          descent: { optimal: [90, 150],  acceptable: [75, 160],  danger_below: 65 },
          bottom:  { optimal: [70, 90],   acceptable: [60, 100],  danger_below: 55, danger_above: 105 },
          ascent:  { optimal: [90, 150],  acceptable: [75, 160],  danger_below: 65 },
        },
        coaching: {
          too_narrow: "Elbows too close — flare slightly for chest engagement.",
          too_wide: "Tuck elbows to reduce shoulder strain.",
          insufficient_depth: "Lower chest to ground — full range of motion.",
        },
      },
      {
        id: "body_line",
        label: "Body Line",
        landmarks: [12, 24, 28],
        altLandmarks: [11, 23, 27],
        phaseRanges: {
          top:     { optimal: [168, 180], acceptable: [158, 180], danger_below: 150 },
          descent: { optimal: [168, 180], acceptable: [158, 180], danger_below: 150 },
          bottom:  { optimal: [168, 180], acceptable: [158, 180], danger_below: 150 },
          ascent:  { optimal: [168, 180], acceptable: [158, 180], danger_below: 150 },
        },
        coaching: {
          sagging_hips: "Squeeze glutes — prevent hip sag.",
          pike: "Lower hips — keep body in a straight plank.",
        },
      },
    ],
    phaseDetect: (angles, prevPhase) => {
      const elbow = angles.elbow;
      if (elbow == null) return prevPhase || "top";
      if (elbow >= 155) return prevPhase === "ascent" ? "top" : "top";
      if (elbow >= 100) return prevPhase === "bottom" ? "ascent" : "descent";
      return "bottom";
    },
  },
};

export function getBlueprintForExercise(exerciseId) {
  return BLUEPRINTS[exerciseId] || null;
}

// Classify angle against a phase range (mirrors existing evaluateState)
export function classifyStateFromRange(angle, range) {
  if (!range) return "ACCEPTABLE";
  if (range.danger_below != null && angle < range.danger_below) return "DANGER";
  if (range.danger_above != null && angle > range.danger_above) return "DANGER";
  if (angle >= range.optimal[0] && angle <= range.optimal[1]) return "OPTIMAL";
  if (range.acceptable && angle >= range.acceptable[0] && angle <= range.acceptable[1]) return "ACCEPTABLE";
  return "WARNING";
}