/**
 * LiveCoachingOverlay.jsx
 * 
 * Real-time visual feedback during capture:
 * - Large, readable coaching message
 * - Body part highlighting (glow on canvas)
 * - Priority indicator (color code)
 * - Fade in/out animation
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle, Zap } from 'lucide-react';
import { COLORS, FONT } from '../ui/DesignTokens';

export default function LiveCoachingOverlay({ coaching }) {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (coaching?.currentCue) {
      setVisible(true);
      setFadeOut(false);

      // Auto fade after duration
      const fadeTimer = setTimeout(() => {
        setFadeOut(true);
      }, coaching.currentCue.duration);

      const hideTimer = setTimeout(() => {
        setVisible(false);
      }, coaching.currentCue.duration + 300);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setVisible(false);
    }
  }, [coaching?.currentCue]);

  if (!visible || !coaching?.currentCue) {
    return null;
  }

  const cue = coaching.currentCue;
  const isPriority = cue.priority === 'high';

  const priorityColor = {
    high: COLORS.gold,
    medium: '#FEA500',
    low: '#9CA3AF',
  }[cue.priority];

  return (
    <div
      className={`absolute inset-0 pointer-events-none flex flex-col items-center justify-center transition-opacity duration-300 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        zIndex: 50,
        background: 'rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Priority Indicator Pulse */}
      {isPriority && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background: `radial-gradient(circle, ${priorityColor}15 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Main Cue Box */}
      <div
        className="relative px-6 py-4 rounded-lg backdrop-blur-md border-2 animate-in fade-in scale-in-95 duration-200"
        style={{
          background: `${COLORS.surface}dd`,
          borderColor: priorityColor,
          boxShadow: `0 0 20px ${priorityColor}40, inset 0 0 10px ${priorityColor}15`,
        }}
      >
        {/* Top indicator */}
        <div
          className="flex items-center gap-2 mb-3 text-xs tracking-widest uppercase"
          style={{
            color: priorityColor,
            fontFamily: FONT.mono,
            fontWeight: 600,
            letterSpacing: '0.15em',
          }}
        >
          {isPriority ? (
            <Zap size={12} className="animate-pulse" />
          ) : (
            <AlertCircle size={12} />
          )}
          AXIS
        </div>

        {/* Main Message */}
        <div
          className="text-2xl font-bold tracking-tight leading-tight"
          style={{
            color: COLORS.textPrimary,
            fontFamily: FONT.heading,
            textShadow: `0 2px 8px rgba(0,0,0,0.3)`,
          }}
        >
          {cue.message}
        </div>

        {/* Body part indicator */}
        {cue.bodyParts && cue.bodyParts.length > 0 && (
          <div
            className="mt-2 text-xs"
            style={{
              color: priorityColor,
              fontFamily: FONT.mono,
            }}
          >
            {cue.bodyParts.map(p => p.replace('_', ' ')).join(', ')}
          </div>
        )}
      </div>

      {/* Bottom accent */}
      <div
        className="absolute bottom-8 h-1 w-32 rounded-full animate-pulse"
        style={{
          background: `linear-gradient(90deg, transparent, ${priorityColor}, transparent)`,
        }}
      />
    </div>
  );
}