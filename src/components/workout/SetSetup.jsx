import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { COLORS, FONT } from "../bioneer/ui/DesignTokens";

/**
 * Weight-entry step for competition-rules lifts, shown between exercise
 * selection and the camera. The chosen weight is passed back untouched
 * (value + unit) for display in SessionSummary; callers that persist it
 * (e.g. ExerciseTracking) are responsible for normalizing units.
 */
export default function SetSetup({ exercise, onConfirm, onCancel }) {
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("lb");

  const numeric = parseFloat(value);
  const canConfirm = !Number.isNaN(numeric) && numeric > 0;

  return (
    <div className="flex flex-col h-screen" style={{ background: COLORS.bg }}>
      <div className="px-5 py-3 border-b" style={{ borderColor: COLORS.border }}>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-[10px] tracking-[0.1em] uppercase transition-colors hover:opacity-80"
          style={{ color: COLORS.gold, fontFamily: FONT.mono }}
        >
          <ArrowLeft size={14} />
          Back
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xs w-full space-y-6">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
              {exercise?.name || "Set"}
            </p>
            <h2 className="text-lg font-bold mt-1" style={{ color: COLORS.textPrimary, fontFamily: FONT.heading }}>
              What's the weight?
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
              className="flex-1 text-2xl text-center py-3 rounded-xl bg-white/[0.04] border outline-none"
              style={{ borderColor: COLORS.borderLight, color: COLORS.textPrimary, fontFamily: FONT.mono }}
            />
            <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: COLORS.borderLight }}>
              {["lb", "kg"].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className="px-3 py-3 text-xs font-bold uppercase transition-colors"
                  style={{
                    fontFamily: FONT.mono,
                    background: unit === u ? COLORS.goldDim : "transparent",
                    color: unit === u ? COLORS.gold : COLORS.textTertiary,
                  }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm({ value: numeric, unit })}
            className="w-full py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-opacity disabled:opacity-30"
            style={{ background: COLORS.gold, color: "#000", fontFamily: FONT.mono }}
          >
            Start Set
          </button>

          <button
            type="button"
            onClick={() => onConfirm(null)}
            className="w-full text-[10px] uppercase tracking-widest text-center"
            style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}
          >
            Skip — just check my form
          </button>
        </div>
      </div>
    </div>
  );
}
