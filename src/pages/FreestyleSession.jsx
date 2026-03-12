/**
 * FreestyleSession — Entry point for freestyle capture mode
 * Manages session lifecycle: camera → recording → history save
 */
import React, { useState, useRef, useCallback } from 'react';
import MovementLibrary from '../components/bioneer/MovementLibrary';
import FreestyleCameraView from '../components/bioneer/FreestyleCameraView';
import FreestyleReplay from '../components/bioneer/history/FreestyleReplay';
import { saveFreestyleSession } from '../components/bioneer/history/sessionStorage';
import { SESSION_CATEGORIES } from '../components/bioneer/session/sessionTypes';

const FREESTYLE_MODE = {
  id: 'freestyle',
  name: 'Freestyle',
  isFreestyle: true,
};

export default function FreestyleSession() {
  const [phase, setPhase] = useState('select');
  const [category, setCategory] = useState(SESSION_CATEGORIES.STRENGTH);
  const [recordedSession, setRecordedSession] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectCategory = useCallback((categoryValue) => {
    setCategory(categoryValue);
  }, []);

  const handleStartFreestyle = useCallback(() => {
    setPhase('camera');
  }, []);

  const handleCameraStop = useCallback((freestyleSession) => {
    setRecordedSession(freestyleSession);
    setPhase('replay');
  }, []);

  const handleSaveSession = useCallback(async () => {
    if (!recordedSession) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      // Validate blob before saving
      if (!recordedSession.videoBlob || !(recordedSession.videoBlob instanceof Blob) || recordedSession.videoBlob.size === 0) {
        throw new Error('Replay unavailable: session recording did not finalize correctly.');
      }

      await saveFreestyleSession({
        sessionId: recordedSession.sessionId,
        mode: recordedSession.mode,
        category: recordedSession.category,
        duration: recordedSession.duration,
        videoBlob: recordedSession.videoBlob,
        poseFrames: recordedSession.poseFrames || [],
        angleFrames: recordedSession.angleFrames || [],
      });

      // Reset to library after successful save
      setRecordedSession(null);
      setPhase('select');
    } catch (error) {
      setSaveError(error.message || 'Failed to save session. Please try again.');
      console.error('Failed to save freestyle session:', error);
    } finally {
      setIsSaving(false);
    }
  }, [recordedSession]);

  const handleDiscardSession = useCallback(() => {
    setRecordedSession(null);
    setPhase('select');
    setSaveError(null);
  }, []);

  const handleReplayClose = useCallback(() => {
    setRecordedSession(null);
    setPhase('select');
  }, []);

  // Phase: Select category
  if (phase === 'select') {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-md mx-auto space-y-6 py-8">
          {/* Header */}
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-[0.2em] uppercase" style={{ fontFamily: "'DM Mono', monospace", color: '#C9A84C' }}>
              Freestyle Capture
            </h1>
            <p className="text-xs text-white/50 tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
              Record and review any movement
            </p>
          </div>

          {/* Category buttons */}
          <div className="space-y-3">
            {[
              { value: SESSION_CATEGORIES.STRENGTH, label: 'Strength Training', icon: '🏋️' },
              { value: SESSION_CATEGORIES.SPORTS, label: 'Sports Performance', icon: '⚽' },
            ].map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => {
                  handleSelectCategory(value);
                  handleStartFreestyle();
                }}
                className="w-full py-4 px-4 rounded-lg border transition-all"
                style={{
                  background: category === value ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.04)',
                  borderColor: category === value ? '#C9A84C' : 'rgba(255,255,255,0.1)',
                  color: category === value ? '#C9A84C' : 'white',
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                <div className="text-3xl mb-2">{icon}</div>
                <div className="text-sm font-bold tracking-wide">{label}</div>
              </button>
            ))}
          </div>

          {/* Info */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
            <p className="text-[11px] text-white/60" style={{ fontFamily: "'DM Mono', monospace" }}>
              ✓ No form scoring — just recording<br />
              ✓ Full body tracking with pose overlay<br />
              ✓ Save to history for replay
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Phase: Camera (recording)
  if (phase === 'camera') {
    return (
      <FreestyleCameraView
        category={category}
        onStop={handleCameraStop}
      />
    );
  }

  // Phase: Replay + Save
  if (phase === 'replay' && recordedSession) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <FreestyleReplay
          session={recordedSession}
          onClose={handleReplayClose}
        />

        {/* Overlay controls */}
        <div className="absolute bottom-0 left-0 right-0 z-50 border-t"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="max-w-md mx-auto px-4 py-4 flex gap-3">
            <button
              onClick={handleDiscardSession}
              className="flex-1 py-3 rounded-lg border text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: 'white', fontFamily: "'DM Mono', monospace" }}>
              DISCARD
            </button>
            <button
              onClick={handleSaveSession}
              disabled={isSaving}
              className="flex-1 py-3 rounded-lg border text-sm font-bold transition-colors"
              style={{
                background: isSaving ? 'rgba(201,168,76,0.1)' : 'rgba(201,168,76,0.2)',
                borderColor: '#C9A84C',
                color: '#C9A84C',
                fontFamily: "'DM Mono', monospace",
                opacity: isSaving ? 0.6 : 1,
              }}>
              {isSaving ? 'SAVING...' : 'SAVE & CLOSE'}
            </button>
          </div>

          {/* Error message */}
          {saveError && (
            <div className="bg-red-500/10 border-t border-red-500/30 px-4 py-3 text-xs text-red-400 text-center"
              style={{ fontFamily: "'DM Mono', monospace" }}>
              {saveError}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}