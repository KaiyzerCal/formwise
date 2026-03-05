// Phase detection for movement protocols
// Returns the current phase name based on joint angles

const PHASE_DETECTORS = {
  golf_swing: (angles, prevPhase) => {
    const hip = angles["HIP ROT"] ?? 0;
    const shoulder = angles["SHOULDER"] ?? 0;
    if (hip < 15 && shoulder < 20) return "setup";
    if (shoulder > 60 && hip < 30) return "backswing";
    if (shoulder > 60 && hip > 30) return "downswing";
    if (hip > 40 && shoulder < 20) return "impact";
    if (hip > 35 && shoulder > 60) return "follow_through";
    return prevPhase || "setup";
  },

  tennis_serve: (angles, prevPhase) => {
    const elbow = angles["ELBOW"] ?? 180;
    const knee = angles["KNEE"] ?? 180;
    if (knee > 160 && elbow > 150) return "trophy";
    if (knee < 140 && elbow > 120) return "loading";
    if (knee > 150 && elbow < 100) return "acceleration";
    if (elbow < 80) return "contact";
    if (elbow > 150) return "follow_through";
    return prevPhase || "trophy";
  },

  basketball_shot: (angles, prevPhase) => {
    const knee = angles["KNEE"] ?? 180;
    const elbow = angles["ELBOW"] ?? 180;
    if (knee > 160) return "catch";
    if (knee < 120 && elbow > 100) return "dip";
    if (knee < 100) return "gather";
    if (elbow < 90) return "release";
    if (knee > 150 && elbow > 150) return "follow_through";
    return prevPhase || "catch";
  },

  soccer_kick: (angles, prevPhase) => {
    const hip = angles["HIP"] ?? 180;
    const knee = angles["KNEE"] ?? 180;
    if (knee > 160 && hip > 160) return "approach";
    if (knee < 130 && hip > 150) return "plant";
    if (knee < 110) return "backswing";
    if (knee > 140 && hip > 155) return "contact";
    if (knee > 160 && hip > 170) return "follow_through";
    return prevPhase || "approach";
  },

  football_throw: (angles, prevPhase) => {
    const elbow = angles["ELBOW"] ?? 180;
    const shoulder = angles["SHOULDER"] ?? 90;
    if (elbow > 160) return "grip";
    if (elbow > 100 && shoulder > 90) return "windup";
    if (elbow < 100 && shoulder > 80) return "acceleration";
    if (elbow < 80) return "release";
    if (elbow > 140) return "follow_through";
    return prevPhase || "grip";
  },
};

export function detectPhase(exerciseId, jointResults, prevPhase) {
  const detector = PHASE_DETECTORS[exerciseId];
  if (!detector) return null;

  // Build angle map by label
  const angles = {};
  for (const jr of jointResults) {
    if (jr.angle !== null) angles[jr.label] = jr.angle;
  }

  return detector(angles, prevPhase);
}