/**
 * useCoachingPlayer.js
 * 
 * React hook that synchronizes coaching events to video playback timestamp.
 * 
 * Usage:
 * const coaching = useCoachingPlayer(coachingEvents, currentTime, isPlaying);
 * 
 * Returns:
 * - currentEvent: active coaching cue
 * - isPlayingVoice: is voice currently speaking
 * - coachingControls: mute/volume/replay controls
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { getVoiceCoachingEngine } from './VoiceCoachingEngine';
import { filterByIntensity, isRepetitiveMessage } from './CoachingEventGenerator';

export function useCoachingPlayer(coachingEvents = [], currentTime = 0, isPlaying = true) {
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [coachingEnabled, setCoachingEnabled] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [intensity, setIntensity] = useState('moderate');
  
  const voiceEngine = useRef(null);
  const playedEventIds = useRef(new Set());
  const lastEventMessage = useRef(null);
  const eventTimelineRef = useRef({});

  // Initialize voice engine
  useEffect(() => {
    voiceEngine.current = getVoiceCoachingEngine();
    voiceEngine.current.warmupVoices();
    
    // Subscribe to voice events
    const unsubscribe = voiceEngine.current.subscribe((event) => {
      if (event.type === 'speaking') {
        setIsPlayingVoice(true);
      } else if (event.type === 'finished' || event.type === 'error') {
        setIsPlayingVoice(false);
      }
    });

    return unsubscribe;
  }, []);

  // Sync volume to voice engine
  useEffect(() => {
    if (voiceEngine.current) {
      voiceEngine.current.setVolume(volume);
    }
  }, [volume]);

  // Sync enabled state
  useEffect(() => {
    if (voiceEngine.current) {
      voiceEngine.current.setEnabled(coachingEnabled);
    }
  }, [coachingEnabled]);

  // Main playback sync
  useEffect(() => {
    if (!isPlaying || !coachingEnabled || !coachingEvents.length) {
      return;
    }

    // Filter events by intensity
    const filteredEvents = filterByIntensity(coachingEvents, intensity);

    // Find next event to play
    const nextEvent = filteredEvents.find(e => {
      const eventId = `${e.timestamp}:${e.message}`;
      const hasPlayed = playedEventIds.current.has(eventId);
      const isReady = currentTime >= e.timestamp && currentTime < e.timestamp + 0.2; // Small window

      return !hasPlayed && isReady;
    });

    if (nextEvent) {
      const eventId = `${nextEvent.timestamp}:${nextEvent.message}`;
      
      // Avoid repetition
      if (!isRepetitiveMessage(nextEvent.message, lastEventMessage.current)) {
        // Speak with natural delay
        playCoachingEvent(nextEvent);
        playedEventIds.current.add(eventId);
        lastEventMessage.current = nextEvent.message;
      }
    }
  }, [currentTime, isPlaying, coachingEnabled, intensity, coachingEvents]);

  /**
   * Play a coaching event
   */
  const playCoachingEvent = useCallback(async (event) => {
    if (!voiceEngine.current || !coachingEnabled) return;

    setCurrentEvent(event);
    
    // Natural delay before speaking (0.5–1s)
    const delay = 0.5 + Math.random() * 0.5;

    await voiceEngine.current.speak(event.message, {
      rate: 0.95, // Slightly slower than normal
      pitch: 1,
      delay,
    });
  }, [coachingEnabled]);

  /**
   * Manually replay last coaching event
   */
  const replayLastEvent = useCallback(() => {
    if (!currentEvent || !voiceEngine.current) return;
    voiceEngine.current.speak(currentEvent.message, { delay: 0 });
  }, [currentEvent]);

  /**
   * Reset playback state (call when seeking or changing video)
   */
  const resetPlaybackState = useCallback(() => {
    playedEventIds.current.clear();
    lastEventMessage.current = null;
    setCurrentEvent(null);
    setIsPlayingVoice(false);
    if (voiceEngine.current) {
      voiceEngine.current.cancel();
    }
  }, []);

  /**
   * Toggle coaching on/off
   */
  const toggleCoaching = useCallback(() => {
    setCoachingEnabled(!coachingEnabled);
  }, [coachingEnabled]);

  /**
   * Change coaching intensity
   */
  const setCoachingIntensity = useCallback((newIntensity) => {
    if (['minimal', 'moderate', 'detailed'].includes(newIntensity)) {
      setIntensity(newIntensity);
      resetPlaybackState(); // Reset so events can replay at new intensity
    }
  }, [resetPlaybackState]);

  return {
    // State
    currentEvent,
    isPlayingVoice,
    coachingEnabled,
    volume,
    intensity,

    // Controls
    toggleCoaching,
    setVolume,
    setCoachingIntensity,
    replayLastEvent,
    resetPlaybackState,

    // Info
    totalEvents: coachingEvents.length,
    filteredEvents: filterByIntensity(coachingEvents, intensity).length,
  };
}