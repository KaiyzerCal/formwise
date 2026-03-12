/**
 * Profile-Based Scoring Engine
 * Evaluates joint angles against movement profile ranges.
 * Returns numeric form score (0-100) with joint-level breakdown and faults.
 */

import { getMovementProfile } from './movementProfiles.js';

/**
 * Score a single joint angle against its profile ranges.
 * Returns { score: 0-100, status: 'ideal'|'warning'|'danger' }
 */
function scoreJointAngle(angle, jointRanges) {
  if (!jointRanges || angle === null || angle === undefined) {
    return { score: null, status: 'unknown' };
  }

  const { ideal, warning, danger } = jointRanges;

  // Check ideal range first
  if (angle >= ideal[0] && angle <= ideal[1]) {
    return { score: 100, status: 'ideal' };
  }

  // Check warning range
  if (angle >= warning[0] && angle <= warning[1]) {
    // Linear interpolation between 100 and 75
    const distFromIdeal = Math.min(
      Math.abs(angle - ideal[0]),
      Math.abs(angle - ideal[1])
    );
    const distFromWarning = Math.min(
      Math.abs(warning[0] - ideal[0]),
      Math.abs(warning[1] - ideal[1])
    );
    const penalty = (distFromIdeal / distFromWarning) * 25;
    return { score: Math.max(75, 100 - penalty), status: 'warning' };
  }

  // Check danger range
  if (angle >= danger[0] && angle <= danger[1]) {
    // Linear interpolation between 75 and 25
    const distFromWarning = Math.min(
      Math.abs(angle - warning[0]),
      Math.abs(angle - warning[1])
    );
    const distFromDanger = Math.min(
      Math.abs(danger[0] - warning[0]),
      Math.abs(danger[1] - warning[1])
    );
    const penalty = (distFromWarning / distFromDanger) * 50;
    return { score: Math.max(25, 75 - penalty), status: 'danger' };
  }

  // Outside all ranges
  return { score: 10, status: 'critical' };
}

/**
 * Extract joint angles from pose data.
 * Maps common pose engine output to normalized joint angles.
 * @param {object} poseData - Raw pose frame from pose engine
 * @returns {object} - { kneeLeft, kneeRight, hipLeft, hipRight, ... }
 */
function extractJointAngles(poseData) {
  return {
    kneeLeft: poseData.kneeLeftAngle ?? poseData.knee_left ?? null,
    kneeRight: poseData.kneeRightAngle ?? poseData.knee_right ?? null,
    hipLeft: poseData.hipLeftAngle ?? poseData.hip_left ?? null,
    hipRight: poseData.hipRightAngle ?? poseData.hip_right ?? null,
    ankleLeft: poseData.ankleLeftAngle ?? poseData.ankle_left ?? null,
    ankleRight: poseData.ankleRightAngle ?? poseData.ankle_right ?? null,
    shoulderLeft: poseData.shoulderLeftAngle ?? poseData.shoulder_left ?? null,
    shoulderRight: poseData.shoulderRightAngle ?? poseData.shoulder_right ?? null,
    elbowLeft: poseData.elbowLeftAngle ?? poseData.elbow_left ?? null,
    elbowRight: poseData.elbowRightAngle ?? poseData.elbow_right ?? null,
    spineAngle: poseData.spineAngle ?? poseData.spine ?? null,
    wristLeft: poseData.wristLeftAngle ?? poseData.wrist_left ?? null,
    wristRight: poseData.wristRightAngle ?? poseData.wrist_right ?? null,
  };
}

/**
 * Calculate bilateral symmetry metric (0-100).
 * Compares left vs right angle pairs.
 */
function calculateSymmetry(angles) {
  const pairs = [
    { left: angles.kneeLeft, right: angles.kneeRight },
    { left: angles.hipLeft, right: angles.hipRight },
    { left: angles.ankleLeft, right: angles.ankleRight },
    { left: angles.shoulderLeft, right: angles.shoulderRight },
    { left: angles.elbowLeft, right: angles.elbowRight },
  ];

  const validPairs = pairs.filter(p => p.left !== null && p.right !== null);
  if (!validPairs.length) return 100;

  const avgDiff = validPairs.reduce((sum, p) => sum + Math.abs(p.left - p.right), 0) / validPairs.length;
  const symmetryScore = Math.max(0, 100 - avgDiff * 2);
  return symmetryScore;
}

/**
 * Detect faults based on joint angle deviations.
 * @param {object} angles - Normalized joint angles
 * @param {object} profile - Movement profile
 * @returns {array} - Array of detected faults
 */
function detectFaults(angles, profile) {
  const faults = [];

  if (!profile || !profile.faults) return faults;

  // Knee valgus: Left and right knee angle asymmetry > 15°
  if (Math.abs((angles.kneeLeft || 0) - (angles.kneeRight || 0)) > 15) {
    faults.push('knee_valgus');
  }

  // Hip shift: Left and right hip angle asymmetry > 15°
  if (Math.abs((angles.hipLeft || 0) - (angles.hipRight || 0)) > 15) {
    faults.push('hip_shift');
  }

  // Forward torso: Spine angle > 30° (indicates forward lean)
  if ((angles.spineAngle ?? 0) > 30) {
    faults.push('forward_torso');
  }

  // Insufficient depth: Average knee angle > 120°
  const avgKnee = ((angles.kneeLeft ?? 0) + (angles.kneeRight ?? 0)) / 2;
  if (avgKnee > 120 && profile.faults.includes('insufficient_depth')) {
    faults.push('insufficient_depth');
  }

  // Elbow flare: Shoulder to elbow angle > 70°
  if ((Math.abs(angles.shoulderLeft ?? 0) - (angles.elbowLeft ?? 0)) > 70 ||
      (Math.abs(angles.shoulderRight ?? 0) - (angles.elbowRight ?? 0)) > 70) {
    if (profile.faults.includes('elbow_flare')) {
      faults.push('elbow_flare');
    }
  }

  return faults;
}

/**
 * Calculate form score (0-100) for a movement based on joint angles.
 * Integrates with movement profiles to evaluate against biomechanical rules.
 *
 * @param {object} poseData - Raw pose frame from pose engine
 * @param {string} movementId - Movement profile ID (e.g. "squat")
 * @returns {object} - { formScore: 0-100, jointScores: {...}, faultsDetected: [...], symmetry: 0-100 }
 */
export function calculateFormScore(poseData, movementId) {
  if (!movementId || !poseData) {
    return {
      formScore: null,
      jointScores: {},
      faultsDetected: [],
      symmetry: null,
      status: 'no_movement'
    };
  }

  const profile = getMovementProfile(movementId);
  if (!profile) {
    return {
      formScore: null,
      jointScores: {},
      faultsDetected: [],
      symmetry: null,
      status: 'unknown_movement'
    };
  }

  // Extract joint angles from pose data
  const angles = extractJointAngles(poseData);

  // Score each primary joint
  const jointScores = {};
  let scoringValues = [];

  profile.primaryJoints.forEach(jointName => {
    const jointRanges = profile.jointRanges[jointName];
    if (!jointRanges) return;

    // Map joint name to angle data
    const angleKey = `${jointName}Left`;
    const angle = angles[angleKey] ?? angles[jointName];

    if (angle !== null && angle !== undefined) {
      const jointScore = scoreJointAngle(angle, jointRanges);
      if (jointScore.score !== null) {
        jointScores[jointName] = jointScore;
        scoringValues.push(jointScore.score);
      }
    }
  });

  // Calculate overall form score
  let formScore = 100;
  if (scoringValues.length > 0) {
    formScore = Math.round(scoringValues.reduce((a, b) => a + b, 0) / scoringValues.length);
  }

  // Apply penalties for detected faults
  const detectedFaults = detectFaults(angles, profile);
  const faultPenalty = detectedFaults.length * 8; // -8 per fault
  formScore = Math.max(0, Math.min(100, formScore - faultPenalty));

  // Calculate symmetry
  const symmetry = calculateSymmetry(angles);

  // Symmetry also impacts score (minor influence)
  if (symmetry < 75) {
    const symmetryPenalty = (75 - symmetry) * 0.1; // Max -5 points
    formScore = Math.max(0, formScore - symmetryPenalty);
  }

  return {
    formScore: Math.round(formScore),
    jointScores,
    faultsDetected: detectedFaults,
    symmetry: Math.round(symmetry),
    status: 'calculated'
  };
}

/**
 * Get color-coded feedback for form score.
 * @param {number} score - Form score 0-100
 * @returns {object} - { color, label, severity }
 */
export function getFormScoreColor(score) {
  if (score === null || score === undefined) return { color: '#6B7280', label: '—', severity: 'unknown' };
  if (score >= 90) return { color: '#22C55E', label: 'EXCELLENT', severity: 'excellent' };
  if (score >= 75) return { color: '#EAB308', label: 'GOOD', severity: 'good' };
  if (score >= 60) return { color: '#F97316', label: 'FAIR', severity: 'fair' };
  return { color: '#EF4444', label: 'POOR', severity: 'poor' };
}

/**
 * Aggregate form scores over time.
 * @param {array} scoreHistory - Array of form score samples
 * @returns {object} - { average, peak, lowest, trend }
 */
export function aggregateFormScores(scoreHistory) {
  if (!scoreHistory || !scoreHistory.length) {
    return { average: null, peak: null, lowest: null, trend: 'neutral' };
  }

  const scores = scoreHistory.filter(s => s !== null && s !== undefined);
  if (!scores.length) return { average: null, peak: null, lowest: null, trend: 'neutral' };

  const average = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const peak = Math.max(...scores);
  const lowest = Math.min(...scores);

  // Determine trend: improving, declining, or stable
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2)).reduce((a, b) => a + b, 0) / Math.max(1, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2)).reduce((a, b) => a + b, 0) / Math.max(1, Math.ceil(scores.length / 2));
  const trend = secondHalf > firstHalf + 2 ? 'improving' : secondHalf < firstHalf - 2 ? 'declining' : 'stable';

  return { average, peak, lowest, trend };
}