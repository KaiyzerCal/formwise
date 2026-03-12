/**
 * AdaptiveFormScore.js
 * Refines form scoring based on user's personal consistency and fatigue patterns
 * Runs post-session, never impacts live scoring
 */

import { analyzeConsistency } from './ConsistencyAnalyzer';
import { detectFatigue } from './FatigueDetector';
import { compareToBaseline } from './UserMovementModel';

/**
 * Calculate adaptive form score adjustments
 * Takes base score and applies personalized penalties
 */
export async function calculateAdaptiveFormScore(baseScore, sessionMetrics, movement) {
  const adjustments = [];
  let adjustedScore = baseScore;

  // Apply consistency penalty
  const consistency = analyzeConsistency(sessionMetrics);
  if (consistency.consistencyScore < 90) {
    const consistencyPenalty = Math.round((100 - consistency.consistencyScore) * 0.08);
    adjustments.push({
      type: 'consistency',
      penalty: consistencyPenalty,
      reason: `Low rep consistency (${consistency.consistencyScore}/100)`,
    });
    adjustedScore -= consistencyPenalty;
  }

  // Apply fatigue penalty
  const fatigue = detectFatigue(sessionMetrics);
  if (fatigue.fatigueDetected) {
    const fatiguePenalty = fatigue.severity === 'high' ? 8 : fatigue.severity === 'medium' ? 5 : 3;
    adjustments.push({
      type: 'fatigue',
      penalty: fatiguePenalty,
      reason: `Fatigue detected (${fatigue.severity})`,
    });
    adjustedScore -= fatiguePenalty;
  }

  // Apply fault frequency penalty
  const faultPenalty = calculateFaultFrequencyPenalty(sessionMetrics);
  if (faultPenalty > 0) {
    adjustments.push({
      type: 'faults',
      penalty: faultPenalty,
      reason: `Frequent fault patterns (${faultPenalty} pts)`,
    });
    adjustedScore -= faultPenalty;
  }

  // Compare to personal baseline for context
  const baselineComparison = await compareToBaseline(movement, sessionMetrics);
  let contextBonus = 0;

  if (!baselineComparison.isNewMovement && baselineComparison.scoreImprovement) {
    contextBonus = Math.min(3, Math.abs(baselineComparison.scoreDelta)); // Max +3 bonus
    if (contextBonus > 0) {
      adjustments.push({
        type: 'improvement',
        penalty: -contextBonus,
        reason: 'Improvement over personal baseline',
      });
      adjustedScore += contextBonus;
    }
  }

  // Clamp final score
  const finalScore = Math.max(0, Math.min(100, Math.round(adjustedScore)));

  return {
    baseScore,
    adjustedScore: finalScore,
    adjustments,
    delta: finalScore - baseScore,
    explanation: generateExplanation(adjustments, baseScore, finalScore),
  };
}

/**
 * Calculate penalty for fault frequency in session
 */
function calculateFaultFrequencyPenalty(sessionMetrics) {
  if (!sessionMetrics?.allMetrics) return 0;

  const reps = sessionMetrics.allMetrics;
  const totalFaults = reps.reduce((sum, r) => sum + (r.faultsDetected?.length || 0), 0);

  if (totalFaults === 0) return 0;

  const faultRate = totalFaults / reps.length;
  let penalty = 0;

  if (faultRate > 0.5) penalty = 8;
  else if (faultRate > 0.3) penalty = 5;
  else if (faultRate > 0.15) penalty = 3;
  else penalty = 1;

  return penalty;
}

/**
 * Generate human-readable explanation
 */
function generateExplanation(adjustments, baseScore, finalScore) {
  if (adjustments.length === 0) {
    return `Great form! Consistent performance.`;
  }

  const positive = adjustments.filter(a => a.penalty < 0);
  const negative = adjustments.filter(a => a.penalty > 0);

  let text = `Base score: ${baseScore}. `;

  if (negative.length > 0) {
    const negativeReasons = negative.map(a => a.reason).join(', ');
    text += `Adjustments: ${negativeReasons}. `;
  }

  if (positive.length > 0) {
    text += `Positive: ${positive.map(a => a.reason).join(', ')}. `;
  }

  text += `Final: ${finalScore}`;

  return text;
}

/**
 * Format adjustment for display
 */
export function formatAdjustment(adjustment) {
  const icons = {
    consistency: '⚖️',
    fatigue: '⚡',
    faults: '⚠️',
    improvement: '⬆️',
  };

  return {
    icon: icons[adjustment.type] || '•',
    label: adjustment.type.toUpperCase(),
    penalty: adjustment.penalty,
    reason: adjustment.reason,
    display: `${adjustment.penalty > 0 ? '-' : '+'}${Math.abs(adjustment.penalty)} pts`,
  };
}

/**
 * Get score comparison label
 */
export function getScoreComparisonLabel(baseScore, adjustedScore) {
  const delta = adjustedScore - baseScore;

  if (delta === 0) {
    return { text: 'No adjustments', color: '#666', icon: '=' };
  }
  if (delta > 0) {
    return { text: `+${delta} pts`, color: '#22C55E', icon: '↑' };
  }
  return { text: `${delta} pts`, color: '#EF4444', icon: '↓' };
}

export default {
  calculateAdaptiveFormScore,
  formatAdjustment,
  getScoreComparisonLabel,
};