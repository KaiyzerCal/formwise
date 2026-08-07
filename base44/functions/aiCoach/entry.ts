/**
 * aiCoach — Gemini-powered real-time coaching function
 * Input:  { repData, jointTrends, commonFaults, exercise }
 * Output: { liveCue, postSetSummary, nextFocus }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Simple in-memory rate limiter: userId → [timestamps]. Mirrors geminiCoach's
// limiter — this function calls a paid LLM per request with no other cost
// control, so an authenticated user hammering it in a loop had no ceiling.
const rateLimitMap = new Map();
const RATE_LIMIT = 10; // calls per minute per user

function checkRateLimit(userId) {
  const now = Date.now();
  const window = 60_000;
  const calls = (rateLimitMap.get(userId) || []).filter(t => now - t < window);
  if (calls.length >= RATE_LIMIT) return false;
  calls.push(now);
  rateLimitMap.set(userId, calls);
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!checkRateLimit(user.id || user.email)) {
      return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json();
    const { requestType } = body;

    // ── Session Summary Request ──────────────────────────────────────────
    if (requestType === 'sessionSummary') {
      const { sessionData } = body;
      const prompt = `You are a strength and conditioning coach reviewing a completed training session.
Session: ${JSON.stringify(sessionData)}
Write a 2-3 sentence coaching summary: what went well, the main fault to address, and one actionable cue for next session.
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