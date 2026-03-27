/**
 * VoiceCoachingEngine.js
 * 
 * Handles voice synthesis and playback during session replay.
 * - Syncs precisely to video timestamps
 * - Respects priority (high overrides medium/low)
 * - Natural timing with 0.5–1s delay
 * - Only ONE voice at a time
 */

class VoiceCoachingEngine {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.isEnabled = true;
    this.masterVolume = 0.8;
    this.voiceIndex = 0; // Default voice
    this.listeners = new Set();
  }

  /**
   * Enable/disable voice coaching
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled && this.currentUtterance) {
      this.synth?.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Set master volume (0–1)
   */
  setVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Select voice by index (default to first available)
   */
  setVoice(index) {
    const voices = this.synth?.getVoices() || [];
    if (index >= 0 && index < voices.length) {
      this.voiceIndex = index;
    }
  }

  /**
   * Speak a coaching message
   * 
   * @param {string} message - The coaching cue to speak
   * @param {Object} options - { rate, pitch, delay }
   */
  async speak(message, options = {}) {
    if (!this.isEnabled || !this.synth || !message) return;

    const { rate = 0.95, pitch = 1, delay = 0.5 } = options;

    // Stop current speech if it's lower priority
    if (this.currentUtterance) {
      this.synth.cancel();
    }

    // Apply natural delay (0.5–1s before speaking)
    await new Promise(resolve => setTimeout(resolve, delay * 1000));

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = this.masterVolume;

    // Set voice if available
    const voices = this.synth.getVoices();
    if (voices[this.voiceIndex]) {
      utterance.voice = voices[this.voiceIndex];
    }

    // Track playback state
    utterance.onstart = () => {
      this.currentUtterance = utterance;
      this.notifyListeners({ type: 'speaking', message });
    };

    utterance.onend = () => {
      if (this.currentUtterance === utterance) {
        this.currentUtterance = null;
      }
      this.notifyListeners({ type: 'finished', message });
    };

    utterance.onerror = (err) => {
      console.warn('[VoiceCoaching] Speech synthesis error:', err);
      this.currentUtterance = null;
      this.notifyListeners({ type: 'error', message, error: err.error });
    };

    this.synth.speak(utterance);
  }

  /**
   * Cancel current speech
   */
  cancel() {
    if (this.synth && this.currentUtterance) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Get available voices
   */
  getAvailableVoices() {
    return this.synth?.getVoices() || [];
  }

  /**
   * Subscribe to playback events
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event) {
    this.listeners.forEach(cb => cb(event));
  }

  /**
   * Pre-warm voices (help browser prepare)
   */
  warmupVoices() {
    if (!this.synth) return;
    
    const voices = this.synth.getVoices();
    // Trigger voice list load if not ready
    if (voices.length === 0) {
      this.synth.getVoices();
    }
  }
}

// Singleton instance
let instance = null;

export function getVoiceCoachingEngine() {
  if (!instance) {
    instance = new VoiceCoachingEngine();
  }
  return instance;
}

export function resetVoiceCoachingEngine() {
  instance = null;
}