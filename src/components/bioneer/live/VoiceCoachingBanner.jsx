import React, { useState } from 'react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
import { Volume2 } from 'lucide-react';

/**
 * One-time dismissible banner shown on first-ever session.
 * Informs user that voice coaching is ON, with option to disable.
 */
export default function VoiceCoachingBanner() {
  const [dismissed, setDismissed] = useState(false);

  // Only show once ever
  if (dismissed || localStorage.getItem('bioneer_onboarded') === 'true') {
    return null;
  }

  const handleGotIt = () => {
    localStorage.setItem('bioneer_onboarded', 'true');
    setDismissed(true);
  };

  const handleTurnOff = () => {
    localStorage.setItem('formwise_ai_audio', 'false');
    localStorage.setItem('bioneer_onboarded', 'true');
    setDismissed(true);
  };

  return (
    <div
      className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 gap-3"
      style={{
        background: `linear-gradient(135deg, ${COLORS.goldDim}, rgba(201,162,39,0.18))`,
        borderBottom: `1px solid ${COLORS.goldBorder}`,
        fontFamily: FONT.mono,
      }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Volume2 size={14} style={{ color: COLORS.gold, flexShrink: 0 }} />
        <p className="text-[9px] tracking-[0.06em]" style={{ color: COLORS.gold }}>
          Voice coaching is ON — corrections will be called out in real time.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleGotIt}
          className="px-3 py-1.5 rounded text-[9px] font-bold tracking-[0.1em] uppercase"
          style={{ background: COLORS.gold, color: COLORS.bg }}
        >
          Got it
        </button>
        <button
          onClick={handleTurnOff}
          className="px-3 py-1.5 rounded text-[9px] font-bold tracking-[0.1em] uppercase border"
          style={{ borderColor: COLORS.goldBorder, color: COLORS.gold, background: 'transparent' }}
        >
          Turn off
        </button>
      </div>
    </div>
  );
}