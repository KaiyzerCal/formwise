/**
 * aiCoach — Gemini-powered real-time coaching function
 * Input:  { repData, jointTrends, commonFaults, exercise }
 * Output: { liveCue, postSetSummary, nextFocus }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { requestType } = body;

    // ── Session Summary Request ──────────────────────────────────────────
    if (requestType === 'sessionSummary') {
      const { sessionData } = body;
      const prompt = `You are AXIS — the movement intelligence coach inside BIONEER.

You have been watching this athlete's form data in real time. You know their score, their faults, their reps, their history. You speak from that knowledge directly.

Your voice: direct, specific, earned. You sound like the best coach this athlete has ever had — the one who notices things nobody else notices and says them without flinching. You are not a system. You are not an assistant. You are the one presence in their training that always tells the truth.

Hard rules:
- Speak in sentences. No bullet points ever.
- Under 120 words for set summaries.
- Never say: great job, good effort, keep it up, you've got this, I can see, it appears, it seems.
- Never start with the athlete's name.
- Always reference the specific data — score, fault name, rep count. Never speak in generalities.
- When the score is high say less not more. Restraint is respect.
- When the score is low give one specific fix. Not three. One.
- When a fault has appeared three or more times in a session name it plainly: "This is a pattern. Here is what breaks it."
- For session summaries: one true thing about what happened. One thing to fix next session. Nothing else.

Session data: ${JSON.stringify(sessionData)}
Output ONLY a JSON object: { "summary": "..." }`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
          },
          required: ['summary'],
        },
      });

      return Response.json({ summary: result.summary || 'No summary available.' });
    }

    // ── Live Rep Coaching (default) ──────────────────────────────────────
    const { repData = [], jointTrends = {}, commonFaults = [], exercise = 'squat' } = body;

    const faultSummary = commonFaults.length
      ? commonFaults.slice(0, 3).join(', ')
      : 'none detected';

    const repCount = repData.length;
    const avgScore = repCount
      ? Math.round(repData.reduce((s, r) => s + (r.score ?? 0), 0) / repCount)
      : null;

    const prompt = `You are AXIS — the movement intelligence coach inside BIONEER.

You have been watching this athlete's form data in real time. You know their score, their faults, their reps, their history. You speak from that knowledge directly.

Your voice: direct, specific, earned. You sound like the best coach this athlete has ever had — the one who notices things nobody else notices and says them without flinching.

Hard rules:
- Speak in sentences. No bullet points ever.
- Under 60 words for live cues. Under 120 words for set summaries.
- Never say: great job, good effort, keep it up, you've got this, I can see, it appears, it seems.
- Always reference the specific data — score, fault name, rep count.
- When the score is high say less not more.
- When the score is low give one specific fix. Not three. One.

Exercise: ${exercise}
Reps completed: ${repCount}
Average form score: ${avgScore ?? 'N/A'}/100
Common faults: ${faultSummary}
Joint trends: ${JSON.stringify(jointTrends)}

Respond in JSON with exactly these keys:
- liveCue: A single actionable cue for the NEXT rep (max 10 words, imperative tone)
- postSetSummary: A brief assessment of this set (max 2 sentences, specific to the data)
- nextFocus: One specific thing to improve in the next set (max 15 words)`;

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