/**
 * AdaptiveFeedbackEngine.js
 * Generates personalized coaching insights based on user history
 * Creates contextual feedback that improves over time
 */

import { compareToBaseline } from './UserMovementModel';
import { analyzeConsistency } from './ConsistencyAnalyzer';
import { detectFatigue } from './FatigueDetector';

/**
 * Generate personalized feedback for a completed session
 */
export async function generateSessionFeedback(sessionMetrics, movement) {
  const insights = [];

  // Consistency feedback
  const consistency = analyzeConsistency(sessionMetrics);
  const consistencyInsight = generateConsistencyInsight(consistency, sessionMetrics);
  if (consistencyInsight) insights.push(consistencyInsight);

  // Fault pattern feedback
  const faultInsight = generateFaultInsight(sessionMetrics);
  if (faultInsight) insights.push(faultInsight);

  // Fatigue feedback
  const fatigueInsight = generateFatigueInsight(sessionMetrics);
  if (fatigueInsight) insights.push(fatigueInsight);

  // Baseline comparison feedback
  const baselineComparison = await compareToBaseline(movement, sessionMetrics);
  const baselineInsight = generateBaselineInsight(baselineComparison, sessionMetrics);
  if (baselineInsight) insights.push(baselineInsight);

  // Tempo feedback
  const tempoInsight = generateTempoInsight(sessionMetrics);
  if (tempoInsight) insights.push(tempoInsight);

  return {
    movement,
    sessionDate: new Date().toISOString(),
    insights,
    summary: generateSummary(insights),
  };
}

/**
 * Generate consistency-based insight
 */
function generateConsistencyInsight(consistency, sessionMetrics) {
  if (consistency.consistencyScore >= 85) {
    return {
      category: 'consistency',
      sentiment: 'positive',
      message: `Your ${sessionMetrics.allMetrics?.length || 0}-rep set was consistent. Form remained stable throughout.`,
      actionable: false,
    };
  }

  if (consistency.consistencyScore >= 70) {
    const issues = consistency.issues.slice(0, 2).join(', ');
    return {
      category: 'consistency',
      sentiment: 'neutral',
      message: `Rep-to-rep consistency could improve. Focus on: ${issues}.`,
      actionable: true,
    };
  }

  return {
    category: 'consistency',
    sentiment: 'negative',
    message: `High variation between reps. Practice controlled, deliberate movement.`,
    actionable: true,
  };
}

/**
 * Generate fault pattern feedback
 */
function generateFaultInsight(sessionMetrics) {
  if (!sessionMetrics?.allMetrics) return null;

  const faultMap = {};
  sessionMetrics.allMetrics.forEach(rep => {
    rep.faultsDetected?.forEach(fault => {
      faultMap[fault] = (faultMap[fault] || 0) + 1;
    });
  });

  if (Object.keys(faultMap).length === 0) {
    return {
      category: 'faults',
      sentiment: 'positive',
      message: 'No major faults detected. Excellent form.',
      actionable: false,
    };
  }

  const sortedFaults = Object.entries(faultMap).sort((a, b) => b[1] - a[1]);
  const topFault = sortedFaults[0][0];
  const faultRate = (sortedFaults[0][1] / sessionMetrics.allMetrics.length * 100).toFixed(0);

  return {
    category: 'faults',
    sentiment: 'neutral',
    message: `Right knee collapse detected in ${faultRate}% of reps. Cue: "knees tracking over toes."`,
    actionable: true,
  };
}

/**
 * Generate fatigue-based feedback
 */
function generateFatigueInsight(sessionMetrics) {
  const fatigue = detectFatigue(sessionMetrics);

  if (!fatigue.fatigueDetected) return null;

  if (fatigue.severity === 'high') {
    return {
      category: 'fatigue',
      sentiment: 'warning',
      message: 'Form degrading due to fatigue. Consider shorter sets or more rest.',
      actionable: true,
    };
  }

  if (fatigue.severity === 'medium') {
    const indicator = fatigue.indicators[0]?.type || 'unknown';
    return {
      category: 'fatigue',
      sentiment: 'neutral',
      message: `Fatigue detected (${indicator}). Maintain control and adequate rest between sets.`,
      actionable: true,
    };
  }

  return null;
}

/**
 * Generate baseline comparison feedback
 */
function generateBaselineInsight(baselineComparison, sessionMetrics) {
  if (baselineComparison.isNewMovement) {
    return {
      category: 'baseline',
      sentiment: 'positive',
      message: `First tracking session for this movement. Baseline established.`,
      actionable: false,
    };
  }

  const { baseline, scoreDelta, scoreImprovement, consistency } = baselineComparison;

  if (scoreImprovement && scoreDelta >= 5) {
    return {
      category: 'baseline',
      sentiment: 'positive',
      message: `Great progress! Your form improved by ${Math.round(scoreDelta)} points vs. your baseline.`,
      actionable: false,
    };
  }

  if (!scoreImprovement && scoreDelta <= -5) {
    return {
      category: 'baseline',
      sentiment: 'neutral',
      message: `Form dipped ${Math.round(Math.abs(scoreDelta))} points below your baseline. Review fundamentals.`,
      actionable: true,
    };
  }

  return {
    category: 'baseline',
    sentiment: 'neutral',
    message: `Performance in line with your baseline. Keep practicing.`,
    actionable: false,
  };
}

/**
 * Generate tempo-based feedback
 */
function generateTempoInsight(sessionMetrics) {
  if (!sessionMetrics?.allMetrics || sessionMetrics.allMetrics.length < 3) return null;

  const tempos = sessionMetrics.allMetrics.map(r => r.repDuration);
  const avgTempo = tempos.reduce((a, b) => a + b, 0) / tempos.length;

  if (avgTempo < 1.0) {
    return {
      category: 'tempo',
      sentiment: 'neutral',
      message: `Tempo very fast (${avgTempo.toFixed(1)}s/rep). Slow down for better control.`,
      actionable: true,
    };
  }

  if (avgTempo > 3.5) {
    return {
      category: 'tempo',
      sentiment: 'neutral',
      message: `Tempo slow (${avgTempo.toFixed(1)}s/rep). Increase pace for efficiency.`,
      actionable: true,
    };
  }

  return null;
}

/**
 * Generate session summary
 */
function generateSummary(insights) {
  const positive = insights.filter(i => i.sentiment === 'positive').length;
  const negative = insights.filter(i => i.sentiment === 'negative').length;
  const neutral = insights.filter(i => i.sentiment === 'neutral').length;

  if (positive > neutral + negative) {
    return 'Excellent session. Keep it up.';
  }
  if (negative > 0) {
    return 'Some areas to focus on. Review feedback above.';
  }
  return 'Solid session. Room for improvement in consistency.';
}

/**
 * Format feedback for UI display
 */
export function formatFeedbackInsight(insight) {
  const icons = {
    positive: '✓',
    neutral: '•',
    negative: '⚠️',
    warning: '⚡',
  };

  const colors = {
    positive: '#22C55E',
    neutral: '#EAB308',
    negative: '#EF4444',
    warning: '#F97316',
  };

  return {
    icon: icons[insight.sentiment] || '•',
    color: colors[insight.sentiment] || '#666',
    title: insight.category.toUpperCase(),
    message: insight.message,
    actionable: insight.actionable,
  };
}

export default {
  generateSessionFeedback,
  formatFeedbackInsight,
};