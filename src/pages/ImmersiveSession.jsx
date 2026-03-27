/**
 * ImmersiveSession — Immersive video + minimal UI
 * 
 * PHILOSOPHY: The user is inside the movement, not inside UI
 * - Fullscreen video/camera
 * - Pose overlay active
 * - UI fades after 2 seconds, reappears on tap
 * - Voice coaching = primary feedback
 * 
 * Wraps existing CameraView but with immersive presentation
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraView from '@/components/bioneer/CameraView';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
import { X, Volume2, VolumeX } from 'lucide-react';

export default function ImmersiveSession({ exercise, onClose }) {
  const navigate = useNavigate();
  const [showUI, setShowUI] = useState(true);
  const [muteCoaching, setMuteCoaching] = useState(false);
  const uiTimeoutRef = useRef(null);

  // Auto-hide UI after 2 seconds of inactivity
  useEffect(() => {
    const handleActivity = () => {
      setShowUI(true);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
      uiTimeoutRef.current = setTimeout(() => setShowUI(false), 2000);
    };

    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('mousemove', handleActivity);

    return () => {
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('mousemove', handleActivity);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    };
  }, []);

  const handleSessionEnd = (sessionData) => {
    // Session ended from camera view, go to summary
    navigate('/FormCheck', { state: { sessionData, phase: 'summary' } });
  };

  const handleClose = () => {
    navigate('/FormCheck');
  };

  if (!exercise) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ background: COLORS.bg }}>
        <p style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>No exercise selected</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: COLORS.bg }}>
      {/* Camera/Video stream (fullscreen) */}
      <div className="absolute inset-0">
        <CameraView exercise={exercise} onStop={handleSessionEnd} />
      </div>

      {/* UI Overlay (fades) */}
      <div
        className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 transition-opacity duration-300"
        style={{ opacity: showUI ? 1 : 0.2 }}
      >
        {/* Top: Timer + Close button */}
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="text-xs font-bold tracking-[0.1em] uppercase" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
            Live
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded bg-black/50 hover:bg-black/70 transition"
            title="Exit session"
          >
            <X size={16} style={{ color: COLORS.textSecondary }} />
          </button>
        </div>

        {/* Bottom: Minimal indicators */}
        <div className="flex items-center justify-between pointer-events-auto">
          {/* Status dots */}
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: COLORS.correct }} />
            <div className="w-2 h-2 rounded-full" style={{ background: COLORS.textTertiary }} />
          </div>

          {/* Coaching toggle */}
          <button
            onClick={() => setMuteCoaching(!muteCoaching)}
            className="p-2 rounded bg-black/50 hover:bg-black/70 transition"
            title={muteCoaching ? 'Enable coaching' : 'Mute coaching'}
          >
            {muteCoaching ? (
              <VolumeX size={16} style={{ color: COLORS.textSecondary }} />
            ) : (
              <Volume2 size={16} style={{ color: COLORS.gold }} />
            )}
          </button>
        </div>
      </div>

      {/* Tap to show UI indicator (shown when UI is hidden) */}
      {!showUI && (
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-300"
          style={{ opacity: 0.3 }}
        >
          <p className="text-[10px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            Tap to show controls
          </p>
        </div>
      )}
    </div>
  );
}