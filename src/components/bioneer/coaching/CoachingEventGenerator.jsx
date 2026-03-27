/**
 * CoachingEventGenerator.js
 * 
 * Converts form faults and movement data into natural, timed coaching cues.
 * 
 * RULE: "Say the right thing, at the right moment"
 * NOT constant talking, NOT data dumping
 */

import { COACHING_LIBRARY } from './coachingLibrary';

/**
 * Generate coaching events from session data
 * 
 * @param {Object} session - FormSession with alerts, top_faults, form_timeline
 * @param {string} exerciseId - Exercise identifier (squat, deadlift, etc)
 * @returns {Array} coaching_events sorted by timestamp
 */
export function generateCoachingEvents(session, exerciseId) {
  if (!session || !session.alerts) {
    return [];
  }

  const events = [];
  const exerciseLib = COACHING_LIBRARY[exerciseId] || COACHING_LIBRARY.default;
  const seenCues = new Set(); // Prevent repeat identical cues
  const minGap = 3; // Minimum 3 seconds between cues

  // Process alerts into coaching events
  session.alerts?.forEach(alert => {
    if (!alert.timestamp || !alert.joint) return;

    const cueKey = `${alert.joint}:${alert.angle?.toFixed(0)}`;
    
    // Skip if we just said this (within 3 seconds)
    if (seenCues.has(cueKey)) return;

    const fault = alert.joint.toLowerCase();
    const coaching = exerciseLib[fault];

    if (coaching) {
      // Determine priority based on angle severity
      const priority = getPriorityFromSeverity(alert.angle, coaching.threshold);
      
      events.push({
        timestamp: alert.timestamp,
        duration: coaching.duration || 3,
        message: coaching.message,
        priority,
        body_parts: [fault],
        cue_type: 'correction',
      });

      seenCues.add(cueKey);
    }
  });

  // Add reinforcement cues for top_faults if form improved
  if (session.top_faults && session.form_score_overall > 70) {
    session.top_faults.slice(0, 2).forEach((fault, idx) => {
      const coaching = exerciseLib[fault.toLowerCase()];
      if (coaching && coaching.reinforcement) {
        events.push({
          timestamp: Math.max(session.duration_seconds * 0.5) + (idx * 5),
          duration: 2,
          message: coaching.reinforcement,
          priority: 'low',
          body_parts: [fault.toLowerCase()],
          cue_type: 'reinforcement',
        });
      }
    });
  }

  // Filter and sort events
  return filterAndSortCoachingEvents(events, minGap);
}

/**
 * Determine priority from severity (angle deviation)
 */
function getPriorityFromSeverity(angle, threshold = 30) {
  if (!angle) return 'medium';
  
  const deviation = Math.abs(angle - (threshold || 90));
  if (deviation > 20) return 'high';
  if (deviation > 10) return 'medium';
  return 'low';
}

/**
 * Filter and sort coaching events
 * - Remove duplicates
 * - Enforce minGap between events
 * - Sort by timestamp
 * - Respect priority (high overrides nearby low/medium)
 */
function filterAndSortCoachingEvents(events, minGap = 3) {
  // Sort by timestamp, then by priority (high first)
  const sorted = events.sort((a, b) => {
    if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
    return priorityValue(b.priority) - priorityValue(a.priority);
  });

  const filtered = [];
  let lastTimestamp = -minGap - 1;

  sorted.forEach(event => {
    // Enforce gap between events (unless high priority)
    if (event.timestamp - lastTimestamp >= minGap || event.priority === 'high') {
      filtered.push(event);
      lastTimestamp = event.timestamp;
    }
  });

  return filtered;
}

/**
 * Convert priority string to numeric value
 */
function priorityValue(priority) {
  const map = { high: 3, medium: 2, low: 1 };
  return map[priority] || 1;
}

/**
 * Get coaching intensity level
 * Returns reduced event set for "minimal" mode
 */
export function filterByIntensity(events, intensity = 'moderate') {
  if (intensity === 'minimal') {
    // Only high priority events
    return events.filter(e => e.priority === 'high');
  }
  
  if (intensity === 'detailed') {
    // All events (already filtered for min gap)
    return events;
  }

  // moderate: high + selected medium
  return events.filter(e => 
    e.priority === 'high' || 
    (e.priority === 'medium' && Math.random() > 0.5)
  );
}

/**
 * Check if coaching message is repetitive
 * (avoid saying same thing twice in a row)
 */
export function isRepetitiveMessage(newMessage, previousMessage) {
  if (!previousMessage) return false;
  
  // Exact match
  if (newMessage === previousMessage) return true;
  
  // Fuzzy match: same message with variations
  const normalize = str => str.toLowerCase().replace(/[^a-z ]/g, '');
  return normalize(newMessage) === normalize(previousMessage);
}