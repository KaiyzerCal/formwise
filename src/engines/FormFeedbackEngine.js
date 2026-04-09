/**
 * FormFeedbackEngine — Per-frame synchronous form evaluator
 * Runs every frame inside the inference loop. Must stay lightweight.
 *
 * Reads joint angles + exercise thresholds → emits GREEN / YELLOW / RED
 * with a list of specific joint alerts.
 */

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
 * evaluateForm({ jointAngles, phase, exerciseId, thresholds? })
 * → { status: 'green'|'yellow'|'red', alerts: [{ joint, issue, severity }] }
 *
 * Synchronous and branch-minimal. O(N_thresholds) per frame.
 */
export function evaluateForm({ jointAngles, exerciseId, thresholds: customThresholds }) {
  const thresholds = customThresholds ?? DEFAULT_THRESHOLDS[exerciseId] ?? {};
  const alerts = [];

  for (const [, rule] of Object.entries(thresholds)) {
    const val = jointAngles?.[rule.key];
    if (val == null) continue;

    if (rule.hi) {
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

  return { status, alerts };
}

export { DEFAULT_THRESHOLDS };