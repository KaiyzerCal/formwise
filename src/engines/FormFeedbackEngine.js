/**
 * FormFeedbackEngine — Per-frame synchronous form evaluator
 * Runs every frame inside the inference loop. Must stay lightweight.
 *
 * Reads joint angles + exercise thresholds → emits GREEN / YELLOW / RED
 * with a list of specific joint alerts + voice coaching cues.
 */

import { MOVEMENT_PROFILES } from '@/components/bioneer/movementProfiles/movementProfiles';
import { getCoachingCue } from '@/components/bioneer/coaching/coachingLibrary';

// Default thresholds per exercise (all angles in degrees)
const DEFAULT_THRESHOLDS = {
  squat: {
    knee_valgus:     { joint: 'knee',  key: 'kneeValgusAngle',  warn: 10, danger: 20,  issue: 'valgus collapse', faultId: 'knee_valgus' },
    spine_forward:   { joint: 'spine', key: 'spineAngle',       warn: 30, danger: 45,  issue: 'forward lean', faultId: 'forward_torso' },
    hip_depth:       { joint: 'hip',   key: 'hipAngle',         warnHi: 120, dangerHi: 140, issue: 'insufficient depth', hi: true, faultId: 'insufficient_depth' },
  },
  deadlift: {
    spine_rounding:  { joint: 'spine', key: 'spineAngle',       warn: 20, danger: 35,  issue: 'spine rounding', faultId: 'spine_rounding' },
    hip_squat:       { joint: 'hip',   key: 'hipAngle',         warn: 100, danger: 115, issue: 'squatting the pull', faultId: 'hip_squat_pattern' },
  },
  pushup: {
    hip_sag:         { joint: 'hip',   key: 'hipSagDeg',        warn: 10, danger: 20,  issue: 'hip sag', faultId: 'hip_sag' },
    elbow_flare:     { joint: 'elbow', key: 'elbowFlareAngle',  warn: 55, danger: 75,  issue: 'elbow flare', faultId: 'elbow_flare' },
  },
};

/**
 * Build evaluator thresholds from a MOVEMENT_PROFILES entry.
 * Maps jointRanges (ideal/warning/danger arrays) into per-joint rules.
 */
function buildThresholdsFromProfile(exerciseId) {
  const profile = MOVEMENT_PROFILES[exerciseId];
  if (!profile) return null;

  const thresholds = {};
  const faults = profile.faults || [];

  Object.entries(profile.jointRanges).forEach(([joint, ranges]) => {
    // Lower bound check — angle too low
    const lowKey = `${joint}_low`;
    thresholds[lowKey] = {
      joint,
      key: `${joint}Angle`,
      warn: ranges.warning[0],
      danger: ranges.danger[0],
      issue: `${joint} angle too low`,
      faultId: faults.find(f => f.includes(joint)) || `${joint}_deviation`,
      invertCheck: true, // alert when BELOW threshold
    };

    // Upper bound check — angle too high
    const highKey = `${joint}_high`;
    thresholds[highKey] = {
      joint,
      key: `${joint}Angle`,
      warnHi: ranges.warning[1],
      dangerHi: ranges.danger[1],
      issue: `${joint} angle too high`,
      faultId: faults.find(f => f.includes(joint)) || `${joint}_deviation`,
      hi: true,
    };
  });

  return thresholds;
}

/**
 * evaluateForm({ jointAngles, phase, exerciseId, thresholds? })
 * → { status: 'green'|'yellow'|'red', alerts: [{ joint, issue, severity, faultId }], cues: string[] }
 *
 * Synchronous and branch-minimal. O(N_thresholds) per frame.
 */
export function evaluateForm({ jointAngles, exerciseId, thresholds: customThresholds }) {
  const thresholds = customThresholds
    ?? DEFAULT_THRESHOLDS[exerciseId]
    ?? buildThresholdsFromProfile(exerciseId)
    ?? {};

  const alerts = [];

  for (const [, rule] of Object.entries(thresholds)) {
    const val = jointAngles?.[rule.key];
    if (val == null) continue;

    if (rule.invertCheck) {
      // Low-bound: alert when value is BELOW threshold
      if (val <= rule.danger) {
        alerts.push({ joint: rule.joint, issue: rule.issue, severity: 'high', faultId: rule.faultId });
      } else if (val <= rule.warn) {
        alerts.push({ joint: rule.joint, issue: rule.issue, severity: 'medium', faultId: rule.faultId });
      }
    } else if (rule.hi) {
      // High-value threshold (e.g. hip angle too large = not deep enough)
      if (val >= rule.dangerHi) {
        alerts.push({ joint: rule.joint, issue: rule.issue, severity: 'high', faultId: rule.faultId });
      } else if (val >= rule.warnHi) {
        alerts.push({ joint: rule.joint, issue: rule.issue, severity: 'medium', faultId: rule.faultId });
      }
    } else {
      if (val >= rule.danger) {
        alerts.push({ joint: rule.joint, issue: rule.issue, severity: 'high', faultId: rule.faultId });
      } else if (val >= rule.warn) {
        alerts.push({ joint: rule.joint, issue: rule.issue, severity: 'medium', faultId: rule.faultId });
      }
    }
  }

  // Map alerts to voice coaching cues
  const cues = alerts.map(alert => {
    const cue = getCoachingCue(exerciseId, alert.joint);
    return cue?.message || null;
  }).filter(Boolean);

  // Deduplicate cues
  const uniqueCues = [...new Set(cues)];

  const status =
    alerts.some(a => a.severity === 'high')   ? 'red'    :
    alerts.some(a => a.severity === 'medium') ? 'yellow' :
    'green';

  return { status, alerts, cues: uniqueCues };
}

export { DEFAULT_THRESHOLDS };