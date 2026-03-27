/**
 * useGeminiCoach.js — React hook wrapping GeminiCoach.js
 */
import { useState, useCallback } from 'react';
import { getLiveCue, getSetAnalysis, getSessionNarrative } from './GeminiCoach';

export function useGeminiCoach() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastCue, setLastCue] = useState(null);
  const [lastAnalysis, setLastAnalysis] = useState(null);

  const getLiveCueFn = useCallback(async (movementData) => {
    setIsLoading(true);
    try {
      const result = await getLiveCue(movementData);
      if (result) setLastCue(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSetAnalysisFn = useCallback(async (reps, exerciseName) => {
    setIsLoading(true);
    try {
      const result = await getSetAnalysis(reps, exerciseName);
      if (result) setLastAnalysis(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSessionNarrativeFn = useCallback(async (sessionData) => {
    return await getSessionNarrative(sessionData);
  }, []);

  return {
    getLiveCue: getLiveCueFn,
    getSetAnalysis: getSetAnalysisFn,
    getSessionNarrative: getSessionNarrativeFn,
    isLoading,
    lastCue,
    lastAnalysis,
  };
}