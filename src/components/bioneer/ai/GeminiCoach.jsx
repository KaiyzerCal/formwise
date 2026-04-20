/**
 * GeminiCoach.js — Pure JS module. No React.
 * Wraps Gemini coaching via server-side proxy (Base44 function).
 * Falls back to direct client-side call if server key unavailable.
 * NEVER touches pose tracking, rep counting, or phase detection.
 */

import { base44 } from '@/api/base44Client';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const TIMEOUT_MS = 3000;
const CACHE_TTL_MS = 30_000;

// Simple LRU-ish cache keyed by JSON-stringified input
const _cache = new Map();

// Track whether the server proxy is available (null = unknown, true/false = known)
let _serverKeyAvailable = null;

export function getServerKeyStatus() {
  return _serverKeyAvailable;
}

function getUserApiKey() {
  return localStorage.getItem('formwise_gemini_key') || localStorage.getItem('bioneer_gemini_key') || null;
}

function getCoachSettings() {
  return {
    tone: localStorage.getItem('formwise_coach_tone') || localStorage.getItem('bioneer_coach_tone') || 'Direct',
    athleteLevel: localStorage.getItem('formwise_athlete_level') || localStorage.getItem('bioneer_athlete_level') || 'Intermediate',
  };
}

function isAiEnabled() {
  return localStorage.getItem('formwise_ai_enabled') !== 'false' && localStorage.getItem('bioneer_ai_enabled') !== 'false';
}

function buildFallbackSystemPrompt(tone, athleteLevel) {
  let base = `You are an elite strength and conditioning coach. You are providing real-time audio coaching cues during a live training session. The athlete cannot look at their phone.
Rules: (1) Output ONLY valid JSON. (2) 'cue' must be ≤7 words, imperative, no filler. (3) Only address the HIGHEST PRIORITY fault — never stack cues. (4) If confidence < 0.5, return null cue. (5) Consider rep fatigue — cues in reps 6+ should account for fatigue. (6) Athlete level: ${athleteLevel}.
Schema: { "cue": string|null, "issue": string, "confidence": number }`;
  if (tone === 'Encouraging') base += ' Be encouraging.';
  if (tone === 'Technical') base += ' Use biomechanical terminology.';
  return base;
}

async function fetchViaProxy(movementData, exerciseId) {
  const { tone, athleteLevel } = getCoachSettings();
  try {
    const res = await base44.functions.invoke('geminiCoach', {
      movementData,
      tone,
      exerciseId,
      athleteLevel,
    });
    const data = res?.data;
    if (data?.serverKeyAvailable === false) {
      _serverKeyAvailable = false;
      return null; // fall through to client-side
    }
    _serverKeyAvailable = true;
    return data;
  } catch {
    _serverKeyAvailable = false;
    return null;
  }
}

async function fetchViaClientKey(movementData, exerciseId) {
  const apiKey = getUserApiKey();
  if (!apiKey) return null;

  const { tone, athleteLevel } = getCoachSettings();
  const systemPrompt = buildFallbackSystemPrompt(tone, athleteLevel);
  const prompt = `Movement data: ${JSON.stringify(movementData)}`;

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
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    if (!raw) return null;
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
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
  if (!isAiEnabled()) return null;

  const cacheKey = JSON.stringify(movementData);
  const cached = _cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.value;

  // Try server proxy only — no client-side key fallback for live cues
  let parsed = await fetchViaProxy(movementData, movementData?.exercise);
  if (!parsed) return null;

  if (!parsed.cue || typeof parsed.confidence !== 'number') return null;

  const result = { cue: parsed.cue, issue: parsed.issue ?? '', confidence: parsed.confidence };
  _cache.set(cacheKey, { value: result, ts: Date.now() });
  return result;
}

/**
 * getSetAnalysis — called after each set (on session stop).
 */
export async function getSetAnalysis(repArray, exerciseName) {
  if (!isAiEnabled()) return null;
  if (!repArray?.length) return null;

  const apiKey = getUserApiKey();
  if (!apiKey) return null; // analysis uses client key only (not rate-limited)

  const { tone } = getCoachSettings();
  const systemPrompt = `You are an elite coach. Analyze this set of reps for a ${exerciseName || 'exercise'}. Identify the strongest pattern (positive or negative), the most impactful correction, and whether fatigue affected form. Be specific. 3 sentences max. No bullet points.${tone === 'Encouraging' ? ' Be encouraging.' : tone === 'Technical' ? ' Use biomechanical terminology.' : ''}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: `Rep data: ${JSON.stringify(repArray)}` }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 300 },
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
 * getSessionNarrative — called once when saving a session.
 */
export async function getSessionNarrative(sessionSummaryData) {
  if (!isAiEnabled()) return null;
  const apiKey = getUserApiKey();
  if (!apiKey) return null;

  const exercise = sessionSummaryData?.exercise_id || sessionSummaryData?.exercise || 'this exercise';
  const { tone } = getCoachSettings();
  const systemPrompt = `In one sentence, name the single most important thing this athlete should focus on in their next ${exercise} session based on this data. Be direct and specific.${tone === 'Encouraging' ? ' Be encouraging.' : ''}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: `Session summary: ${JSON.stringify(sessionSummaryData)}` }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 300 },
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
 * getCheckInCue — periodic session check-in every 5 reps.
 * Returns a strategic cue string or null.
 */
export async function getCheckInCue({ exerciseId, repNumber, recentScores, recurringFaults }) {
  if (!isAiEnabled()) return null;

  const movementData = {
    exercise: exerciseId,
    repNumber,
    checkIn: true,
    formScoreTrend: recentScores,
    sessionFaultHistory: recurringFaults,
  };

  const result = await getLiveCue(movementData);
  return result?.cue ?? null;
}