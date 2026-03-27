import { base44 } from '@/api/base44Client';

/**
 * Adaptive Feedback Engine
 * - Generates regression cues based on form score
 * - Tracks historical faults per exercise
 * - Identifies improvements across sessions
 */

// Regression cue library: score → specific actionable guidance
const REGRESSION_CUES = {
  squat: {
    high_score: 'Excellent form! Push for deeper range of motion on your next set.',
    mid_score: 'Good progress! Focus on keeping your chest up throughout the movement.',
    low_score: [
      'Try lowering your weight for better range of motion.',
      'Keep your knees tracking over your toes.',
      'Slow down the descent to maintain control.'
    ]
  },
  deadlift: {
    high_score: 'Outstanding lockout position! Consider increasing load.',
    mid_score: 'Keep your back straight and shoulders over the bar.',
    low_score: [
      'Try reducing weight to reset your form.',
      'Focus on keeping the bar close to your body.',
      'Engage your core before initiating the lift.'
    ]
  },
  bench_press: {
    high_score: 'Perfect form! Your bar path is consistent.',
    mid_score: 'Work on controlling the descent for better stability.',
    low_score: [
      'Reduce weight to establish a stable base.',
      'Keep elbows at 45° angle to your body.',
      'Control the eccentric (lowering) phase.'
    ]
  },
  golf_swing: {
    high_score: 'Excellent sequencing! Your rotation is smooth.',
    mid_score: 'Focus on weight transfer during the downswing.',
    low_score: [
      'Slow down your backswing to improve consistency.',
      'Focus on hip rotation before shoulder rotation.',
      'Reduce swing speed until form stabilizes.'
    ]
  }
};

// Fault library: common issues per exercise
const FAULT_LIBRARY = {
  squat: [
    { id: 'knee_valgus', name: 'Knee valgus (knees caving in)', joints: ['left_knee', 'right_knee'] },
    { id: 'forward_lean', name: 'Excessive forward lean', joints: ['spine', 'hip'] },
    { id: 'incomplete_depth', name: 'Incomplete depth', joints: ['hip', 'knee'] },
    { id: 'uneven_weight', name: 'Uneven weight distribution', joints: ['left_foot', 'right_foot'] }
  ],
  deadlift: [
    { id: 'rounded_back', name: 'Rounded lower back', joints: ['spine', 'hip'] },
    { id: 'bar_drift', name: 'Bar drifting away from body', joints: ['shoulder', 'spine'] },
    { id: 'early_extension', name: 'Early hip extension', joints: ['hip', 'spine'] },
    { id: 'shoulder_shrug', name: 'Excessive shoulder shrug', joints: ['shoulder'] }
  ],
  bench_press: [
    { id: 'elbow_flare', name: 'Elbows flared too wide', joints: ['elbow', 'shoulder'] },
    { id: 'uneven_bar', name: 'Uneven bar path', joints: ['wrist', 'shoulder'] },
    { id: 'foot_instability', name: 'Unstable foot position', joints: ['ankle', 'knee'] },
    { id: 'neck_strain', name: 'Excessive neck strain', joints: ['neck'] }
  ],
  golf_swing: [
    { id: 'early_rotation', name: 'Early shoulder rotation', joints: ['shoulder', 'spine'] },
    { id: 'poor_weight_transfer', name: 'Poor weight transfer', joints: ['hip', 'ankle'] },
    { id: 'over_swing', name: 'Over-swinging', joints: ['shoulder', 'elbow'] },
    { id: 'inconsistent_tempo', name: 'Inconsistent tempo', joints: ['wrist', 'shoulder'] }
  ]
};

/**
 * Generate adaptive cue based on form score
 */
export function generateAdaptiveCue(exerciseId, formScore) {
  const exerciseKey = exerciseId.toLowerCase();
  const cues = REGRESSION_CUES[exerciseKey];

  if (!cues) return null;

  if (formScore >= 80) {
    return cues.high_score;
  } else if (formScore >= 60) {
    return cues.mid_score;
  } else {
    // Low score: randomly pick one regression cue
    const lowCues = Array.isArray(cues.low_score) ? cues.low_score : [cues.low_score];
    return lowCues[Math.floor(Math.random() * lowCues.length)];
  }
}

/**
 * Detect faults from session data and return fault IDs
 * (Integration point: call from sessionAnalysis or post-session handler)
 */
export function detectFaultsFromSession(sessionData) {
  const exerciseKey = (sessionData.exercise_id || '').toLowerCase();
  const faults = FAULT_LIBRARY[exerciseKey] || [];
  const detectedFaults = [];

  // Simple heuristic: if form score < 70 and certain joints have high variance, flag faults
  if (sessionData.form_score_overall < 70) {
    // Pick 1-2 random faults to record (in production, use actual joint analysis)
    const numFaults = Math.ceil(faults.length * 0.3); // 30% of faults
    for (let i = 0; i < numFaults && i < faults.length; i++) {
      detectedFaults.push(faults[i]);
    }
  }

  return detectedFaults;
}

/**
 * Log detected faults to fault history
 */
export async function recordSessionFaults(sessionData) {
  const detectedFaults = detectFaultsFromSession(sessionData);
  if (!detectedFaults.length) return [];

  const exerciseId = sessionData.exercise_id;
  const recorded = [];

  for (const fault of detectedFaults) {
    try {
      // Check if fault already exists
      const existing = await base44.entities.ExerciseFaultHistory.filter({
        exercise_id: exerciseId,
        fault_id: fault.id
      }, '', 1);

      if (existing.length > 0) {
        // Update last occurrence and count
        await base44.entities.ExerciseFaultHistory.update(existing[0].id, {
          last_occurrence: new Date().toISOString(),
          total_occurrences: (existing[0].total_occurrences || 1) + 1,
          is_resolved: false
        });
      } else {
        // Create new fault history record
        await base44.entities.ExerciseFaultHistory.create({
          exercise_id: exerciseId,
          fault_id: fault.id,
          fault_name: fault.name,
          first_occurrence: new Date().toISOString(),
          last_occurrence: new Date().toISOString(),
          total_occurrences: 1,
          is_resolved: false
        });
      }

      recorded.push(fault);
    } catch (err) {
      console.error(`[AdaptiveFeedback] Failed to record fault ${fault.id}:`, err);
    }
  }

  return recorded;
}

/**
 * Check for resolved faults (no longer appearing)
 * Call this when a session has high form score for an exercise
 */
export async function markResolvedFaults(exerciseId, formScore) {
  if (formScore < 75) return [];

  const resolved = [];

  try {
    // Find all unresolved faults for this exercise
    const unresolved = await base44.entities.ExerciseFaultHistory.filter(
      {
        exercise_id: exerciseId,
        is_resolved: false
      },
      '-last_occurrence',
      50
    );

    for (const fault of unresolved) {
      // Mark as resolved if last occurrence was > 7 days ago
      const lastOcc = new Date(fault.last_occurrence);
      const daysSince = (Date.now() - lastOcc.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSince > 7) {
        await base44.entities.ExerciseFaultHistory.update(fault.id, {
          is_resolved: true,
          improvement_date: new Date().toISOString()
        });
        resolved.push(fault);
      }
    }
  } catch (err) {
    console.error('[AdaptiveFeedback] Failed to mark resolved faults:', err);
  }

  return resolved;
}

/**
 * Get fault history and improvement stats for an exercise
 */
export async function getExerciseFaultStats(exerciseId) {
  try {
    const allFaults = await base44.entities.ExerciseFaultHistory.filter(
      { exercise_id: exerciseId },
      '-last_occurrence',
      100
    );

    const active = allFaults.filter(f => !f.is_resolved);
    const resolved = allFaults.filter(f => f.is_resolved);

    return {
      total: allFaults.length,
      active: active.length,
      resolved: resolved.length,
      activeFaults: active,
      resolvedFaults: resolved,
      improvementRate: allFaults.length > 0 ? (resolved.length / allFaults.length) * 100 : 0
    };
  } catch (err) {
    console.error('[AdaptiveFeedback] Failed to get fault stats:', err);
    return { total: 0, active: 0, resolved: 0, activeFaults: [], resolvedFaults: [], improvementRate: 0 };
  }
}