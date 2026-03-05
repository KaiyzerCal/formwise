// Upload Analysis Engine
// Handles: frame extraction, pose detection reuse, exercise detection, blueprint comparison

import { calcAngle, calcSpineLean } from "./poseEngine";
import { getBlueprintForExercise, classifyStateFromRange } from "./uploadBlueprints";

// ─── Frame Extraction ────────────────────────────────────────────────────────

export function extractFrames(videoFile, fps = 10) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const frames = [];

    video.preload = "auto";
    video.muted = true;
    video.src = URL.createObjectURL(videoFile);

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const duration = video.duration;
      const interval = 1 / fps;
      let currentTime = 0;

      const captureFrame = () => {
        if (currentTime > duration + 0.01) {
          URL.revokeObjectURL(video.src);
          resolve(frames);
          return;
        }

        video.currentTime = currentTime;
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push({
          t: Math.round(currentTime * 1000),
          imageData: canvas.toDataURL("image/jpeg", 0.7),
          width: canvas.width,
          height: canvas.height,
        });
        currentTime += interval;
        captureFrame();
      };

      captureFrame();
    };

    video.onerror = reject;
  });
}

// ─── Pose Detection (reuses MediaPipe from CameraView pattern) ───────────────

export async function runPoseDetection(frames, onProgress) {
  // Load MediaPipe if not already loaded
  const BASE = "https://unpkg.com/@mediapipe/pose@0.5.1675469404";
  await loadScript(`${BASE}/pose_solution_packed_assets_loader.js`);
  await loadScript(`${BASE}/pose_solution_simd_wasm_bin.js`);
  await loadScript(`${BASE}/pose.js`);

  const pose = new window.Pose({
    locateFile: (file) => `${BASE}/${file}`,
  });
  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: false,
    enableSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  await pose.initialize();

  const poseFrames = [];

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    onProgress && onProgress(Math.round((i / frames.length) * 100));

    const landmarks = await new Promise((resolve) => {
      pose.onResults((results) => {
        resolve(results.poseLandmarks || null);
      });

      const img = new Image();
      img.onload = () => pose.send({ image: img });
      img.src = frame.imageData;
    });

    poseFrames.push({
      t: frame.t,
      index: i,
      landmarks,
      imageData: frame.imageData,
      width: frame.width,
      height: frame.height,
    });
  }

  pose.close();
  return poseFrames;
}

// ─── Landmark Helpers ─────────────────────────────────────────────────────────

function getLM(landmarks, idx) {
  return landmarks?.[idx] || null;
}

function getAngleForJoint(landmarks, jointId) {
  if (!landmarks) return null;
  const lmSets = {
    knee: [[23, 25, 27], [24, 26, 28]],
    hip:  [[12, 24, 26], [11, 23, 25]],
    elbow:[[12, 14, 16], [11, 13, 15]],
    shoulder: [[24, 12, 14], [23, 11, 13]],
    body_line: [[12, 24, 28], [11, 23, 27]],
  };

  if (jointId === "spine") {
    const allVis = [11, 12, 23, 24].every(i => landmarks[i]?.visibility > 0.4);
    return allVis ? calcSpineLean(landmarks) : null;
  }

  const pairs = lmSets[jointId];
  if (!pairs) return null;

  for (const [a, b, c] of pairs) {
    const A = getLM(landmarks, a);
    const B = getLM(landmarks, b);
    const C = getLM(landmarks, c);
    if (A?.visibility > 0.4 && B?.visibility > 0.4 && C?.visibility > 0.4) {
      return calcAngle(A, B, C);
    }
  }
  return null;
}

function mean(arr) {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

// ─── Exercise Detection ───────────────────────────────────────────────────────

export function detectExercise(poseFrames) {
  const validFrames = poseFrames.filter(f => f.landmarks);
  if (validFrames.length < 5) return { exercise: "unknown", confidence: 0 };

  const kneeAngles   = validFrames.map(f => getAngleForJoint(f.landmarks, "knee")).filter(v => v != null);
  const hipAngles    = validFrames.map(f => getAngleForJoint(f.landmarks, "hip")).filter(v => v != null);
  const spineAngles  = validFrames.map(f => getAngleForJoint(f.landmarks, "spine")).filter(v => v != null);
  const elbowAngles  = validFrames.map(f => getAngleForJoint(f.landmarks, "elbow")).filter(v => v != null);

  const kneeRange  = kneeAngles.length  > 0 ? Math.max(...kneeAngles)  - Math.min(...kneeAngles)  : 0;
  const hipRange   = hipAngles.length   > 0 ? Math.max(...hipAngles)   - Math.min(...hipAngles)   : 0;
  const elbowRange = elbowAngles.length > 0 ? Math.max(...elbowAngles) - Math.min(...elbowAngles) : 0;
  const minKnee    = kneeAngles.length  > 0 ? Math.min(...kneeAngles)  : 180;
  const avgSpine   = mean(spineAngles);

  const isHorizontal = detectHorizontalBody(validFrames);

  if (isHorizontal && elbowRange > 40) {
    return { exercise: "pushup", confidence: 0.85 };
  }
  if (kneeRange > 45 && hipRange > 35 && minKnee < 115 && !isHorizontal) {
    const conf = Math.min(0.97, 0.7 + (kneeRange / 200) + (hipRange / 300));
    return { exercise: "squat", confidence: parseFloat(conf.toFixed(2)) };
  }
  if (hipRange > 50 && kneeRange < 35 && avgSpine > 25 && !isHorizontal) {
    return { exercise: "deadlift", confidence: 0.88 };
  }

  return { exercise: "unknown", confidence: 0 };
}

function detectHorizontalBody(validFrames) {
  const diffs = validFrames.map(f => {
    const lm = f.landmarks;
    if (!lm) return 1;
    const shoulderY = ((lm[11]?.y || 0) + (lm[12]?.y || 0)) / 2;
    const hipY      = ((lm[23]?.y || 0) + (lm[24]?.y || 0)) / 2;
    return Math.abs(shoulderY - hipY);
  });
  return mean(diffs) < 0.18;
}

// ─── Blueprint Comparison Engine ──────────────────────────────────────────────

export function compareToBlueprint(poseFrames, blueprint) {
  let prevPhase = null;
  const results = [];

  for (const frame of poseFrames) {
    if (!frame.landmarks) {
      results.push({ t: frame.t, index: frame.index, phase: "unknown", angles: {}, jointStates: {}, deviations: {} });
      continue;
    }

    // Get angles for this frame
    const angles = {};
    for (const joint of blueprint.joints) {
      angles[joint.id] = getAngleForJoint(frame.landmarks, joint.id);
    }

    // Detect phase using blueprint's phase detector
    const phase = blueprint.phaseDetect(angles, prevPhase);
    prevPhase = phase;

    // Evaluate each joint against phase ranges
    const jointStates = {};
    const deviations  = {};

    for (const joint of blueprint.joints) {
      const angle = angles[joint.id];
      if (angle == null) { jointStates[joint.id] = null; deviations[joint.id] = 0; continue; }

      const range = joint.phaseRanges[phase] || joint.phaseRanges["bottom"];
      jointStates[joint.id] = classifyStateFromRange(angle, range);

      const mid = range?.optimal ? (range.optimal[0] + range.optimal[1]) / 2 : angle;
      deviations[joint.id] = Math.abs(angle - mid);
    }

    results.push({ t: frame.t, index: frame.index, phase, angles, jointStates, deviations });
  }

  return results;
}

// ─── After Action Report ──────────────────────────────────────────────────────

export function generateReport(comparisonResults, blueprint) {
  const validFrames = comparisonResults.filter(f => f.phase !== "unknown");
  if (validFrames.length === 0) return { movementScore: 0, riskLevel: "MODERATE", topFixes: [], phaseBreakdown: {} };

  // 1. Movement score
  const optimalFrames = validFrames.filter(f =>
    Object.values(f.jointStates).filter(Boolean).every(s => s === "OPTIMAL")
  ).length;
  const movementScore = Math.round((optimalFrames / validFrames.length) * 100);

  // 2. Risk level
  const dangerFrames = validFrames.filter(f =>
    Object.values(f.jointStates).some(s => s === "DANGER")
  ).length;
  const dangerPct = dangerFrames / validFrames.length;
  const riskLevel = dangerPct > 0.15 ? "HIGH" : dangerPct > 0.05 ? "MODERATE" : "LOW";

  // 3. Per-joint deviations
  const jointDeviations = {};
  for (const joint of blueprint.joints) {
    const devs  = validFrames.map(f => f.deviations[joint.id] ?? 0);
    const states = validFrames.map(f => f.jointStates[joint.id]).filter(Boolean);
    jointDeviations[joint.id] = {
      avgDeviation: mean(devs),
      worstState: getWorstState(states),
      joint,
    };
  }

  const topFixes = Object.values(jointDeviations)
    .filter(d => d.worstState !== "OPTIMAL")
    .sort((a, b) => b.avgDeviation - a.avgDeviation)
    .slice(0, 3)
    .map(({ joint, worstState }) => {
      const coachingValues = Object.values(joint.coaching);
      return {
        jointId: joint.id,
        jointLabel: joint.label,
        state: worstState,
        suggestion: coachingValues[0] || "Review this joint during movement.",
      };
    });

  // 4. Phase breakdown
  const phaseBreakdown = {};
  for (const frame of validFrames) {
    if (!phaseBreakdown[frame.phase]) phaseBreakdown[frame.phase] = { count: 0, dangerCount: 0 };
    phaseBreakdown[frame.phase].count++;
    if (Object.values(frame.jointStates).some(s => s === "DANGER")) {
      phaseBreakdown[frame.phase].dangerCount++;
    }
  }

  return { movementScore, riskLevel, topFixes, phaseBreakdown };
}

export function getWorstState(states) {
  const order = ["DANGER", "WARNING", "ACCEPTABLE", "OPTIMAL"];
  return order.find(s => states.includes(s)) || "OPTIMAL";
}

// ─── Script loader (mirrors CameraView) ──────────────────────────────────────

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      setTimeout(resolve, 100);
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}