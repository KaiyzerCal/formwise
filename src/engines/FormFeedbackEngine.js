/**
 * FormFeedbackEngine — Per-frame synchronous form evaluator
 * Runs every frame inside the inference loop. Must stay lightweight.
 *
 * Reads joint angles + exercise thresholds → emits GREEN / YELLOW / RED
 * with a list of specific joint alerts and coaching cues.
 */

import { MOVEMENT_PROFILES } from '@/components/bioneer/movementProfiles/movementProfiles';
import { COACHING_LIBRARY } from '@/components/bioneer/coaching/coachingLibrary';
import { speak } from '@/components/bioneer/audioEngine';

// Default thresholds per exercise (all angles in degrees)
const DEFAULT_THRESHOLDS = {
  squat: {
    knee_valgus:     { joint: 'knee',  key: 'kneeValgusAngle',  warn: 10, danger: 20,  issue: 'valgus collapse' },
    spine_forward:   { joint: 'spine', key: 'spineAngle',       warn: 30, danger: 45,  issue: 'forward lean' },
    hip_depth:       { joint: 'hip',   key: 'hipAngle',         warnHi: 120, dangerHi: 140, issue: 'insufficient depth', hi: true },
  },
  deadlift: {
    spine_rounding:  { joint: 'spine', key: 'spineAngle',       warn: 20, danger: 35,  issue: 'spine rounding' },
    hip_squat:       { joint: 'hip',   key: 'hipAngle',         warn: 100, danger: 115, issue: 'squatting the pull' },
  },
  pushup: {
    hip_sag:         { joint: 'hip',   key: 'hipSagDeg',        warn: 10, danger: 20,  issue: 'hip sag' },
    elbow_flare:     { joint: 'elbow', key: 'elbowFlareAngle',  warn: 55, danger: 75,  issue: 'elbow flare' },
  },
};

/**
 * buildThresholdsFromProfile(exerciseId)
 * Maps jointRanges (ideal/warning/danger) from MOVEMENT_PROFILES
 * into the engine's internal evaluator format.
 */
export function buildThresholdsFromProfile(exerciseId) {
  const profile = MOVEMENT_PROFILES[exerciseId];
  if (!profile || !profile.jointRanges) return null;

  const thresholds = {};
  for (const [joint, ranges] of Object.entries(profile.jointRanges)) {
    // Upper bound thresholds (angle too high)
    thresholds[`${joint}_high`] = {
      joint,
      key: `${joint}Angle`,
      warn: ranges.warning[1],
      danger: ranges.danger[1],
      issue: `${joint} angle too high`,
    };
    // Lower bound thresholds (angle too low)
    thresholds[`${joint}_low`] = {
      joint,
      key: `${joint}Angle`,
      warnHi: ranges.warning[0],
      dangerHi: ranges.danger[0],
      issue: `${joint} angle too low`,
      hi: false,  // inverted: value BELOW threshold is bad
      lo: true,
    };
  }
  return thresholds;
}

// Voice cue debounce: 1.5s between spoken cues
let _lastCueTime = 0;
const CUE_DEBOUNCE_MS = 1500;

/**
 * Map an alert to a coaching cue string from the COACHING_LIBRARY.
 */
function getCueForAlert(exerciseId, alert) {
  const lib = COACHING_LIBRARY[exerciseId] || COACHING_LIBRARY.default;
  // Try matching by joint name
  const cue = lib[alert.joint];
  if (cue) return cue.message;
  // Fallback to default library
  const fallback = COACHING_LIBRARY.default[alert.joint];
  if (fallback) return fallback.message;
  return null;
}

/**
 * evaluateForm({ jointAngles, phase, exerciseId, thresholds? })
 * → { status: 'green'|'yellow'|'red', alerts: [...], cues: string[] }
 *
 * Synchronous and branch-minimal. O(N_thresholds) per frame.
 * Now also returns coaching cues and auto-triggers voice.
 */
export function evaluateForm({ jointAngles, exerciseId, thresholds: customThresholds }) {
  // Resolve thresholds: custom > hardcoded default > auto-built from profile
  const thresholds = customThresholds
    ?? DEFAULT_THRESHOLDS[exerciseId]
    ?? buildThresholdsFromProfile(exerciseId)
    ?? {};

  const alerts = [];

  for (const [, rule] of Object.entries(thresholds)) {
    const val = jointAngles?.[rule.key];
    if (val == null) continue;

    if (rule.lo) {
      // Low-value threshold (angle below range = bad)
      if (val <= rule.dangerHi) {
        alerts.push({ joint: rule.joint, issue: rule.issue, severity: 'high' });
      } else if (val <= rule.warnHi) {
        alerts.push({ joint: rule.joint, issue: rule.issue, severity: 'medium' });
      }
    } else if (rule.hi) {
      // High-value threshold (e.g. hip angle too large = not deep enough)
      if (val >= rule.dangerHi) {
        alerts.push({ joint: rule.joint, issue: rule.issue, severity: 'high' });
      } else if (val >= rule.warnHi) {
        alerts.push({ joint: rule.joint, issue: rule.issue, severity: 'medium' });
      }
    } else {
      if (val >= rule.danger) {
        alerts.push({ joint: rule.joint, issue: rule.issue, severity: 'high' });
      } else if (val >= rule.warn) {
        alerts.push({ joint: rule.joint, issue: rule.issue, severity: 'medium' });
      }
    }
  }

  const status =
    alerts.some(a => a.severity === 'high')   ? 'red'    :
    alerts.some(a => a.severity === 'medium') ? 'yellow' :
    'green';

  // Build coaching cues from alerts
  const cues = [];
  for (const alert of alerts) {
    const cue = getCueForAlert(exerciseId, alert);
    if (cue && !cues.includes(cue)) cues.push(cue);
  }

  // Trigger voice coaching with 1.5s debounce
  if (cues.length > 0) {
    const now = Date.now();
    if (now - _lastCueTime >= CUE_DEBOUNCE_MS) {
      _lastCueTime = now;
      speak(cues[0]); // Speak highest priority cue
    }
  }

  return { status, alerts, cues };
}

export { DEFAULT_THRESHOLDS };