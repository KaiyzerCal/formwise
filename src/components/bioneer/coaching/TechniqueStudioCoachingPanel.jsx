/**
 * TechniqueStudioCoachingPanel.jsx
 * 
 * Coaching integration for Technique Studio.
 * Displays coaching cues during technique video review with:
 * - Real-time body part highlighting
 * - Subtitle display
 * - Timeline markers
 * - Control panel
 */

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { COLORS, FONT } from '../ui/DesignTokens';
import CoachingControlPanel from './CoachingControlPanel';
import { useCoachingOverlay } from './useCoachingOverlay';

export default function TechniqueStudioCoachingPanel({
  coaching,
  currentTime,
  onBodyPartHighlight,
}) {
  const overlay = useCoachingOverlay(
    coaching?.currentEvent ?? null,
    coaching?.isPlayingVoice ?? false
  );

  // Notify parent of highlighted parts (for visual feedback)
  React.useEffect(() => {
    if (onBodyPartHighlight) {
      onBodyPartHighlight(overlay.highlightedParts);
    }
  }, [overlay.highlightedParts, onBodyPartHighlight]);

  if (!coaching) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* Subtitle Display */}
      {overlay.showSubtitle && overlay.currentMessage && (
        <div
          className="p-3 rounded-lg border-l-2 animate-in fade-in"
          style={{
            background: COLORS.goldDim,
            borderColor: COLORS.gold,
            color: COLORS.textPrimary,
            fontFamily: FONT.mono,
            fontSize: '12px',
            lineHeight: '1.5',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '6px',
            }}
          >
            <MessageSquare
              size={14}
              style={{
                color: COLORS.gold,
                flexShrink: 0,
                animation: coaching.isPlayingVoice ? 'pulse 1s infinite' : 'none',
              }}
            />
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                color: COLORS.textSecondary,
                textTransform: 'uppercase',
              }}
            >
              AXIS:
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontStyle: 'italic',
              fontWeight: 500,
            }}
          >
            "{overlay.currentMessage}"
          </p>

          {/* Priority Badge */}
          {coaching.currentEvent?.priority && (
            <div
              style={{
                marginTop: '8px',
                display: 'inline-block',
                padding: '2px 6px',
                borderRadius: '3px',
                background: 'rgba(0,0,0,0.2)',
                fontSize: '9px',
                fontWeight: 600,
                color: COLORS.gold,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {coaching.currentEvent.priority}
            </div>
          )}
        </div>
      )}

      {/* Control Panel */}
      <CoachingControlPanel coaching={coaching} showDetails={false} />

      {/* Timeline Indicator */}
      <div
        className="flex items-center justify-between text-[9px]"
        style={{
          color: COLORS.textSecondary,
          fontFamily: FONT.mono,
        }}
      >
        <span>{coaching.filteredEvents} coaching cues</span>
        <span>
          {coaching.coachingEnabled ? (
            <span style={{ color: COLORS.gold, fontWeight: 600 }}>● LIVE</span>
          ) : (
            <span>○ MUTED</span>
          )}
        </span>
      </div>
    </div>
  );
}