import { createClient } from 'npm:@supabase/supabase-js@2';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const TIMEOUT_MS = 3000;
const RATE_LIMIT = 10; // calls per minute per user

// Deno KV for distributed, persistent rate limiting (survives across instances)
const kv = await Deno.openKv();

async function checkRateLimit(userId: string): Promise<boolean> {
  const key = ['rate_limit', 'gemini_coach', userId];
  const now = Date.now();
  const window = 60_000;

  const result = await kv.get<number[]>(key);
  const calls = (result.value ?? []).filter(t => now - t < window);

  if (calls.length >= RATE_LIMIT) return false;

  calls.push(now);
  await kv.set(key, calls, { expireIn: window + 5_000 });
  return true;
}

function buildSystemPrompt(tone: string, athleteLevel: string): string {
  let base = `You are an elite strength and conditioning coach. You are providing real-time audio coaching cues during a live training session. The athlete cannot look at their phone.
Rules:
(1) Output ONLY valid JSON — no markdown, no explanation.
(2) 'cue' must be ≤7 words, imperative, no filler. Example: "Drive knees out at bottom"
(3) Only address the HIGHEST PRIORITY fault — never stack cues.
(4) If confidence < 0.5, return null for cue.
(5) Consider rep fatigue — cues in reps 6+ should account for fatigue.
(6) Athlete level is ${athleteLevel || 'Intermediate'} — calibrate technical complexity accordingly.
Response schema: { "cue": string|null, "issue": string (max 3 words), "confidence": number (0-1) }`;

  if (tone === 'Encouraging') base += '\n(7) Be encouraging — acknowledge effort before correction.';
  if (tone === 'Technical')   base += '\n(7) Use biomechanical terminology. Be precise and clinical.';
  return base;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Authenticate via Supabase JWT
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, serviceKey);
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await checkRateLimit(user.id);
    if (!allowed) {
      return Response.json(
        { error: 'Rate limit exceeded', cue: null, issue: null, confidence: 0 },
        { status: 429 }
      );
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return Response.json(
        { error: 'No server API key configured', serverKeyAvailable: false },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { movementData, tone, exerciseId, repCount, faultHistory, athleteLevel } = body;

    const systemPrompt = buildSystemPrompt(tone, athleteLevel);
    const prompt = `Movement data: ${JSON.stringify({
      exercise:            exerciseId,
      repNumber:           movementData?.repNumber ?? repCount,
      exercisePhase:       movementData?.exercisePhase,
      activeFaults: (movementData?.active_faults ?? faultHistory ?? []).map((f: any) =>
        f && typeof f === 'object' ? { id: f.id, label: f.label, cue: f.cue, severity: f.severity } : f),
      sessionFaultHistory: (movementData?.sessionFaultHistory ?? []).map((f: any) =>
        f && typeof f === 'object' ? { id: f.id, label: f.label } : f),
      formScore:           movementData?.form_score,
      formScoreTrend:      movementData?.formScoreTrend ?? [],
      kneeAngle:           movementData?.knee_angle,
      hipAngle:            movementData?.hip_angle,
      torsoAngle:          movementData?.torso_angle,
      fatigueIndex:        movementData?.fatigue_index,
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
        return Response.json(
          { error: `Gemini error: ${res.status}`, detail: err, cue: null, confidence: 0 },
          { status: 502 }
        );
      }

      const data = await res.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
      if (!raw) return Response.json({ cue: null, issue: null, confidence: 0 });

      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed  = JSON.parse(cleaned);

      return Response.json({
        cue:              parsed.cue ?? null,
        issue:            parsed.issue ?? '',
        confidence:       parsed.confidence ?? 0,
        serverKeyAvailable: true,
      }, {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    } finally {
      clearTimeout(timer);
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return Response.json({ error: 'Timeout', cue: null, confidence: 0 }, { status: 504 });
    }
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: msg, cue: null, confidence: 0 }, { status: 500 });
  }
});
