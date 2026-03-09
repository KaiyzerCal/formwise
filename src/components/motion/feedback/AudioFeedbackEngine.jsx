/**
 * motion/feedback/AudioFeedbackEngine.js
 *
 * Scaffold for audio feedback output.
 * Currently wraps the existing beep utility.
 * Future: Web Speech API for TTS coaching cues.
 */

import { beep, initAudio, destroyAudio } from '../../bioneer/audioEngine';

export class AudioFeedbackEngine {
  constructor() {
    this._muted  = false;
    this._ready  = false;
  }

  init() {
    initAudio();
    this._ready = true;
  }

  destroy() {
    destroyAudio();
    this._ready = false;
  }

  /** Emit an alert beep (existing behavior) */
  alert() {
    if (!this._muted) beep(false);
  }

  /**
   * Speak a coaching cue via Web Speech API (if available).
   * Falls back silently if not supported.
   * @param {string} text
   */
  speak(text) {
    if (this._muted || !text) return;
    if (!('speechSynthesis' in window)) return;
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate   = 0.95;
    utt.pitch  = 1.0;
    utt.volume = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  }

  set muted(v) { this._muted = !!v; }
  get muted()  { return this._muted; }
}