import { supabase } from '@/api/supabaseClient';

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !detectedFaults.length) return;

  for (const fault of detectedFaults) {
    try {
      const { data: existing } = await supabase
        .from('exercise_fault_history')
        .select('id, total_occurrences')
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId)
        .eq('fault_id', fault.id)
        .maybeSingle();

      if (existing) {
        await supabase.from('exercise_fault_history').update({
          last_occurrence:   new Date().toISOString(),
          total_occurrences: (existing.total_occurrences || 1) + 1,
          is_resolved:       false,
        }).eq('id', existing.id);
      } else {
        await supabase.from('exercise_fault_history').insert({
          user_id:          user.id,
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: unresolved } = await supabase
    .from('exercise_fault_history')
    .select('*')
    .eq('user_id', user.id)
    .eq('exercise_id', exerciseId)
    .eq('is_resolved', false)
    .order('last_occurrence', { ascending: false });

  const resolved = [];
  for (const fault of (unresolved ?? [])) {
    if (currentFaultIds.includes(fault.fault_id)) continue;
    const daysSince = (Date.now() - new Date(fault.last_occurrence).getTime()) / 86400000;
    if (daysSince >= 7) {
      await supabase.from('exercise_fault_history').update({ is_resolved: true, improvement_date: new Date().toISOString() }).eq('id', fault.id);
      resolved.push(fault);
    }
  }
  return resolved;
}

export async function getExerciseFaultHistory(exerciseId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('exercise_fault_history')
    .select('*')
    .eq('user_id', user.id)
    .eq('exercise_id', exerciseId)
    .order('last_occurrence', { ascending: false })
    .limit(100);
  return data ?? [];
}

export async function getAdaptiveCue(exerciseId, formScore, currentFaults = []) {
  const history = await getExerciseFaultHistory(exerciseId);
  const persistent = history.filter(f => f.total_occurrences >= 3 && !f.is_resolved);
  if (persistent.length > 0) return `Focus on correcting ${persistent[0].fault_name.replace(/_/g, ' ')} — it has appeared in multiple sessions.`;
  return generateRegressionCue(exerciseId, formScore);
}
