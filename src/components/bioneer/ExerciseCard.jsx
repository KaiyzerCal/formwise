import React from "react";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";
import { createPageUrl } from "@/utils";
import { DEMO_ASSETS } from "./demoAssets";

export default function ExerciseCard({ exercise, selected, onClick }) {
  const hasDemo = !!DEMO_ASSETS[exercise.id];

  const handleWatchForm = (e) => {
    e.stopPropagation();
    window.location.href = createPageUrl(`ProperFormDemo?exercise=${exercise.id}`);
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-xl p-5 text-left transition-all duration-300",
        "bg-white/[0.04] backdrop-blur-md border",
        selected
          ? "border-[#C9A84C] shadow-[0_0_20px_rgba(201,168,76,0.15)]"
          : "border-white/10 hover:border-white/20 hover:bg-white/[0.06]"
      )}
    >
      {selected && (
        <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
      )}
      <div className="text-2xl mb-3">{exercise.icon}</div>
      <h3
        className="text-white font-bold text-sm tracking-wide"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        {exercise.name}
      </h3>
      <p className="text-white/40 text-xs mt-1 tracking-wider uppercase"
         style={{ fontFamily: "'DM Mono', monospace" }}>
        {exercise.muscleGroup}
      </p>
      <div className="mt-3 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]/60" />
        <span className="text-[10px] text-white/30 uppercase tracking-widest"
              style={{ fontFamily: "'DM Mono', monospace" }}>
          {exercise.camera} view
        </span>
      </div>

      {/* Watch Proper Form button */}
      {hasDemo && (
        <div
          onClick={handleWatchForm}
          className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 hover:bg-[#C9A84C]/20 transition-colors cursor-pointer"
        >
          <Eye className="w-3 h-3 text-[#C9A84C]" />
          <span className="text-[9px] font-bold text-[#C9A84C] tracking-widest uppercase"
                style={{ fontFamily: "'DM Mono', monospace" }}>
            Watch Proper Form
          </span>
        </div>
      )}
    </button>
  );
}