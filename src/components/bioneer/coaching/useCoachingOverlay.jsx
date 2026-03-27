/**
 * useCoachingOverlay.js
 * 
 * Hook that manages visual feedback for coaching cues:
 * - Body part highlighting
 * - Timeline markers
 * - Subtitle display
 */

import { useEffect, useState, useCallback } from 'react';

export function useCoachingOverlay(currentEvent, isPlayingVoice) {
  const [highlightedParts, setHighlightedParts] = useState([]);
  const [showSubtitle, setShowSubtitle] = useState(false);

  // Update highlighted body parts when event changes
  useEffect(() => {
    if (currentEvent && currentEvent.body_parts) {
      setHighlightedParts(currentEvent.body_parts);
      setShowSubtitle(true);

      // Auto-hide subtitle after event duration
      const timeout = setTimeout(() => {
        setShowSubtitle(false);
      }, (currentEvent.duration || 3) * 1000);

      return () => clearTimeout(timeout);
    } else {
      setHighlightedParts([]);
      setShowSubtitle(false);
    }
  }, [currentEvent]);

  /**
   * Check if a body part should be highlighted
   */
  const isPartHighlighted = useCallback((partName) => {
    return highlightedParts.includes(partName.toLowerCase());
  }, [highlightedParts]);

  /**
   * Get highlight color for a body part
   */
  const getHighlightColor = useCallback((partName) => {
    if (!isPartHighlighted(partName)) return null;

    // Color by priority
    if (currentEvent?.priority === 'high') {
      return '#FCD34D'; // Gold
    } else if (currentEvent?.priority === 'medium') {
      return '#FEA500'; // Orange
    } else {
      return '#6B7280'; // Gray
    }
  }, [isPartHighlighted, currentEvent]);

  /**
   * Get glow effect opacity
   */
  const getGlowOpacity = useCallback(() => {
    if (!isPlayingVoice) return 0.5;
    return 1;
  }, [isPlayingVoice]);

  return {
    // State
    highlightedParts,
    showSubtitle,
    currentMessage: currentEvent?.message,

    // Utilities
    isPartHighlighted,
    getHighlightColor,
    getGlowOpacity,
  };
}