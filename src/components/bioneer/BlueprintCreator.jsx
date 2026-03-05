import React, { useState } from "react";
import { ArrowLeft, Bookmark, Check } from "lucide-react";
import { generateBlueprint, saveBlueprint } from "./blueprintStore";
import { getMovementById } from "./videoAnalysisEngine";

export default function BlueprintCreator({ frameResults, exerciseId, onSaved, onBack }) {
  const [label, setLabel] = useState("");
  const [saved, setSaved] = useState(false);
  const protocol = getMovementById(exerciseId);
  const exerciseName = protocol?.name || exerciseId?.replace(/_/g, " ") || "Movement";

  const handleSave = () => {
    const name = label.trim() || `My ${exerciseName} Blueprint`;
    const blueprint = generateBlueprint(frameResults, exerciseId, name);
    saveBlueprint(blueprint);
    setSaved(true);
    setTimeout(() => onSaved(), 1200);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div className="px-4 pt-12 pb-6 flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <div>
          <h1 className="text-sm font-bold tracking-[0.2em] text-[#C9A84C] uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>
            Create Blueprint
          </h1>
          <p className="text-[10px] text-white/30 tracking-widest uppercase mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
            Save as reference model
          </p>
        </div>
      </div>

      <div className="flex-1 px-4 max-w-lg mx-auto w-full space-y-6">
        {/* Illustration */}
        <div className="rounded-2xl bg-[#C9A84C]/5 border border-[#C9A84C]/20 p-6 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-[#C9A84C]/10 flex items-center justify-center">
            <Bookmark className="w-6 h-6 text-[#C9A84C]" />
          </div>
          <p className="text-xs text-white/50 leading-relaxed max-w-xs">
            This blueprint captures the movement paths from your video and saves them as a reference model you can use during live training.
          </p>
          <p className="text-[10px] text-white/25 uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
            {exerciseName} · {frameResults?.filter(f => f.landmarks).length || 0} frames
          </p>
        </div>

        {/* Name input */}
        <div>
          <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
            Blueprint Name
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={`e.g. My Best ${exerciseName}`}
            maxLength={40}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
            style={{ fontFamily: "'DM Mono', monospace" }}
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saved}
          className={`w-full py-4 rounded-xl font-bold text-sm tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2
            ${saved
              ? "bg-[#22C55E] text-black"
              : "bg-[#C9A84C] hover:bg-[#b8943f] text-black"
            }`}
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          {saved ? (
            <><Check className="w-4 h-4" /> Blueprint Saved</>
          ) : (
            <><Bookmark className="w-4 h-4" /> Save Blueprint</>
          )}
        </button>

        <p className="text-center text-[9px] text-white/15 tracking-wider" style={{ fontFamily: "'DM Mono', monospace" }}>
          Stored locally on this device. Not uploaded.
        </p>
      </div>
    </div>
  );
}