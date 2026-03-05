// Offline video analysis engine — fully separate from live camera pipeline

import { EXERCISES } from "./exerciseLibrary";
import { SPORTS_MOVEMENTS } from "./sportsLibrary";
import { detectPhase } from "./phaseDetector";

const ALL_MOVEMENTS = [...EXERCISES, ...SPORTS_MOVEMENTS];

// ── Frame extraction ──────────────────────────────────────────────────────────

export async function extractFrames(videoFile, targetFPS = 10, onProgress) {
  const video = document.createElement("video");
  video.muted = true;
  video.src = URL.createObjectURL(videoFile);

  await new Promise((resolve, reject) => {
    video.onloadedmetadata = resolve;
    video.onerror = reject;
  });

  const duration = video.duration;
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");

  const interval = 1 / targetFPS;
  const totalFrames = Math.floor(duration / interval);
  const frames = [];

  for (let i = 0; i < totalFrames; i++) {
    const t = i * interval;
    video.currentTime = t;
    await new Promise((r) => (video.onseeked = r));
    ctx.drawImage(video, 0, 0, 640, 360);
    frames.push({ t, imageData: canvas.toDataURL("image/jpeg", 0.7) });
    if (onProgress) onProgress((i + 1) / totalFrames);
  }

  URL.revokeObjectURL(video.src);
  return { frames, duration };
}

// ── Load image helper ─────────────────────────────────────────────────────────

function loadImage(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = dataUrl;
  });
}

// ── Offline pose inference ────────────────────────────────────────────────────

export async function analyzeFrames(frames, poseDetector, onProgress) {
  const results = [];

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const img = await loadImage(frame.imageData);

    const detected = await new Promise((resolve) => {
      poseDetector.onResults((r) => resolve(r));
      poseDetector.send({ image: img });
    });

    const landmarks = detected?.poseLandmarks || null;
    const confidence = landmarks
      ? landmarks.reduce((s, l) => s + (l.visibility || 0), 0) / landmarks.length
      : 0;

    results.push({ t: frame.t, landmarks, confidence });
    if (onProgress) onProgress((i + 1) / frames.length);
  }

  return results;
}

// ── Multi-person detection ────────────────────────────────────────────────────

export function detectMultiPerson(frameResults) {
  // MediaPipe returns one pose, but we check if hip midpoint varies wildly
  // across frames as a proxy for scene changes (simplified heuristic)
  const hipXValues = frameResults
    .filter((f) => f.landmarks && f.confidence > 0.55)
    .map((f) => {
      const lh = f.landmarks[23];
      const rh = f.landmarks[24];
      return lh && rh ? (lh.x + rh.x) / 2 : null;
    })
    .filter((v) => v !== null);

  if (hipXValues.length < 5) return false;

  const min = Math.min(...hipXValues);
  const max = Math.max(...hipXValues);
  // If hip midpoint spans > 20% of frame width across frames, flag multi-person
  return max - min > 0.2;
}

// ── Movement classification ───────────────────────────────────────────────────

function getAngleRange(frameResults, jointLabel) {
  const angles = frameResults
    .filter((f) => f.jointAngles && f.jointAngles[jointLabel] !== undefined)
    .map((f) => f.jointAngles[jointLabel]);
  if (angles.length === 0) return 0;
  return Math.max(...angles) - Math.min(...angles);
}

export function classifyMovement(frameResults) {
  const knee = getAngleRange(frameResults, "KNEE");
  const hip = getAngleRange(frameResults, "HIP");
  const shoulder = getAngleRange(frameResults, "SHOULDER");
  const elbow = getAngleRange(frameResults, "ELBOW");
  const spine = getAngleRange(frameResults, "SPINE");

  if (knee > 40 && hip > 35) return "squat";
  if (knee > 50 && hip > 50) return "lunge";
  if (elbow > 80 && shoulder < 20) return "pushup";
  if (elbow > 60 && shoulder > 60 && knee < 20) return "overhead_press";
  if (elbow > 40 && spine < 15) return "bench_press";
  if (shoulder > 60 && elbow > 50 && spine > 20) return "golf_swing";
  if (elbow > 50 && knee > 30 && spine > 15) return "tennis_serve";
  if (knee > 30 && elbow > 30 && hip > 20) return "basketball_shot";
  if (hip > 50 && knee > 60) return "soccer_kick";
  if (elbow > 40 && shoulder > 50) return "football_throw";
  return "unknown";
}

// ── Angle helpers (mirrors poseEngine) ───────────────────────────────────────

function calcAngle(A, B, C) {
  const radians =
    Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return Math.round(angle);
}

function getLandmarks(landmarks, indices) {
  if (!landmarks || !indices) return null;
  const pts = indices.map((i) => landmarks[i]).filter(Boolean);
  if (pts.length < 3) return null;
  return pts;
}

// ── Score session ─────────────────────────────────────────────────────────────

export function scoreSession(frameResults, exerciseProtocol) {
  if (!exerciseProtocol) {
    // Generic scoring
    const confidences = frameResults
      .filter((f) => f.confidence > 0.55)
      .map((f) => f.confidence);
    const avgConf = confidences.length
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0;
    return { overallScore: Math.round(avgConf * 100), jointScores: {}, riskFlag: "SAFE" };
  }

  const validFrames = frameResults.filter(
    (f) => f.landmarks && f.confidence > 0.55
  );
  const jointScores = {};

  exerciseProtocol.joints.forEach((joint) => {
    if (joint.landmarks === "spine_lean") return; // skip complex joints for now

    const angles = validFrames
      .map((f) => {
        const pts = getLandmarks(f.landmarks, joint.landmarks);
        if (!pts) return null;
        return calcAngle(pts[0], pts[1], pts[2]);
      })
      .filter((a) => a !== null);

    if (angles.length === 0) return;

    const [optMin, optMax] = joint.optimal;
    const optimalFrames = angles.filter(
      (a) => a >= optMin && a <= optMax
    ).length;

    const mean = Math.round(angles.reduce((s, v) => s + v, 0) / angles.length);
    const worstAngle = angles.reduce((worst, a) => {
      const devWorst = Math.max(
        0,
        Math.max(optMin - worst, worst - optMax)
      );
      const devA = Math.max(0, Math.max(optMin - a, a - optMax));
      return devA > devWorst ? a : worst;
    }, angles[0]);

    let state = "OPTIMAL";
    if (mean < joint.acceptable[0] || mean > joint.acceptable[1]) state = "WARNING";
    if (joint.danger) {
      if (joint.danger.below !== null && mean < joint.danger.below) state = "DANGER";
      if (joint.danger.above !== null && mean > joint.danger.above) state = "DANGER";
    }
    if (
      state === "OPTIMAL" &&
      (mean < joint.optimal[0] || mean > joint.optimal[1])
    )
      state = "ACCEPTABLE";

    jointScores[joint.label] = {
      name: joint.name,
      avg: mean,
      min: Math.min(...angles),
      max: Math.max(...angles),
      optimalPct: optimalFrames / angles.length,
      worstAngle,
      state,
    };
  });

  const values = Object.values(jointScores);
  const overallScore =
    values.length > 0
      ? Math.round(
          values.reduce((s, j) => s + j.optimalPct * 100, 0) / values.length
        )
      : 0;

  let riskFlag = "SAFE";
  if (values.some((j) => j.state === "DANGER")) riskFlag = "DANGER";
  else if (values.filter((j) => j.state === "WARNING").length >= 1)
    riskFlag = "CAUTION";

  return { overallScore, jointScores, riskFlag };
}

// ── Compute joint angles per frame ────────────────────────────────────────────

export function computeFrameAngles(frameResults, exerciseProtocol) {
  return frameResults.map((frame) => {
    if (!frame.landmarks) return { ...frame, jointAngles: {}, worstState: "OPTIMAL" };

    const jointAngles = {};
    const stateOrder = ["OPTIMAL", "ACCEPTABLE", "WARNING", "DANGER"];
    let worstState = "OPTIMAL";

    exerciseProtocol?.joints?.forEach((joint) => {
      if (joint.landmarks === "spine_lean") return;
      const pts = getLandmarks(frame.landmarks, joint.landmarks);
      if (!pts) return;
      const angle = calcAngle(pts[0], pts[1], pts[2]);
      jointAngles[joint.label] = angle;

      const [optMin, optMax] = joint.optimal;
      let state = "OPTIMAL";
      if (angle < joint.acceptable[0] || angle > joint.acceptable[1]) state = "WARNING";
      if (joint.danger) {
        if (joint.danger.below !== null && angle < joint.danger.below) state = "DANGER";
        if (joint.danger.above !== null && angle > joint.danger.above) state = "DANGER";
      }
      if (state === "OPTIMAL" && (angle < optMin || angle > optMax)) state = "ACCEPTABLE";

      if (stateOrder.indexOf(state) > stateOrder.indexOf(worstState)) {
        worstState = state;
      }
    });

    return { ...frame, jointAngles, worstState };
  });
}

// ── Phase tagging ─────────────────────────────────────────────────────────────

export function tagFramePhases(frameResults, exerciseProtocol) {
  if (!exerciseProtocol?.phases) return frameResults;

  let currentPhase = null;
  return frameResults.map((frame) => {
    if (!frame.landmarks) return { ...frame, phase: currentPhase };

    // Build joint result array compatible with detectPhase
    const jointResultsForPhase = (exerciseProtocol.joints || []).map((j) => ({
      label: j.label,
      angle: frame.jointAngles?.[j.label] ?? null,
    }));

    const newPhase = detectPhase(exerciseProtocol.id, jointResultsForPhase, currentPhase);
    if (newPhase) currentPhase = newPhase;
    return { ...frame, phase: currentPhase };
  });
}

// ── Get movement by id ────────────────────────────────────────────────────────

export function getMovementById(id) {
  return ALL_MOVEMENTS.find((m) => m.id === id);
}