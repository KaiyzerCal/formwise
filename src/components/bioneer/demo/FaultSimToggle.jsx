import React from "react";

export default function FaultSimToggle({ faults, activeFault, onChange }) {
  const tabs = [{ id: null, label: "IDEAL" }, ...faults];

  return (
    <div className="space-y-3">
      {/* Toggle pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((f) => {
          const isActive = activeFault?.id === f.id || (!activeFault && f.id === null);
          return (
            <button
              key={f.id ?? "ideal"}
              onClick={() => onChange(f.id ? faults.find((x) => x.id === f.id) : null)}
              className={`
                flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase transition-all duration-200
                ${isActive
                  ? f.id === null
                    ? "bg-[#22C55E]/20 border border-[#22C55E] text-[#22C55E]"
                    : "bg-[#EF4444]/20 border border-[#EF4444] text-[#EF4444]"
                  : "bg-white/5 border border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                }
              `}
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Fault explanation card */}
      {activeFault && (
        <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/5 p-4 space-y-1.5">
          <p className="text-[10px] text-[#EF4444] font-bold tracking-widest uppercase"
             style={{ fontFamily: "'DM Mono', monospace" }}>
            {activeFault.label}
          </p>
          <p className="text-xs text-white/70 leading-relaxed">{activeFault.description}</p>
          <p className="text-xs text-[#C9A84C] leading-relaxed">→ {activeFault.explanation}</p>
        </div>
      )}
    </div>
  );
}