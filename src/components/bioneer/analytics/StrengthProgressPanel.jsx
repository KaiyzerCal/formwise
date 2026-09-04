/**
 * StrengthProgressPanel.jsx
 * Estimated-1RM trend + PR per competition lift, sourced from ExerciseTracking
 * (weight/reps/RPE logs) — distinct from PersonalRecordsPanel, which tracks
 * best *form score*, not strength.
 */
import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { COLORS, FONT } from "../ui/DesignTokens";
import { base44 } from "@/api/base44Client";
import { estimateOneRepMax } from "../strengthMath.jsx";

const LIFTS = [
  { id: "back_squat", label: "Squat" },
  { id: "bench_press", label: "Bench" },
  { id: "deadlift", label: "Deadlift" },
  { id: "sumo_deadlift", label: "Sumo Deadlift" },
];

export default function StrengthProgressPanel() {
  const [byLift, setByLift] = useState(null); // null = loading; {} = loaded, no data

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const results = {};
      for (const lift of LIFTS) {
        try {
          const rows = await base44.entities.ExerciseTracking.filter({ exercise_id: lift.id }, "-logged_date", 50);
          const history = (rows ?? [])
            .map(r => ({
              date: r.logged_date,
              e1rm: r.estimated_1rm ?? estimateOneRepMax(r.weight, r.reps, r.rpe),
            }))
            .filter(h => h.e1rm != null && h.date)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

          if (history.length) {
            results[lift.id] = {
              history: history.map((h, i) => ({ label: `#${i + 1}`, e1rm: h.e1rm })),
              pr: Math.round(Math.max(...history.map(h => h.e1rm))),
            };
          }
        } catch { /* skip this lift — e.g. not logged yet */ }
      }
      if (!cancelled) setByLift(results);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (!byLift) return null;
  const lifts = LIFTS.filter(l => byLift[l.id]);
  if (!lifts.length) return null;

  return (
    <div className="rounded-lg border p-5 space-y-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <span className="text-[9px] tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
        STRENGTH PROGRESS · ESTIMATED 1RM
      </span>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {lifts.map(l => (
          <div key={l.id} className="rounded border p-3" style={{ background: COLORS.bg, borderColor: COLORS.goldBorder }}>
            <span className="text-[8px] tracking-[0.1em] uppercase block mb-1" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
              {l.label}
            </span>
            <span className="text-lg font-bold" style={{ color: COLORS.gold, fontFamily: FONT.heading }}>
              {byLift[l.id].pr}
            </span>
          </div>
        ))}
      </div>

      {lifts.map(l => (
        <div key={l.id}>
          <span className="text-[8px] tracking-[0.1em] uppercase block mb-1" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            {l.label} trend
          </span>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={byLift[l.id].history} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={COLORS.border} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: COLORS.textTertiary, fontSize: 9, fontFamily: FONT.mono }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: COLORS.textTertiary, fontSize: 9, fontFamily: FONT.mono }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontFamily: FONT.mono, fontSize: 10 }}
                labelStyle={{ color: COLORS.textTertiary }}
                itemStyle={{ color: COLORS.gold }}
                formatter={(v) => [v, "e1RM"]}
              />
              <Line type="monotone" dataKey="e1rm" stroke={COLORS.gold} strokeWidth={1.5} dot={{ fill: COLORS.gold, r: 2 }} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}
