import { base44 } from '@/api/base44Client';

// Regression cue library (unchanged from original)
const REGRESSION_CUES = {
  squat: {
    high_score: 'Excellent form! Push for deeper range of motion on your next set.',
    mid_score: 'Good progress! Focus on keeping your chest up throughout the movement.',
    low_score: ['Try lowering your weight for better range of motion.','Keep your knees tracking over your toes.','Slow down the descent to maintain control.']
  },
  deadlift: {
    high_score: 'Strong pull! Keep maintaining that neutral spine.',
    mid_score: 'Good effort! Focus on hip hinge mechanics and keeping the bar close.',
    low_score: ['Prioritize neutral spine over weight.','Drive through your heels and keep the bar against your legs.','Consider reducing weight to improve form.']
  },
  default: {
    high_score: 'Great session! Push intensity on your next set.',
    mid_score: 'Solid effort. Focus on one key fault next set.',
    low_score: ['Focus on form fundamentals before adding weight.','Move with control — quality over quantity.','Consider a lighter warm-up set.']
  }
};

export function generateRegressionCue(exerciseId, formScore) {
  const cues = REGRESSION_CUES[exerciseId] || REGRESSION_CUES.default;
  if (formScore >= 80) return cues.high_score;
  if (formScore >= 60) return cues.mid_score;
  const arr = Array.isArray(cues.low_score) ? cues.low_score : [cues.low_score];
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function updateFaultHistory(exerciseId, detectedFaults = []) {
  const authed = await base44.auth.isAuthenticated();
  if (!authed || !detectedFaults.length) return;

  for (const fault of detectedFaults) {
    try {
      const existing = await base44.entities.ExerciseFaultHistory.filter({
        exercise_id: exerciseId,
        fault_id: fault.id,
      });
      const match = existing?.[0];

      if (match) {
        await base44.entities.ExerciseFaultHistory.update(match.id, {
          last_occurrence:   new Date().toISOString(),
          total_occurrences: (match.total_occurrences || 1) + 1,
          is_resolved:       false,
        });
      } else {
        await base44.entities.ExerciseFaultHistory.create({
          exercise_id:      exerciseId,
          fault_id:         fault.id,
          fault_name:       fault.name || fault.id,
          first_occurrence: new Date().toISOString(),
          last_occurrence:  new Date().toISOString(),
        });
      }
    } catch (e) { console.warn('[AdaptiveFeedback] updateFaultHistory error:', e); }
  }
}

export async function checkForImprovements(exerciseId, currentFaultIds = []) {
  const authed = await base44.auth.isAuthenticated();
  if (!authed) return [];

  const unresolved = await base44.entities.ExerciseFaultHistory.filter({
    exercise_id: exerciseId,
    is_resolved: false,
  }, '-last_occurrence');

  const resolved = [];
  for (const fault of (unresolved ?? [])) {
    if (currentFaultIds.includes(fault.fault_id)) continue;
    const daysSince = (Date.now() - new Date(fault.last_occurrence).getTime()) / 86400000;
    if (daysSince >= 7) {
      await base44.entities.ExerciseFaultHistory.update(fault.id, { is_resolved: true, improvement_date: new Date().toISOString() });
      resolved.push(fault);
    }
  }
  return resolved;
}

export async function getExerciseFaultHistory(exerciseId) {
  const authed = await base44.auth.isAuthenticated();
  if (!authed) return [];
  const data = await base44.entities.ExerciseFaultHistory.filter({
    exercise_id: exerciseId,
  }, '-last_occurrence', 100);
  return data ?? [];
}

export async function getExerciseFaultStats(exerciseId) {
  const history = await getExerciseFaultHistory(exerciseId);
  const activeFaults = history.filter(f => !f.is_resolved);
  const resolvedFaults = history.filter(f => f.is_resolved);
  const total = history.length;
  const improvementRate = total > 0 ? (resolvedFaults.length / total) * 100 : 0;
  return { total, active: activeFaults.length, resolved: resolvedFaults.length, activeFaults, resolvedFaults, improvementRate };
}

export async function getAdaptiveCue(exerciseId, formScore, currentFaults = []) {
  const history = await getExerciseFaultHistory(exerciseId);
  const persistent = history.filter(f => f.total_occurrences >= 3 && !f.is_resolved);
  if (persistent.length > 0) return `Focus on correcting ${persistent[0].fault_name.replace(/_/g, ' ')} — it has appeared in multiple sessions.`;
  return generateRegressionCue(exerciseId, formScore);
}