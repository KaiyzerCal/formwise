import React from "react";

const RISK_COLORS = {
  HIGH:     "text-[#EF4444]",
  MODERATE: "text-[#F97316]",
  LOW:      "text-[#EAB308]",
};

export default function TechniquePanel({ techniqueText }) {
  return (
    <div className="space-y-6">
      {/* Form Standards */}
      <section>
        <SectionLabel>FORM STANDARDS</SectionLabel>
        <ul className="space-y-2 mt-2">
          {techniqueText.formStandards.map((s, i) => (
            <li key={i} className="flex gap-2 text-sm text-white/70 leading-relaxed">
              <span className="text-[#C9A84C] mt-0.5 flex-shrink-0">•</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Top Cues */}
      <section>
        <SectionLabel>TOP CUES</SectionLabel>
        {/* Focus cue highlight */}
        <div className="mt-2 rounded-xl border border-[#C9A84C]/40 bg-[#C9A84C]/8 p-3.5">
          <p className="text-[9px] text-[#C9A84C] font-bold tracking-[0.2em] uppercase mb-1"
             style={{ fontFamily: "'DM Mono', monospace" }}>
            FOCUS CUE
          </p>
          <p className="text-sm font-semibold text-white leading-snug">
            {techniqueText.singleCue}
          </p>
        </div>
        <ul className="space-y-2 mt-2">
          {techniqueText.topCues.slice(1).map((c, i) => (
            <li key={i} className="text-sm text-white/60 pl-3 border-l border-white/10 leading-relaxed">
              {c}
            </li>
          ))}
        </ul>
      </section>

      {/* Common Mistakes */}
      <section>
        <SectionLabel>COMMON MISTAKES</SectionLabel>
        <div className="space-y-2 mt-2">
          {techniqueText.commonMistakes.map((m, i) => (
            <div key={i} className="rounded-lg bg-white/[0.03] border border-white/5 p-3 space-y-1">
              <div className="flex items-start gap-2">
                <span className="text-[#EF4444] text-xs font-bold mt-0.5 flex-shrink-0">✗</span>
                <span className="text-xs text-white/80 font-medium leading-snug">{m.mistake}</span>
                <span className={`ml-auto text-[9px] font-bold tracking-wider flex-shrink-0 mt-0.5 ${RISK_COLORS[m.risk] || "text-white/30"}`}
                      style={{ fontFamily: "'DM Mono', monospace" }}>
                  {m.risk}
                </span>
              </div>
              <div className="flex items-start gap-2 pl-4">
                <span className="text-[#22C55E] text-xs flex-shrink-0">→</span>
                <span className="text-xs text-white/50 leading-snug">{m.fix}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Red Flag Warnings */}
      <section>
        <SectionLabel warn>⚠ RED FLAGS</SectionLabel>
        <div className="space-y-2 mt-2">
          {techniqueText.redFlagWarnings.map((w, i) => (
            <div key={i} className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/5 p-3">
              <p className="text-xs text-white/70 leading-relaxed">{w}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionLabel({ children, warn }) {
  return (
    <p
      className={`text-[10px] font-bold tracking-[0.25em] uppercase ${warn ? "text-[#EF4444]" : "text-white/30"}`}
      style={{ fontFamily: "'DM Mono', monospace" }}
    >
      {children}
    </p>
  );
}