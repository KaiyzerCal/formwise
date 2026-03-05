import React, { useState } from "react";
import { EXERCISES } from "./exerciseLibrary";
import { SPORTS_MOVEMENTS } from "./sportsLibrary";
import ExerciseCard from "./ExerciseCard";
import MyBlueprints from "./MyBlueprints";
import { ArrowLeft, Scan, Video, Bookmark } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function MovementLibrary({ onSelect, selectedId }) {
  const [activeTab, setActiveTab] = useState("strength");
  const [showBlueprints, setShowBlueprints] = useState(false);

  const movements = activeTab === "strength" ? EXERCISES : SPORTS_MOVEMENTS;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <div className="flex-1">
            <h1
              className="text-sm font-bold tracking-[0.2em] text-[#C9A84C] uppercase"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Movement Library
            </h1>
            <p
              className="text-[10px] text-white/30 tracking-widest uppercase mt-0.5"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              Select movement to analyze
            </p>
          </div>
          <a
            href={createPageUrl("VideoAnalysis")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 hover:bg-[#C9A84C]/15 transition-colors"
          >
            <Video className="w-3.5 h-3.5 text-[#C9A84C]" />
            <span className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-wider hidden sm:inline" style={{ fontFamily: "'DM Mono', monospace" }}>
              Analyze Video
            </span>
          </a>
        </div>

        {/* Tabs */}
        <div className="max-w-lg mx-auto px-4 pb-0 flex gap-0">
          {["strength", "sports", "blueprints"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                if (tab === "blueprints") setShowBlueprints(true);
                else { setShowBlueprints(false); setActiveTab(tab); }
              }}
              className="flex-1 py-3 relative text-xs font-bold tracking-[0.1em] uppercase transition-colors flex items-center justify-center gap-1"
              style={{
                fontFamily: "'DM Mono', monospace",
                color: (tab === "blueprints" ? showBlueprints : (!showBlueprints && activeTab === tab)) ? "#C9A84C" : "rgba(255,255,255,0.3)",
                fontSize: "9px",
              }}
            >
              {tab === "blueprints" && <Bookmark className="w-3 h-3" />}
              {tab === "strength" ? "Strength" : tab === "sports" ? "Sports" : "Blueprints"}
              {(tab === "blueprints" ? showBlueprints : (!showBlueprints && activeTab === tab)) && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A84C]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {showBlueprints ? (
          <MyBlueprints
            onSelectBlueprint={(bp) => {
              const allMovements = [...EXERCISES, ...SPORTS_MOVEMENTS];
              const base = allMovements.find(m => m.id === bp.exerciseId) || {};
              onSelect({ ...base, name: bp.label, blueprint: bp });
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {movements.map((movement) => (
                <ExerciseCard
                  key={movement.id}
                  exercise={movement}
                  selected={selectedId === movement.id}
                  onClick={() => onSelect(movement)}
                />
              ))}
            </div>
            {/* Privacy note */}
            <p
              className="text-center text-[9px] text-white/15 mt-6 tracking-wider"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              Camera data is processed locally. Nothing is recorded or uploaded.
            </p>
          </>
        )}
      </div>
    </div>
  );
}