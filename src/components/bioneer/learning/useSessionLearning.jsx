/**
 * useSessionLearning.js
 * Hook that orchestrates adaptive learning after session completion
 * Non-blocking, post-session processing
 */

import { useEffect, useCallback } from 'react';
import { initLearningDB, getSessionSummaryMetrics } from './SessionLearningEngine';
import { calculateAdaptiveFormScore } from './AdaptiveFormScore';
import { generateSessionFeedback } from './AdaptiveFeedbackEngine';
import { analyzeConsistency } from './ConsistencyAnalyzer';
import { detectFatigue } from './FatigueDetector';

/**
 * Process completed session through learning pipeline
 * Returns enriched session with adaptive insights
 */
export function useSessionLearning() {
  // Initialize learning DB on mount
  useEffect(() => {
    initLearningDB().catch(err => console.warn('Learning DB init failed:', err));
  }, []);

  /**
   * Main function: Process session through adaptive learning pipeline
   * Called after session.finalize() in orchestrator
   */
  const processSessionLearning = useCallback(async (sessionData) => {
    try {
      // Build session metrics summary
      const sessionMetrics = {
        repCount: sessionData.reps?.length || 0,
        avgFormScore: sessionData.form_score_overall || 0,
        allMetrics: sessionData.reps || [],
        avgRepDuration: parseFloat(
          (sessionData.reps?.reduce((sum, r) => sum + r.repDuration, 0) / sessionData.reps?.length || 0).toFixed(2)
        ),
      };

      const movement = sessionData.exercise_id || sessionData.movement_id;

      // Consistency analysis
      const consistency = analyzeConsistency(sessionMetrics);

      // Fatigue detection
      const fatigue = detectFatigue(sessionMetrics);

      // Adaptive form scoring
      const adaptiveScoring = await calculateAdaptiveFormScore(
        sessionData.form_score_overall,
        sessionMetrics,
        movement
      );

      // Generate personalized feedback
      const feedback = await generateSessionFeedback(sessionMetrics, movement);

      // Enrich session data with learning insights
      const enrichedSession = {
        ...sessionData,
        learning: {
          consistency,
          fatigue,
          adaptiveScoring,
          feedback,
          processedAt: Date.now(),
        },
      };

      return enrichedSession;
    } catch (err) {
      console.error('Session learning processing failed:', err);
      // Return original session if learning fails (non-blocking)
      return sessionData;
    }
  }, []);

  /**
   * Get learning insights for a specific movement
   */
  const getMovementInsights = useCallback(async (movement) => {
    try {
      const summaryMetrics = await getSessionSummaryMetrics(movement, Date.now() - 30 * 24 * 60 * 60 * 1000);

      if (!summaryMetrics) {
        return { movement, hasData: false };
      }

      const consistency = analyzeConsistency(summaryMetrics);
      const fatigue = detectFatigue(summaryMetrics);

      return {
        movement,
        hasData: true,
        sessionCount: summaryMetrics.repCount,
        avgFormScore: summaryMetrics.avgFormScore,
        consistency,
        fatigue,
        summary: summaryMetrics,
      };
    } catch (err) {
      console.error('Failed to get movement insights:', err);
      return { movement, hasData: false, error: err.message };
    }
  }, []);

  return {
    processSessionLearning,
    getMovementInsights,
  };
}

export default useSessionLearning;