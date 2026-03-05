import React, { useState, useEffect } from "react";
import { ArrowLeft, Play, Trash2, ChevronRight, Activity, Target, Layers } from "lucide-react";
import { getBlueprints, deleteBlueprint } from "./blueprintStore";
import { EXERCISES } from "./exerciseLibrary";
import { SPORTS_MOVEMENTS } from "./sportsLibrary";

function ScoreRing({ value, size = 72 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const filled = circ * (value / 100);
  const color = value >= 80 ? "#22C55E" : value >= 60 ? "#EAB308" : "#EF4444";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BlueprintDetailScreen({ blueprintId, onBack, onTrain }) {
  const [blueprint, setBlueprint] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("BLUEPRINT_DETAIL_MOUNT blueprintId=", blueprintId);
    if (!blueprintId) { setError("no_id"); return; }
    const all = getBlueprints();
    const found = all.find((b) => b.id === blueprintId);
    if (!found) { setError("not_found"); return; }
    setBlueprint(found);
  }, [blueprintId]);

  const handleDelete = () => {
    deleteBlueprint(blueprintId);
    onBack();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-white/40 text-sm" style={{ fontFamily: "'DM Mono', monospace" }}>
          {error === "no_id" ? "No blueprint ID provided." : "Blueprint not found."}
        </p>
        <button onClick={onBack} className="text-[#C9A84C] text-xs uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
          ← Back
        </button>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allMovements = [...EXERCISES, ...SPORTS_MOVEMENTS];
  const baseMovement = allMovements.find((m) => m.id === blueprint.exerciseId);
  const jointCount = Object.keys(blueprint.jointAngleRanges || {}).length;
  const phaseCount = Object.keys(blueprint.phases || {}).length;
  const createdDate = blueprint.createdAt ? new Date(blueprint.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Unknown";

  // Compute a simple quality score from frame count (more frames = better capture)
  const qualityScore = Math.min(100, Math.round((blueprint.frameCount / 300) * 100));

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold tracking-[0.15em] text-[#C9A84C] uppercase truncate" style={{ fontFamily: "'Syne', sans-serif" }}>
              {blueprint.label}
            </h1>
            <p className="text-[10px] text-white/30 tracking-widest uppercase mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
              Blueprint · {createdDate}
            </p>
          </div>
          <button onClick={handleDelete} className="p-2 rounded-full hover:bg-[#EF4444]/10 transition-colors">
            <Trash2 className="w-4 h-4 text-white/25 hover:text-[#EF4444]" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Hero card */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <ScoreRing value={qualityScore} size={80} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-white" style={{ fontFamily: "'DM Mono', monospace" }}>{qualityScore}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>Capture Quality</p>
            <p className="text-xs text-white/70" style={{ fontFamily: "'DM Mono', monospace" }}>
              {blueprint.frameCount} frames captured
            </p>
            {baseMovement && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20">
                <span className="text-sm">{baseMovement.icon}</span>
                <span className="text-[10px] text-[#C9A84C] uppercase tracking-wider" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {baseMovement.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Activity, label: "Joints", value: jointCount },
            { icon: Layers, label: "Phases", value: phaseCount || "—" },
            { icon: Target, label: "Frames", value: blueprint.frameCount },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl bg-white/[0.03] border border-white/5 p-3 text-center">
              <Icon className="w-3.5 h-3.5 text-[#C9A84C] mx-auto mb-1.5" />
              <p className="text-base font-bold text-white" style={{ fontFamily: "'DM Mono', monospace" }}>{value}</p>
              <p className="text-[9px] text-white/25 uppercase tracking-widest mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Joint angle ranges */}
        {jointCount > 0 && (
          <div className="rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
                Captured Joint Ranges
              </p>
            </div>
            <div className="divide-y divide-white/5">
              {Object.entries(blueprint.jointAngleRanges).map(([label, range]) => {
                const span = range.max - range.min;
                return (
                  <div key={label} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-wider w-16 flex-shrink-0" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {label}
                    </span>
                    <div className="flex-1">
                      <div className="h-1 rounded-full bg-white/5 relative overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-[#C9A84C]/60"
                          style={{ width: `${Math.min(100, (span / 90) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-white/40 tabular-nums w-20 text-right flex-shrink-0" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {Math.round(range.min)}°–{Math.round(range.max)}°
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Phases */}
        {phaseCount > 0 && (
          <div className="rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
                Movement Phases
              </p>
            </div>
            <div className="divide-y divide-white/5">
              {Object.entries(blueprint.phases).map(([phase, timing]) => (
                <div key={phase} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-white/60 capitalize" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {phase.replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] text-white/25 tabular-nums" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {((timing.end - timing.start) / 1000).toFixed(1)}s
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No video note */}
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-4 py-3">
          <p className="text-[10px] text-white/20 text-center" style={{ fontFamily: "'DM Mono', monospace" }}>
            Blueprint stores movement data only · no video attached
          </p>
        </div>

        {/* Train button */}
        <button
          onClick={() => {
            console.log("TRAIN_BUTTON_PRESSED blueprintId=", blueprint?.id);
            if (!blueprint) { console.error("TRAIN_ERROR: blueprint not loaded"); return; }
            onTrain(blueprint);
          }}
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            padding: "1rem",
            borderRadius: "1rem",
            fontWeight: "bold",
            fontSize: "0.875rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            cursor: "pointer",
            pointerEvents: "auto",
            background: "linear-gradient(135deg, #C9A84C 0%, #b8943f 100%)",
            color: "#000",
            fontFamily: "'Syne', sans-serif",
            border: "none",
          }}
        >
          <Play className="w-4 h-4" />
          Train Against This Blueprint
        </button>

        <div className="h-8" />
      </div>
    </div>
  );
}