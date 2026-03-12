/**
 * FatigueDetector.js
 * Detects fatigue indicators during and after session
 * Triggers coaching feedback through audio engine
 */

/**
 * Main fatigue detection logic
 * Analyzes rep progression for fatigue indicators
 */
export function detectFatigue(sessionMetrics) {
  if (!sessionMetrics?.allMetrics || sessionMetrics.allMetrics.length < 4) {
    return {
      fatigueDetected: false,
      severity: 'none',
      indicators: [],
      recommendation: null,
    };
  }

  const reps = sessionMetrics.allMetrics;
  const indicators = [];

  // Check speed degradation
  const speedDegradation = analyzeSpeedTrend(reps);
  if (speedDegradation.detected) {
    indicators.push({
      type: 'speed_degradation',
      severity: speedDegradation.severity,
      value: speedDegradation.percentChange.toFixed(1),
    });
  }

  // Check ROM reduction
  const romDegradation = analyzeROMTrend(reps);
  if (romDegradation.detected) {
    indicators.push({
      type: 'rom_reduction',
      severity: romDegradation.severity,
      value: romDegradation.percentChange.toFixed(1),
    });
  }

  // Check stability drop
  const stabilityDrop = analyzeStabilityTrend(reps);
  if (stabilityDrop.detected) {
    indicators.push({
      type: 'stability_drop',
      severity: stabilityDrop.severity,
      value: stabilityDrop.percentChange.toFixed(1),
    });
  }

  // Check form score decline
  const formDegradation = analyzeFormScoreTrend(reps);
  if (formDegradation.detected) {
    indicators.push({
      type: 'form_degradation',
      severity: formDegradation.severity,
      value: formDegradation.percentChange.toFixed(1),
    });
  }

  // Determine overall fatigue status
  const fatigueDetected = indicators.length >= 2; // Need 2+ indicators
  const maxSeverity = indicators.length > 0
    ? Math.max(...indicators.map(i => ({ high: 3, medium: 2, low: 1 }[i.severity] || 0)))
    : 0;

  const severity = maxSeverity >= 3 ? 'high' : maxSeverity >= 2 ? 'medium' : 'low';

  return {
    fatigueDetected,
    severity,
    indicators,
    recommendation: getRecommendation(fatigueDetected, severity, indicators),
  };
}

/**
 * Analyze speed trend across session
 */
function analyzeSpeedTrend(reps) {
  const repsArray = Array.isArray(reps) ? reps : [];
  if (repsArray.length < 4) return { detected: false };

  const durations = repsArray.map(r => r.repDuration).filter(d => d > 0);
  if (durations.length < 4) return { detected: false };

  // Compare first 3 to last 3
  const first3Avg = durations.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const last3Avg = durations.slice(-3).reduce((a, b) => a + b, 0) / 3;

  const percentChange = ((last3Avg - first3Avg) / first3Avg) * 100;
  const detected = percentChange > 25; // Reps slowing by 25%+

  return {
    detected,
    severity: percentChange > 50 ? 'high' : percentChange > 35 ? 'medium' : 'low',
    percentChange,
  };
}

/**
 * Analyze Range of Motion trend
 */
function analyzeROMTrend(reps) {
  const repsArray = Array.isArray(reps) ? reps : [];
  if (repsArray.length < 4) return { detected: false };

  // Use knee depth as proxy for ROM
  const depths = repsArray.map(r => r.kneeAngleMin).filter(d => d > 0);
  if (depths.length < 4) return { detected: false };

  const first3Avg = depths.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const last3Avg = depths.slice(-3).reduce((a, b) => a + b, 0) / 3;

  const percentChange = ((first3Avg - last3Avg) / first3Avg) * 100; // Positive = reduction
  const detected = percentChange > 10; // ROM reduced by 10%+

  return {
    detected,
    severity: percentChange > 20 ? 'high' : percentChange > 15 ? 'medium' : 'low',
    percentChange,
  };
}

/**
 * Analyze stability trend
 */
function analyzeStabilityTrend(reps) {
  const repsArray = Array.isArray(reps) ? reps : [];
  if (repsArray.length < 4) return { detected: false };

  const stabilities = repsArray.map(r => 1 - (r.stabilityVariance || 0));
  if (stabilities.length < 4) return { detected: false };

  const first3Avg = stabilities.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const last3Avg = stabilities.slice(-3).reduce((a, b) => a + b, 0) / 3;

  const percentChange = ((first3Avg - last3Avg) / first3Avg) * 100;
  const detected = percentChange > 15; // Stability dropped by 15%+

  return {
    detected,
    severity: percentChange > 30 ? 'high' : percentChange > 20 ? 'medium' : 'low',
    percentChange,
  };
}

/**
 * Analyze form score trend
 */
function analyzeFormScoreTrend(reps) {
  const repsArray = Array.isArray(reps) ? reps : [];
  if (repsArray.length < 4) return { detected: false };

  const scores = repsArray.map(r => r.formScore).filter(s => s > 0);
  if (scores.length < 4) return { detected: false };

  const first3Avg = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const last3Avg = scores.slice(-3).reduce((a, b) => a + b, 0) / 3;

  const percentChange = ((first3Avg - last3Avg) / first3Avg) * 100;
  const detected = percentChange > 10; // Form score declined 10%+

  return {
    detected,
    severity: percentChange > 20 ? 'high' : percentChange > 15 ? 'medium' : 'low',
    percentChange,
  };
}

/**
 * Generate recommendation based on fatigue
 */
function getRecommendation(fatigueDetected, severity, indicators) {
  if (!fatigueDetected) return null;

  const indicatorTypes = indicators.map(i => i.type);

  if (severity === 'high') {
    return {
      text: 'Form degrading — consider ending set.',
      level: 'critical',
      urgent: true,
    };
  }

  if (severity === 'medium') {
    if (indicatorTypes.includes('speed_degradation')) {
      return {
        text: 'Tempo slowing — focus on controlled movement.',
        level: 'warning',
        urgent: false,
      };
    }
    if (indicatorTypes.includes('rom_reduction')) {
      return {
        text: 'Range of motion decreasing — check depth.',
        level: 'warning',
        urgent: false,
      };
    }
    return {
      text: 'Form consistency declining — maintain control.',
      level: 'warning',
      urgent: false,
    };
  }

  return {
    text: 'Monitor fatigue — avoid form breakdown.',
    level: 'info',
    urgent: false,
  };
}

/**
 * Get fatigue label for UI display
 */
export function getFatigueLabel(severity) {
  const labels = {
    high: { text: 'FATIGUE HIGH', color: '#EF4444', icon: '⚠️' },
    medium: { text: 'FATIGUE MEDIUM', color: '#F97316', icon: '⚡' },
    low: { text: 'FATIGUE LOW', color: '#EAB308', icon: '•' },
    none: { text: 'NO FATIGUE', color: '#22C55E', icon: '✓' },
  };
  return labels[severity] || labels.none;
}

export default {
  detectFatigue,
  getFatigueLabel,
};