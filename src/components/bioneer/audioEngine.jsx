// Audio alert engine using Web Audio API + TTS

let audioCtx = null;
let lastBeepTime = 0;
const COOLDOWN_MS = 2000;

export function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function beep(muted = false) {
  if (muted || !audioCtx) return;
  const now = Date.now();
  if (now - lastBeepTime < COOLDOWN_MS) return;
  lastBeepTime = now;

  [0, 0.12].forEach((t) => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.6, audioCtx.currentTime + t);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + t + 0.04);
    o.start(audioCtx.currentTime + t);
    o.stop(audioCtx.currentTime + t + 0.05);
  });
}

export function destroyAudio() {
  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
  }
}

/**
 * speak() — Text-to-speech for AI coaching cues.
 * Respects the formwise_ai_audio preference.
 * Cancels any in-progress speech before speaking.
 */
export function speak(text, options = {}) {
  if (!text) return;
  if (localStorage.getItem('formwise_ai_audio') !== 'true') return;
  if (!window.speechSynthesis) return;

  // Cancel any in-progress speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate ?? 1.1;    // slightly faster for gym context
  utterance.pitch = options.pitch ?? 0.95; // slightly lower — more authoritative
  utterance.volume = 1.0;

  // Prefer a male English voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('male')) ||
    voices.find(v => v.lang === 'en-US') ||
    voices[0];
  if (preferred) utterance.voice = preferred;

  window.speechSynthesis.speak(utterance);
}