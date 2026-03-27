/**
 * sessionAnalysis — Deep post-session analysis
 * Input:  full session metrics object
 * Output: { movementScore, stabilityRating, consistencyRating, improvementSuggestions }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await req.json();

    const {
      exercise_id = 'unknown',
      reps_detected = 0,
      form_score_overall = 0,
      form_score_peak = 0,
      form_score_lowest = 0,
      top_faults = [],
      mastery_avg = 0,
      tracking_confidence = 0,
      duration_seconds = 0,
    } = session;

    // Compute derived metrics
    const scoreRange = form_score_peak - form_score_lowest;
    const consistencyRating = Math.max(0, 100 - scoreRange * 1.2);
    const stabilityRating   = Math.round((mastery_avg * 0.6) + (tracking_confidence * 0.4));
    const movementScore     = Math.round((form_score_overall * 0.5) + (consistencyRating * 0.3) + (stabilityRating * 0.2));

    // AI improvement suggestions
    const faultList = top_faults.length ? top_faults.slice(0, 4).join(', ') : 'none recorded';

    const prompt = `You are an elite movement coach reviewing a completed ${exercise_id} session.

Session stats:
- Duration: ${Math.round(duration_seconds)}s
- Reps: ${reps_detected}
- Overall form score: ${form_score_overall}/100
- Peak score: ${form_score_peak}/100
- Lowest score: ${form_score_lowest}/100
- Consistency: ${Math.round(consistencyRating)}/100
- Stability: ${stabilityRating}/100
- Top faults: ${faultList}

Give 3 specific, actionable improvement suggestions based on this data.
Each suggestion should be 1 sentence max. Be direct and precise.

Return JSON: { suggestions: [string, string, string] }`;

    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          suggestions: { type: 'array', items: { type: 'string' } },
        },
        required: ['suggestions'],
      },
    });

    return Response.json({
      movementScore,
      stabilityRating,
      consistencyRating: Math.round(consistencyRating),
      improvementSuggestions: aiResult?.suggestions ?? [],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});