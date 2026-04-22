import React, { useState, useRef, useCallback } from "react";
import { EXERCISES, FREESTYLE_MODE } from "./exerciseLibrary";
import { SPORTS_MOVEMENTS } from "./sportsLibrary";
import ExerciseCard from "./ExerciseCard";
import { ArrowLeft, Scan } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function MovementLibrary({ onSelect, selectedId }) {
  const [activeTab, setActiveTab] = useState("strength");
  const [focusedIdx, setFocusedIdx] = useState(0);
  const cardRefs = useRef([]);
  const t = useT();

  const baseMovements = activeTab === "strength"
    ? EXERCISES
    : SPORTS_MOVEMENTS.filter(m => m.category === "sports" || m.category === "athletic" || !m.category);

  // Add Freestyle mode at the top of the list
  const movements = activeTab === "strength"
    ? [FREESTYLE_MODE, ...baseMovements]
    : baseMovements;

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
            aria-label="Go back"
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" aria-hidden="true" />
          </button>
          <div className="flex-1">
            <h1
              className="text-sm font-bold tracking-[0.2em] text-[#C9A84C] uppercase"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {t('Movement Library')}
            </h1>
            <p
              className="text-[10px] text-white/30 tracking-widest uppercase mt-0.5"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {t('Select movement to analyze')}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#C9A84C]/10 flex items-center justify-center">
            <Scan className="w-4 h-4 text-[#C9A84C]" />
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-lg mx-auto px-4 pb-0 flex gap-0">
          {["strength", "sports"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-3 relative text-xs font-bold tracking-[0.15em] uppercase transition-colors"
              style={{
                fontFamily: "'DM Mono', monospace",
                color: activeTab === tab ? "#C9A84C" : "rgba(255,255,255,0.3)",
              }}
            >
              {tab === "strength" ? t('Strength Training') : t('Sports Performance')}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A84C]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Movement Grid */}
      <div className="max-w-lg mx-auto px-4 py-6">
      <div
        className="grid grid-cols-2 gap-3"
        role="list"
        aria-label="Available exercises"
        onKeyDown={(e) => {
          const cols = 2;
          const len = movements.length;
          let next = focusedIdx;
          if (e.key === 'ArrowRight') next = Math.min(focusedIdx + 1, len - 1);
          else if (e.key === 'ArrowLeft') next = Math.max(focusedIdx - 1, 0);
          else if (e.key === 'ArrowDown') next = Math.min(focusedIdx + cols, len - 1);
          else if (e.key === 'ArrowUp') next = Math.max(focusedIdx - cols, 0);
          else return;
          e.preventDefault();
          setFocusedIdx(next);
          cardRefs.current[next]?.focus();
        }}
      >
        {movements.map((movement, idx) => (
          <div
            key={movement.id}
            role="listitem"
            ref={el => cardRefs.current[idx] = el}
            tabIndex={focusedIdx === idx ? 0 : -1}
            aria-label={`${movement.name || movement.id} — press Enter to select`}
            aria-selected={selectedId === movement.id}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !movement.comingSoon) {
                e.preventDefault();
                onSelect(movement);
              }
            }}
            onFocus={() => setFocusedIdx(idx)}
            style={{ outline: 'none' }}
          >
          <ExerciseCard
            exercise={movement}
            selected={selectedId === movement.id}
            onClick={() => onSelect(movement)}
          />
          </div>
        ))}
        </div>

        {/* Privacy note */}
        <p
          className="text-center text-[9px] text-white/15 mt-6 tracking-wider"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          Camera data is processed locally. Nothing is recorded or uploaded.
        </p>
      </div>
    </div>
  );
}