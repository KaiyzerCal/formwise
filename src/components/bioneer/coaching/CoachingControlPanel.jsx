/**
 * CoachingControlPanel.jsx
 * 
 * User controls for voice coaching during session replay:
 * - Mute/unmute coach
 * - Volume slider
 * - Intensity selector (minimal/moderate/detailed)
 * - Replay last cue
 * - Current coaching display
 */

import React from 'react';
import { Volume2, VolumeX, RotateCcw, MessageCircle } from 'lucide-react';
import { COLORS, FONT } from '../ui/DesignTokens';

export default function CoachingControlPanel({
  coaching,
  showDetails = true,
}) {
  if (!coaching) return null;

  const {
    currentEvent,
    isPlayingVoice,
    coachingEnabled,
    volume,
    intensity,
    toggleCoaching,
    setVolume,
    setCoachingIntensity,
    replayLastEvent,
    filteredEvents,
    totalEvents,
  } = coaching;

  return (
    <div
      className="flex flex-col gap-3 p-3 rounded-lg border"
      style={{
        background: COLORS.surface,
        borderColor: COLORS.border,
        fontFamily: FONT.mono,
      }}
    >
      {/* Header + Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={14} style={{ color: COLORS.gold }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: COLORS.textPrimary }}>
            AXIS
          </span>
          {isPlayingVoice && (
            <span
              className="animate-pulse"
              style={{ fontSize: '10px', color: COLORS.gold, fontWeight: 600 }}
            >
              ●
            </span>
          )}
        </div>

        <button
          onClick={toggleCoaching}
          className="p-1 rounded hover:bg-black/20 transition"
          title={coachingEnabled ? 'Mute coach' : 'Unmute coach'}
          aria-label="Toggle coaching"
        >
          {coachingEnabled ? (
            <Volume2 size={14} style={{ color: COLORS.gold }} />
          ) : (
            <VolumeX size={14} style={{ color: COLORS.textSecondary }} />
          )}
        </button>
      </div>

      {/* Volume Slider */}
      <div className="flex items-center gap-2">
        <span style={{ fontSize: '9px', color: COLORS.textSecondary }}>VOL</span>
        <input
          type="range"
          min="0"
          max="100"
          value={volume * 100}
          onChange={(e) => setVolume(parseFloat(e.target.value) / 100)}
          className="flex-1 h-1 rounded cursor-pointer"
          style={{
            background: COLORS.border,
            accentColor: COLORS.gold,
          }}
          disabled={!coachingEnabled}
        />
      </div>

      {/* Intensity Selector */}
      <div className="flex gap-1">
        {['minimal', 'moderate', 'detailed'].map((level) => (
          <button
            key={level}
            onClick={() => setCoachingIntensity(level)}
            className="flex-1 py-1 px-1.5 rounded text-[9px] font-semibold uppercase tracking-[0.1em] transition"
            style={{
              background:
                intensity === level ? COLORS.goldDim : 'transparent',
              color:
                intensity === level ? COLORS.gold : COLORS.textSecondary,
              border:
                intensity === level
                  ? `1px solid ${COLORS.gold}`
                  : `1px solid ${COLORS.border}`,
            }}
            disabled={!coachingEnabled}
            title={`${level.charAt(0).toUpperCase() + level.slice(1)} coaching intensity`}
          >
            {level.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Replay Last Cue */}
      {currentEvent && (
        <button
          onClick={replayLastEvent}
          className="flex items-center justify-center gap-2 py-1.5 px-2 rounded border transition"
          style={{
            background: COLORS.surface,
            borderColor: COLORS.gold,
            color: COLORS.gold,
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.1em',
          }}
          title="Replay the last coaching message"
        >
          <RotateCcw size={12} />
          REPLAY CUE
        </button>
      )}

      {/* Current Event Display */}
      {showDetails && currentEvent && (
        <div
          className="p-2 rounded text-[10px] leading-tight"
          style={{
            background: COLORS.goldDim,
            color: COLORS.textPrimary,
            borderLeft: `2px solid ${COLORS.gold}`,
          }}
        >
          <div
            style={{
              fontSize: '9px',
              color: COLORS.textSecondary,
              marginBottom: '4px',
              fontWeight: 600,
            }}
          >
            AXIS:
          </div>
          <div style={{ fontStyle: 'italic' }}>"{currentEvent.message}"</div>
        </div>
      )}

      {/* Stats Footer */}
      <div className="flex justify-between text-[9px] text-muted-foreground">
        <span style={{ color: COLORS.textSecondary }}>
          {filteredEvents} / {totalEvents} cues
        </span>
        <span
          style={{
            color: coachingEnabled ? COLORS.gold : COLORS.textSecondary,
            fontWeight: 600,
          }}
        >
          {coachingEnabled ? 'LIVE' : 'MUTED'}
        </span>
      </div>
    </div>
  );
}