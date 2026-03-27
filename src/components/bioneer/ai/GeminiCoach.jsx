/**
 * GeminiCoach.js — Pure JS module. No React.
 * Wraps Gemini 1.5 Flash API for AI coaching feedback.
 * NEVER touches pose tracking, rep counting, or phase detection.
 * Only receives pre-computed structured data from the pipeline.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const TIMEOUT_MS = 2500;
const CACHE_TTL_MS = 30_000;

// Simple LRU-ish cache keyed by JSON-stringified input
const _cache = new Map();

function getApiKey() {
  return (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
    localStorage.getItem('formwise_gemini_key') ||
    null
  );
}

function getCoachTone() {
  const tone = localStorage.getItem('formwise_coach_tone') || 'Direct';
  if (tone === 'Encouraging') return ' Be encouraging and acknowledge effort before correction.';
  if (tone === 'Technical') return ' Use biomechanical terminology. Be precise and clinical.';
  return '';
}

function isAiEnabled() {
  return localStorage.getItem('formwise_ai_enabled') !== 'false';
}

async function fetchGemini(prompt, systemPrompt, temperature = 0.2, maxOutputTokens = 100) {
  const apiKey = getApiKey();
  if (!apiKey || !isAiEnabled()) return null;

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
        generationConfig: { temperature, maxOutputTokens },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * getLiveCue — called once per rep when a fault is confirmed.
 * Returns { cue, issue, confidence } or null on failure.
 */
export async function getLiveCue(movementData) {
  if (!getApiKey() || !isAiEnabled()) return null;

  const cacheKey = JSON.stringify(movementData);
  const cached = _cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.value;

  const systemPrompt =
    `You are an elite strength and conditioning coach providing real-time biomechanical feedback. Respond ONLY with valid JSON matching this exact schema: { "cue": string (max 8 words, imperative tense, no filler words), "issue": string (max 3 words), "confidence": number (0-1) }. Base feedback ONLY on the provided metrics. Do not speculate. Do not explain. Output JSON only, no markdown.` +
    getCoachTone();

  const prompt = `Movement data: ${JSON.stringify(movementData)}`;
  const raw = await fetchGemini(prompt, systemPrompt, 0.2, 100);
  if (!raw) return null;

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed?.cue || typeof parsed.confidence !== 'number') return null;
    const result = { cue: parsed.cue, issue: parsed.issue ?? '', confidence: parsed.confidence };
    _cache.set(cacheKey, { value: result, ts: Date.now() });
    return result;
  } catch {
    return null;
  }
}

/**
 * getSetAnalysis — called after each set (on session stop).
 * Returns a coaching paragraph string (2–4 sentences) or null.
 */
export async function getSetAnalysis(repArray, exerciseName) {
  if (!getApiKey() || !isAiEnabled()) return null;
  if (!repArray?.length) return null;

  const systemPrompt =
    `You are an elite coach. Analyze this set of reps for a ${exerciseName || 'exercise'}. Identify the strongest pattern (positive or negative), the most impactful correction, and whether fatigue affected form. Be specific. 3 sentences max. No bullet points.` +
    getCoachTone();

  const prompt = `Rep data: ${JSON.stringify(repArray)}`;
  return await fetchGemini(prompt, systemPrompt, 0.3, 300);
}

/**
 * getSessionNarrative — called once when saving a session.
 * Returns a single insight sentence or null.
 */
export async function getSessionNarrative(sessionSummaryData) {
  if (!getApiKey() || !isAiEnabled()) return null;

  const exercise = sessionSummaryData?.exercise_id || sessionSummaryData?.exercise || 'this exercise';
  const systemPrompt =
    `In one sentence, name the single most important thing this athlete should focus on in their next ${exercise} session based on this data. Be direct and specific.` +
    getCoachTone();

  const prompt = `Session summary: ${JSON.stringify(sessionSummaryData)}`;
  return await fetchGemini(prompt, systemPrompt, 0.3, 300);
}