/**
 * aiCoach — Gemini-powered real-time coaching function
 * Input:  { repData, jointTrends, commonFaults, exercise }
 * Output: { liveCue, postSetSummary, nextFocus }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { repData = [], jointTrends = {}, commonFaults = [], exercise = 'squat' } = await req.json();

    const faultSummary = commonFaults.length
      ? commonFaults.slice(0, 3).join(', ')
      : 'none detected';

    const repCount = repData.length;
    const avgScore = repCount
      ? Math.round(repData.reduce((s, r) => s + (r.score ?? 0), 0) / repCount)
      : null;

    const prompt = `You are an elite strength coach. Analyze this ${exercise} session and give concise, specific coaching.

Session data:
- Reps completed: ${repCount}
- Average form score: ${avgScore ?? 'N/A'}/100
- Common faults: ${faultSummary}
- Joint trends: ${JSON.stringify(jointTrends)}

Respond in JSON with exactly these keys:
- liveCue: A single actionable cue for the NEXT rep (max 10 words, imperative tone)
- postSetSummary: A brief assessment of this set (max 2 sentences, specific to the data)
- nextFocus: One specific thing to improve in the next set (max 15 words)

Be specific to the data. Never give generic advice. Total response under 150 words.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          liveCue:        { type: 'string' },
          postSetSummary: { type: 'string' },
          nextFocus:      { type: 'string' },
        },
        required: ['liveCue', 'postSetSummary', 'nextFocus'],
      },
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});