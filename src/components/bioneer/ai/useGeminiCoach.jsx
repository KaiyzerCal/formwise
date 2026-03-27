/**
 * useGeminiCoach.js — React hook wrapping GeminiCoach.js
 * Adds deduplication and check-in cue support.
 */
import { useState, useCallback, useRef } from 'react';
import { getLiveCue, getSetAnalysis, getSessionNarrative, getCheckInCue } from './GeminiCoach';

// Word-overlap similarity: returns 0-1
function wordSimilarity(a, b) {
  if (!a || !b) return 0;
  const wordsA = a.toLowerCase().split(/\s+/);
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  const overlap = wordsA.filter(w => wordsB.has(w)).length;
  return overlap / Math.max(wordsA.length, wordsB.size);
}

export function useGeminiCoach() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastCue, setLastCue] = useState(null);
  const [lastAnalysis, setLastAnalysis] = useState(null);

  // Deduplication state
  const lastSpokenCueRef = useRef(null);
  const lastSpokenFaultRef = useRef(null);
  const repsSinceLastCueRef = useRef(0);

  const getLiveCueFn = useCallback(async (movementData) => {
    setIsLoading(true);
    try {
      const result = await getLiveCue(movementData);
      if (!result) return null;

      // Deduplication: skip if >70% similar to last cue AND same fault hasn't cleared
      const similarity = wordSimilarity(result.cue, lastSpokenCueRef.current);
      const sameFault = result.issue === lastSpokenFaultRef.current;

      if (similarity > 0.7 && sameFault && repsSinceLastCueRef.current < 3) {
        return null; // skip duplicate
      }

      // Reset counter when fault changes
      if (result.issue !== lastSpokenFaultRef.current) {
        repsSinceLastCueRef.current = 0;
      }

      lastSpokenCueRef.current = result.cue;
      lastSpokenFaultRef.current = result.issue;
      repsSinceLastCueRef.current = 0;

      setLastCue(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Call this each rep to track reps-since-last-cue for dedup reset
  const trackRep = useCallback(() => {
    repsSinceLastCueRef.current += 1;
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

  const getCheckInCueFn = useCallback(async (opts) => {
    return await getCheckInCue(opts);
  }, []);

  return {
    getLiveCue: getLiveCueFn,
    getSetAnalysis: getSetAnalysisFn,
    getSessionNarrative: getSessionNarrativeFn,
    getCheckInCue: getCheckInCueFn,
    trackRep,
    isLoading,
    lastCue,
    lastAnalysis,
  };
}