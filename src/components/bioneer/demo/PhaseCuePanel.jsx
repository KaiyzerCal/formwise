import React, { useState, useEffect } from "react";

export default function PhaseCuePanel({ phase, cue }) {
  const [visible, setVisible] = useState(true);
  const [displayedPhase, setDisplayedPhase] = useState(phase);
  const [displayedCue, setDisplayedCue]     = useState(cue);

  useEffect(() => {
    if (phase === displayedPhase && cue === displayedCue) return;
    // Fade out → update → fade in
    setVisible(false);
    const t = setTimeout(() => {
      setDisplayedPhase(phase);
      setDisplayedCue(cue);
      setVisible(true);
    }, 150);
    return () => clearTimeout(t);
  }, [phase, cue]);

  return (
    <div
      className="px-4 py-3 rounded-xl border border-white/5 bg-white/[0.03] transition-opacity duration-150"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
        <span
          className="text-[9px] font-bold text-[#C9A84C] tracking-[0.25em] uppercase"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {displayedPhase?.replace(/_/g, " ") || "—"}
        </span>
      </div>
      {displayedCue && (
        <p className="text-xs text-white/70 leading-relaxed">{displayedCue}</p>
      )}
    </div>
  );
}