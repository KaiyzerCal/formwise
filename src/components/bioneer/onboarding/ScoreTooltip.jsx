/**
 * ScoreTooltip.jsx
 * Info button + popover explaining form score tiers.
 */
import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { COLORS, FONT } from '../ui/DesignTokens';

const TIERS = [
  { range: '90–100', label: 'ELITE',      color: '#C9A84C',  desc: 'Competition ready' },
  { range: '80–89',  label: 'STRONG',     color: '#22C55E',  desc: 'Minor refinements needed' },
  { range: '70–79',  label: 'DEVELOPING', color: '#EAB308',  desc: 'Focus on highlighted joints' },
  { range: '<70',    label: 'NEEDS WORK', color: '#EF4444',  desc: 'Review technique before adding load' },
];

export default function ScoreTooltip() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-5 h-5 rounded-full flex items-center justify-center border"
        style={{ borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)' }}
        aria-label="Score explanation">
        <Info size={10} style={{ color: 'rgba(255,255,255,0.4)' }} />
      </button>

      {open && (
        <div className="absolute right-0 bottom-8 z-50 w-60 rounded-xl border shadow-2xl p-4 space-y-3"
          style={{ background: COLORS.surface, borderColor: COLORS.border }}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold tracking-[0.15em] uppercase"
              style={{ color: COLORS.gold, fontFamily: FONT.mono }}>FORM SCORE GUIDE</span>
            <button onClick={() => setOpen(false)}>
              <X size={12} style={{ color: COLORS.textTertiary }} />
            </button>
          </div>
          {TIERS.map(({ range, label, color, desc }) => (
            <div key={range} className="flex items-center gap-3">
              <span className="text-[10px] font-bold w-12 flex-shrink-0"
                style={{ color, fontFamily: FONT.mono }}>{range}</span>
              <div>
                <div className="text-[9px] font-bold tracking-[0.1em]"
                  style={{ color, fontFamily: FONT.mono }}>{label}</div>
                <div className="text-[9px]"
                  style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}