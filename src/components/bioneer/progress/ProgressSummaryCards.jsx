import React from "react";
import { Zap, Trophy, TrendingUp } from "lucide-react";
import { COLORS, FONT } from "../ui/DesignTokens";

export default function ProgressSummaryCards({ sessions }) {
  // Total volume (sum of all reps)
  const totalVolume = sessions.reduce((sum, s) => sum + (s.reps_detected || 0), 0);

  // Personal records (best form score per exercise)
  const prsByExercise = {};
  sessions.forEach((s) => {
    const exercise = s.exercise_id || "unknown";
    const score = Math.round(s.movement_score ?? s.form_score_overall ?? 0);
    if (!prsByExercise[exercise] || score > prsByExercise[exercise]) {
      prsByExercise[exercise] = score;
    }
  });
  const personalRecords = Object.keys(prsByExercise).length;

  // Improvement percentage (first vs last form score)
  let improvementPct = 0;
  if (sessions.length >= 2) {
    const firstScore = Math.round(sessions[0].movement_score ?? sessions[0].form_score_overall ?? 0);
    const lastScore = Math.round(sessions[sessions.length - 1].movement_score ?? sessions[sessions.length - 1].form_score_overall ?? 0);
    if (firstScore > 0) {
      improvementPct = Math.round(((lastScore - firstScore) / firstScore) * 100);
    }
  }

  const cards = [
    {
      icon: Zap,
      label: "Total Volume",
      value: totalVolume,
      unit: "reps",
      color: COLORS.correct,
    },
    {
      icon: Trophy,
      label: "Personal Records",
      value: personalRecords,
      unit: "exercises",
      color: COLORS.gold,
    },
    {
      icon: TrendingUp,
      label: "Overall Improvement",
      value: improvementPct,
      unit: "%",
      color: improvementPct >= 0 ? COLORS.correct : COLORS.fault,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="rounded-xl border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-[0.1em] mb-1" style={{ fontFamily: FONT.mono }}>
                  {card.label}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold" style={{ color: card.color, fontFamily: FONT.mono }}>
                    {card.value}
                  </span>
                  <span className="text-[10px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                    {card.unit}
                  </span>
                </div>
              </div>
              <Icon size={20} style={{ color: card.color, opacity: 0.7 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}