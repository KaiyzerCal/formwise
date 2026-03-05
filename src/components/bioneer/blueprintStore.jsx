// Blueprint local storage manager

const STORAGE_KEY = "bioneer_blueprints";

export function getBlueprints() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveBlueprint(blueprint) {
  const existing = getBlueprints();
  existing.unshift(blueprint);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function deleteBlueprint(id) {
  const existing = getBlueprints().filter((b) => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function generateBlueprint(frameResults, exerciseId, userLabel) {
  const TRACKED_JOINTS = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

  // Build normalized paths (cap at 300 points)
  let frames = frameResults.filter((f) => f.landmarks && f.confidence > 0.55);
  if (frames.length > 300) {
    const step = frames.length / 300;
    frames = Array.from({ length: 300 }, (_, i) => frames[Math.round(i * step)]);
  }

  const idealPaths = {};
  TRACKED_JOINTS.forEach((idx) => {
    idealPaths[idx] = frames.map((f) => {
      const lm = f.landmarks[idx];
      return lm ? { x: lm.x, y: lm.y } : null;
    }).filter(Boolean);
  });

  // Extract angle ranges per joint
  const jointAngleRanges = {};
  frames.forEach((f) => {
    if (!f.jointAngles) return;
    Object.entries(f.jointAngles).forEach(([label, angle]) => {
      if (!jointAngleRanges[label]) jointAngleRanges[label] = [];
      jointAngleRanges[label].push(angle);
    });
  });
  Object.keys(jointAngleRanges).forEach((label) => {
    const angles = jointAngleRanges[label];
    jointAngleRanges[label] = {
      min: Math.min(...angles),
      max: Math.max(...angles),
      avg: Math.round(angles.reduce((a, b) => a + b, 0) / angles.length),
    };
  });

  // Extract phase timings
  const phases = {};
  frames.forEach((f) => {
    if (!f.phase) return;
    if (!phases[f.phase]) phases[f.phase] = { start: f.t, end: f.t };
    phases[f.phase].end = f.t;
  });

  return {
    id: `blueprint_${Date.now()}`,
    sourceType: "upload",
    exerciseId,
    label: userLabel,
    createdAt: new Date().toISOString(),
    idealPaths,
    jointAngleRanges,
    phases,
    frameCount: frames.length,
  };
}