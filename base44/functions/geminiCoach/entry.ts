import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const TIMEOUT_MS = 3000;

// Simple in-memory rate limiter: userId → [timestamps]
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

function buildSystemPrompt(tone, athleteLevel) {
  let base = `You are AXIS. You are watching this athlete move in real time. You speak once per rep with one cue — the single most important correction available right now.

Your cue is 7 words maximum. Imperative. Specific to the fault. No filler.

If everything looks correct say nothing — return null for cue.
If confidence is below 0.5 say nothing — return null.

You never stack corrections. One fault. One cue. The most important one.
You calibrate to the athlete's level. ${athleteLevel === 'Beginner' ? 'Beginner — simple anatomical language.' : athleteLevel === 'Advanced' ? 'Advanced — precise biomechanical language.' : 'Intermediate — clear coaching language.'}
Fatigue is real. Rep 8 of 10 gets a different cue than rep 2 of 10.

Output ONLY valid JSON. Response schema: { "cue": string|null, "issue": string (max 3 words), "confidence": number (0-1) }`;

  if (tone === 'Encouraging') base += '\nAcknowledge effort briefly before correction.';
  if (tone === 'Technical') base += '\nUse biomechanical terminology. Be precise.';
  return base;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, X-App-Id' } });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!checkRateLimit(user.id || user.email)) {
      return Response.json({ error: 'Rate limit exceeded', cue: null, issue: null, confidence: 0 }, { status: 429 });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'No server API key configured', serverKeyAvailable: false }, { status: 503 });
    }

    const body = await req.json();
    const { movementData, tone, exerciseId, repCount, faultHistory, athleteLevel } = body;

    const systemPrompt = buildSystemPrompt(tone, athleteLevel);
    const prompt = `Movement data: ${JSON.stringify({
      exercise: exerciseId,
      repNumber: movementData?.repNumber ?? repCount,
      exercisePhase: movementData?.exercisePhase,
      activeFaults: movementData?.active_faults ?? faultHistory ?? [],
      sessionFaultHistory: movementData?.sessionFaultHistory ?? [],
      formScore: movementData?.form_score,
      formScoreTrend: movementData?.formScoreTrend ?? [],
      kneeAngle: movementData?.knee_angle,
      hipAngle: movementData?.hip_angle,
      torsoAngle: movementData?.torso_angle,
      fatigueIndex: movementData?.fatigue_index,
    })}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 100 },
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: `Gemini error: ${res.status}`, detail: err, cue: null, confidence: 0 }, { status: 502 });
      }

      const data = await res.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
      if (!raw) return Response.json({ cue: null, issue: null, confidence: 0 });

      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return Response.json({
        cue: parsed.cue ?? null,
        issue: parsed.issue ?? '',
        confidence: parsed.confidence ?? 0,
        serverKeyAvailable: true,
      });
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return Response.json({ error: 'Timeout', cue: null, confidence: 0 }, { status: 504 });
    }
    return Response.json({ error: error.message, cue: null, confidence: 0 }, { status: 500 });
  }
});