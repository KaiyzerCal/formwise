import React from "react";
import { CheckCircle2, HelpCircle } from "lucide-react";

export default function ExerciseBadge({ exercise, confidence }) {
  const isKnown = exercise && exercise !== "unknown";
  const confPct = Math.round((confidence || 0) * 100);
  const color = confPct >= 85 ? "#22C55E" : confPct >= 70 ? "#EAB308" : "#EF4444";

  const NAMES = { squat: "Squat", deadlift: "Deadlift", pushup: "Push-up" };
  const ICONS = { squat: "🏋️", deadlift: "💪", pushup: "🫸" };

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3 border"
      style={{
        background: isKnown ? `${color}10` : "rgba(255,255,255,0.03)",
        borderColor: isKnown ? `${color}40` : "rgba(255,255,255,0.08)",
      }}
    >
      <span className="text-xl">{isKnown ? (ICONS[exercise] || "🏃") : "❓"}</span>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-bold tracking-wider uppercase truncate"
          style={{ fontFamily: "'Syne', sans-serif", color: isKnown ? color : "rgba(255,255,255,0.3)" }}
        >
          {isKnown ? (NAMES[exercise] || exercise.replace(/_/g, " ")) : "Unknown Exercise"}
        </p>
        <p
          className="text-[10px] tracking-widest uppercase mt-0.5"
          style={{ fontFamily: "'DM Mono', monospace", color: isKnown ? `${color}80` : "rgba(255,255,255,0.2)" }}
        >
          {isKnown ? `${confPct}% confidence` : "Unable to detect"}
        </p>
      </div>
      {isKnown
        ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color }} />
        : <HelpCircle className="w-4 h-4 flex-shrink-0 text-white/20" />
      }
    </div>
  );
}