/**
 * generateCoachingEvents.js
 * 
 * Backend function: Generates coaching_events for a FormSession
 * Called after session processing to create timestamped coaching cues
 * 
 * Usage:
 * await base44.functions.invoke('generateCoachingEvents', {
 *   sessionId: 'sess_123',
 *   exerciseId: 'squat'
 * })
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Coaching library (simplified server-side version)
 */
const EXERCISE_COACHING = {
  squat: {
    knee: { message: "Keep your knee over your toes", priority: "high" },
    hip: { message: "Drive your hips back more", priority: "high" },
    back: { message: "Keep your chest up", priority: "medium" },
    ankle: { message: "Keep weight in your heels", priority: "medium" },
  },
  deadlift: {
    back: { message: "Keep your back straight", priority: "high" },
    hip: { message: "Start with your hips higher", priority: "high" },
    knee: { message: "Keep the bar close to your body", priority: "medium" },
    shoulder: { message: "Shoulders over the bar at the start", priority: "medium" },
  },
  bench_press: {
    shoulder: { message: "Keep your shoulders packed", priority: "medium" },
    elbow: { message: "Elbows at 45 degrees", priority: "medium" },
    back: { message: "Keep tension in your back", priority: "medium" },
  },
  golf_swing: {
    spine: { message: "Maintain your spine angle", priority: "high" },
    shoulder: { message: "Rotate from your core", priority: "medium" },
    hip: { message: "Engage your hips", priority: "medium" },
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, exerciseId } = await req.json();

    if (!sessionId || !exerciseId) {
      return Response.json(
        { error: 'sessionId and exerciseId are required' },
        { status: 400 }
      );
    }

    // Fetch session
    const session = await base44.entities.FormSession.get(sessionId);
    if (!session || session.created_by !== user.email) {
      return Response.json(
        { error: 'Session not found or not authorized' },
        { status: 404 }
      );
    }

    // Generate coaching events from alerts
    const events = generateCoachingEventsFromSession(session, exerciseId);

    // Update session with coaching_events
    await base44.entities.FormSession.update(sessionId, {
      coaching_events: events,
      coaching_enabled: true,
      coaching_intensity: 'moderate',
    });

    console.log('[CoachingGenerator] Generated', events.length, 'coaching events for', sessionId);

    return Response.json({
      success: true,
      sessionId,
      eventsGenerated: events.length,
      events,
    });
  } catch (error) {
    console.error('[CoachingGenerator] Error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});

/**
 * Generate coaching events from session data
 */
function generateCoachingEventsFromSession(session, exerciseId) {
  const events = [];
  const exerciseLib = EXERCISE_COACHING[exerciseId] || {};
  const seenCues = new Set();
  const minGap = 3; // Minimum 3 seconds between cues

  // Process alerts into coaching events
  if (session.alerts && Array.isArray(session.alerts)) {
    session.alerts.forEach((alert) => {
      if (!alert.timestamp || !alert.joint) return;

      const fault = alert.joint.toLowerCase();
      const coaching = exerciseLib[fault];

      if (coaching) {
        const cueKey = `${fault}:${alert.timestamp}`;

        if (!seenCues.has(cueKey)) {
          events.push({
            timestamp: alert.timestamp,
            duration: 3,
            message: coaching.message,
            priority: coaching.priority || 'medium',
            body_parts: [fault],
            cue_type: 'correction',
          });

          seenCues.add(cueKey);
        }
      }
    });
  }

  // Filter by min gap
  const filtered = [];
  let lastTimestamp = -minGap - 1;

  events
    .sort((a, b) => a.timestamp - b.timestamp)
    .forEach((event) => {
      if (event.timestamp - lastTimestamp >= minGap) {
        filtered.push(event);
        lastTimestamp = event.timestamp;
      }
    });

  return filtered;
}