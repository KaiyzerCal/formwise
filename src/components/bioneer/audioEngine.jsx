// Audio alert engine using Web Audio API

let audioCtx = null;
let lastBeepTime = 0;
const COOLDOWN_MS = 2000;

export function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
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
    g.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + t + 0.04
    );
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