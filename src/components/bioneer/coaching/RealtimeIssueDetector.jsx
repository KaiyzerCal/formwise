/**
 * RealtimeIssueDetector.js
 * 
 * Continuous frame-by-frame detection of movement issues.
 * Goal: Detect issues as they BEGIN, not after they complete.
 * 
 * Returns: { issue_type, severity, joint, predicted_correction_moment }
 */

/**
 * Detect issues from current pose frame
 * Call this every 50-100ms during live capture
 */
export function detectRealtimeIssues(currentFrame, previousFrames = [], userProfile = null) {
  if (!currentFrame?.landmarks) {
    return [];
  }

  const issues = [];

  // Check each issue type
  issues.push(...detectMisalignment(currentFrame, previousFrames));
  issues.push(...detectInstability(currentFrame, previousFrames));
  issues.push(...detectRangeIssues(currentFrame, previousFrames));

  // Sort by severity (highest first)
  issues.sort((a, b) => b.severity - a.severity);

  return issues;
}

/**
 * Misalignment detection: knees, hips, back, shoulders
 * Severity: 0-100
 */
function detectMisalignment(frame, previousFrames) {
  const issues = [];
  const landmarks = frame.landmarks;

  // Knee valgus/varus (inward collapse)
  const leftKneeAlignment = getKneeAlignment(landmarks, 'left');
  const rightKneeAlignment = getKneeAlignment(landmarks, 'right');

  if (leftKneeAlignment.deviation > 25) {
    issues.push({
      type: 'knee_misalignment',
      joint: 'left_knee',
      severity: Math.min(100, leftKneeAlignment.deviation * 2),
      message: 'Knees out',
      shortMessage: 'Knees',
      priority: 'high',
      correctionPoint: leftKneeAlignment.correctionDepth,
    });
  }

  if (rightKneeAlignment.deviation > 25) {
    issues.push({
      type: 'knee_misalignment',
      joint: 'right_knee',
      severity: Math.min(100, rightKneeAlignment.deviation * 2),
      message: 'Knees out',
      shortMessage: 'Knees',
      priority: 'high',
      correctionPoint: rightKneeAlignment.correctionDepth,
    });
  }

  // Hip drop (asymmetry)
  const hipDrop = getHipAsymmetry(landmarks);
  if (hipDrop.deviation > 20) {
    issues.push({
      type: 'hip_drop',
      joint: hipDrop.droopingSide + '_hip',
      severity: Math.min(100, hipDrop.deviation * 1.5),
      message: 'Level hips',
      shortMessage: 'Hips',
      priority: 'medium',
    });
  }

  // Back alignment
  const spineAlignment = getSpineAlignment(landmarks);
  if (spineAlignment.deviation > 30) {
    issues.push({
      type: 'back_rounding',
      joint: 'spine',
      severity: Math.min(100, spineAlignment.deviation * 2),
      message: 'Chest up',
      shortMessage: 'Chest',
      priority: 'high',
    });
  }

  return issues;
}

/**
 * Instability detection: wobble, tremor, asymmetry
 */
function detectInstability(frame, previousFrames) {
  if (previousFrames.length < 3) return [];

  const issues = [];

  // Calculate joint variance over last 3 frames
  const recentFrames = [frame, ...previousFrames.slice(0, 3)];

  // Knee tremor
  const kneeStability = getJointVariance(recentFrames, 'knee');
  if (kneeStability.variance > 8) {
    issues.push({
      type: 'knee_instability',
      joint: 'knee',
      severity: Math.min(100, kneeStability.variance * 5),
      message: 'Control the movement',
      shortMessage: 'Steady',
      priority: 'medium',
    });
  }

  // Ankle wobble
  const ankleStability = getJointVariance(recentFrames, 'ankle');
  if (ankleStability.variance > 10) {
    issues.push({
      type: 'ankle_instability',
      joint: 'ankle',
      severity: Math.min(100, ankleStability.variance * 4),
      message: 'Stable base',
      shortMessage: 'Stable',
      priority: 'low',
    });
  }

  return issues;
}

/**
 * Range of motion issues
 */
function detectRangeIssues(frame, previousFrames) {
  const issues = [];
  const landmarks = frame.landmarks;

  // Shallow depth (e.g., squat)
  const kneeDepth = getKneeDepth(landmarks);
  if (kneeDepth < 70) {
    issues.push({
      type: 'shallow_depth',
      joint: 'knee',
      severity: Math.min(100, (100 - kneeDepth) * 0.8),
      message: 'Go deeper',
      shortMessage: 'Deeper',
      priority: 'medium',
    });
  }

  return issues;
}

// ─────────────────────────────────────────────────────────────────────────────
// Joint Analysis Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getKneeAlignment(landmarks, side) {
  // Get left/right knee, hip, ankle
  const hip = landmarks[side === 'left' ? 23 : 24]; // Hip
  const knee = landmarks[side === 'left' ? 25 : 26]; // Knee
  const ankle = landmarks[side === 'left' ? 27 : 28]; // Ankle

  if (!hip || !knee || !ankle) return { deviation: 0, correctionDepth: 0 };

  // Calculate deviation from vertical (knee should be over ankle)
  const hipKneeVector = { x: knee.x - hip.x, y: knee.y - hip.y };
  const kneeAnkleVector = { x: ankle.x - knee.x, y: ankle.y - knee.y };

  // Dot product to find alignment
  const dot = hipKneeVector.x * kneeAnkleVector.x + hipKneeVector.y * kneeAnkleVector.y;
  const mag1 = Math.sqrt(hipKneeVector.x ** 2 + hipKneeVector.y ** 2);
  const mag2 = Math.sqrt(kneeAnkleVector.x ** 2 + kneeAnkleVector.y ** 2);

  const cosAngle = mag1 > 0 && mag2 > 0 ? dot / (mag1 * mag2) : 0;
  const deviation = Math.abs(Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180 / Math.PI - 180);

  return {
    deviation: Math.min(90, deviation),
    correctionDepth: knee.y, // When to trigger cue
  };
}

function getHipAsymmetry(landmarks) {
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  if (!leftHip || !rightHip) return { deviation: 0, droopingSide: 'center' };

  const asymmetry = Math.abs(leftHip.y - rightHip.y) * 100;

  return {
    deviation: asymmetry,
    droopingSide: leftHip.y > rightHip.y ? 'left' : 'right',
  };
}

function getSpineAlignment(landmarks) {
  const neck = landmarks[1];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  if (!neck || !leftHip || !rightHip) return { deviation: 0 };

  const hipMidpoint = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };

  // Angle from hip to neck (should be ~vertical)
  const spineVector = { x: neck.x - hipMidpoint.x, y: neck.y - hipMidpoint.y };
  const verticalVector = { x: 0, y: 1 };

  const dot = spineVector.y;
  const mag = Math.sqrt(spineVector.x ** 2 + spineVector.y ** 2);
  const cosAngle = mag > 0 ? dot / mag : 0;
  const deviation = Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180 / Math.PI;

  return {
    deviation: deviation,
  };
}

function getJointVariance(frames, joint) {
  const positions = frames.map(f => {
    const landmarkIdx = {
      knee: 25,
      ankle: 27,
    }[joint];

    if (!f.landmarks?.[landmarkIdx]) return { x: 0, y: 0 };
    return { x: f.landmarks[landmarkIdx].x, y: f.landmarks[landmarkIdx].y };
  });

  // Calculate variance
  const meanX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
  const meanY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;

  const variance = positions.reduce(
    (sum, p) => sum + (p.x - meanX) ** 2 + (p.y - meanY) ** 2,
    0
  ) / positions.length;

  return { variance: Math.sqrt(variance) * 100 };
}

function getKneeDepth(landmarks) {
  const hip = landmarks[23] || landmarks[24];
  const knee = landmarks[25] || landmarks[26];

  if (!hip || !knee) return 100;

  // Depth as percentage (0 = full depth, 100 = no squat)
  const depth = ((knee.y - hip.y) / (knee.y - hip.y + 0.1)) * 100;
  return Math.max(0, Math.min(100, depth));
}