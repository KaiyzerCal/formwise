/**
 * LiveCoachingControls.jsx
 * 
 * Minimal floating UI for live coaching control during capture:
 * - Mute/unmute toggle (easy thumb access)
 * - Volume slider
 * - Intensity indicator
 * 
 * Designed for mobile + tablet use during active recording
 */

import React from 'react';
import { Volume2, VolumeX, Settings } from 'lucide-react';
import { COLORS, FONT } from '../ui/DesignTokens';

export default function LiveCoachingControls({
  coaching,
  onToggle,
  onVolumeChange,
  onIntensityChange,
}) {
  const isMuted = !coaching.isCoachingEnabled;

  return (
    <div
      className="fixed bottom-6 right-6 flex flex-col gap-2 z-40"
      style={{
        fontFamily: FONT.mono,
      }}
    >
      {/* Mute Toggle (Primary) */}
      <button
        onClick={() => onToggle(!isMuted)}
        className="p-3 rounded-full transition-all transform hover:scale-110"
        style={{
          background: isMuted ? COLORS.border : COLORS.gold,
          color: isMuted ? COLORS.textSecondary : COLORS.bg,
          boxShadow: `0 4px 12px ${isMuted ? 'rgba(0,0,0,0.2)' : COLORS.gold}40`,
        }}
        aria-label={isMuted ? 'Enable coaching' : 'Mute coaching'}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {/* Expanded Controls (Optional) */}
      {!isMuted && (
        <div
          className="p-3 rounded-lg backdrop-blur-md border animate-in fade-in slide-in-from-bottom-2"
          style={{
            background: COLORS.surface,
            borderColor: COLORS.border,
            minWidth: '180px',
          }}
        >
          {/* Volume Slider */}
          <div className="mb-3">
            <label
              className="text-[10px] tracking-widest uppercase mb-2 block"
              style={{
                color: COLORS.textSecondary,
                fontWeight: 600,
                letterSpacing: '0.1em',
              }}
            >
              Volume
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={coaching.volume * 100}
              onChange={(e) => onVolumeChange(e.target.value / 100)}
              className="w-full"
              style={{
                accentColor: COLORS.gold,
              }}
              aria-label="Coaching volume"
            />
            <div
              className="text-[9px] mt-1"
              style={{
                color: COLORS.textSecondary,
              }}
            >
              {Math.round(coaching.volume * 100)}%
            </div>
          </div>

          {/* Intensity Selector */}
          <div>
            <label
              className="text-[10px] tracking-widest uppercase mb-2 block"
              style={{
                color: COLORS.textSecondary,
                fontWeight: 600,
                letterSpacing: '0.1em',
              }}
            >
              Intensity
            </label>
            <div className="grid grid-cols-3 gap-1">
              {['minimal', 'moderate', 'detailed'].map((level) => (
                <button
                  key={level}
                  onClick={() => onIntensityChange(level)}
                  className="px-2 py-1.5 rounded text-[9px] font-bold uppercase transition-colors"
                  style={{
                    background:
                      coaching.intensity === level ? COLORS.gold : COLORS.border,
                    color:
                      coaching.intensity === level
                        ? COLORS.bg
                        : COLORS.textSecondary,
                  }}
                  aria-label={`${level} coaching intensity`}
                  aria-pressed={coaching.intensity === level}
                >
                  {level.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Status Indicator */}
          <div
            className="mt-3 pt-3 border-t text-[9px] flex items-center gap-2"
            style={{
              borderColor: COLORS.border,
              color: COLORS.textSecondary,
            }}
          >
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                background: COLORS.gold,
              }}
            />
            Live Coaching Active
          </div>
        </div>
      )}

      {/* Collapsed Hint */}
      {isMuted && (
        <div
          className="text-[9px] text-center px-2 py-1 rounded opacity-75"
          style={{
            color: COLORS.textSecondary,
            fontFamily: FONT.mono,
          }}
        >
          Coaching off
        </div>
      )}
    </div>
  );
}