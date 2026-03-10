import React from "react";
import { COLORS, FONT } from "./DesignTokens";
import { Volume2, VolumeX } from "lucide-react";

const COACH_LEVELS = ['Silent', 'Brief', 'Standard', 'Verbose'];

export default function LiveBottomBar({ running, onStart, onStop, coachLevel, setCoachLevel, audioOn, setAudioOn }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t flex-wrap" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      {/* Start / Stop */}
      {!running ? (
        <button
          onClick={onStart}
          className="px-6 py-2 rounded-md text-[10px] tracking-[0.15em] uppercase font-bold transition-colors"
          style={{ background: COLORS.gold, color: '#000', fontFamily: FONT.heading }}
        >
          START SESSION
        </button>
      ) : (
        <button
          onClick={onStop}
          className="px-6 py-2 rounded-md text-[10px] tracking-[0.15em] uppercase font-bold border transition-colors"
          style={{ background: 'transparent', color: COLORS.fault, borderColor: COLORS.fault, fontFamily: FONT.heading }}
        >
          STOP
        </button>
      )}

      {/* Coach level pills */}
      <div className="flex items-center gap-1 ml-auto">
        <span className="text-[8px] tracking-[0.1em] uppercase mr-1.5" style={{ color: COLORS.textTertiary }}>COACH</span>
        {COACH_LEVELS.map(level => (
          <button
            key={level}
            onClick={() => setCoachLevel(level)}
            className="px-2 py-1 rounded text-[9px] tracking-[0.1em] uppercase border transition-colors"
            style={{
              fontFamily: FONT.mono,
              background: coachLevel === level ? COLORS.goldDim : 'transparent',
              borderColor: coachLevel === level ? COLORS.goldBorder : COLORS.border,
              color: coachLevel === level ? COLORS.gold : COLORS.textTertiary,
            }}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Audio toggle */}
      <button
        onClick={() => setAudioOn(!audioOn)}
        className="p-2 rounded border transition-colors"
        style={{ borderColor: COLORS.border, color: audioOn ? COLORS.gold : COLORS.textTertiary }}
      >
        {audioOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
      </button>
    </div>
  );
}