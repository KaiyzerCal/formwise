/**
 * TechniqueFrameControls
 * Frame-by-frame playback, speed control, timeline scrubber
 */

import React, { useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, FastForward } from 'lucide-react';
import { COLORS, FONT } from '../../ui/DesignTokens';

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.5, 2];

export default function TechniqueFrameControls({
  isPlaying,
  onPlay,
  onPause,
  currentTime,
  duration,
  onSeek,
  currentFrameIndex,
  totalFrames,
  onStepForward,
  onStepBackward,
  onJumpFrames,
  speed,
  onSpeedChange,
  fps = 30,
}) {
  const [localSpeed, setLocalSpeed] = useState(speed || 1);

  const handleSpeedChange = useCallback((newSpeed) => {
    setLocalSpeed(newSpeed);
    onSpeedChange?.(newSpeed);
  }, [onSpeedChange]);

  const handleSeek = useCallback((e) => {
    const newTime = parseFloat(e.target.value);
    onSeek?.(newTime);
  }, [onSeek]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFrameInfo = () => {
    const frameMs = currentFrameIndex / (fps / 1000);
    return `${currentFrameIndex + 1}/${totalFrames || '?'} @ ${formatTime(currentTime)}`;
  };

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.();
    }
  }, [isPlaying, onPlay, onPause]);

  return (
    <div className="flex flex-col gap-3 px-4 py-3 border-t flex-shrink-0" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
      {/* Timeline scrubber */}
      <div className="space-y-1">
        <input
          type="range"
          min="0"
          max={duration || 1}
          step="0.033"
          value={currentTime}
          onChange={handleSeek}
          disabled={duration === 0}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
          style={{
            accentColor: COLORS.gold,
            opacity: duration > 0 ? 1 : 0.3,
          }}
        />
        <div className="flex justify-between text-[9px]" style={{ color: COLORS.textTertiary }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Frame info */}
      <div className="text-[9px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary }}>
        {formatFrameInfo()}
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Play/Pause */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={duration === 0}
          className="p-1.5 rounded border disabled:opacity-30"
          style={{
            background: isPlaying ? COLORS.goldDim : 'transparent',
            borderColor: isPlaying ? COLORS.goldBorder : COLORS.border,
            color: isPlaying ? COLORS.gold : COLORS.textTertiary,
          }}
          title="Play/Pause"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} fill={COLORS.gold} />}
        </button>

        {/* Frame step backward */}
        <button
          onClick={onStepBackward}
          disabled={duration === 0 || currentFrameIndex === 0}
          className="p-1.5 rounded border disabled:opacity-30"
          style={{ borderColor: COLORS.border, color: COLORS.textTertiary }}
          title="Previous frame"
        >
          <SkipBack size={14} />
        </button>

        {/* Frame step forward */}
        <button
          onClick={onStepForward}
          disabled={duration === 0 || currentFrameIndex >= (totalFrames || 0) - 1}
          className="p-1.5 rounded border disabled:opacity-30"
          style={{ borderColor: COLORS.border, color: COLORS.textTertiary }}
          title="Next frame"
        >
          <SkipForward size={14} />
        </button>

        {/* Jump frames */}
        <button
          onClick={() => onJumpFrames?.(5)}
          disabled={duration === 0}
          className="px-2 py-1 rounded border text-[9px] font-bold disabled:opacity-30"
          style={{ borderColor: COLORS.border, color: COLORS.textTertiary }}
          title="Jump 5 frames forward"
        >
          +5
        </button>

        {/* Speed control */}
        <div className="flex items-center gap-1 ml-auto">
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              className="px-2 py-1 rounded text-[9px] border font-bold"
              style={{
                background: localSpeed === s ? COLORS.goldDim : 'transparent',
                borderColor: localSpeed === s ? COLORS.goldBorder : COLORS.border,
                color: localSpeed === s ? COLORS.gold : COLORS.textTertiary,
              }}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}