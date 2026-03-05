import React, { useState } from "react";
import { ArrowLeft, Shield, AlertTriangle, AlertCircle, Bookmark, CheckCircle2, Trophy } from "lucide-react";
import TimelineBar from "./TimelineBar";
import BlueprintCreator from "./BlueprintCreator";

const RISK_CONFIG = {
  SAFE: { color: "#22C55E", label: "SAFE", Icon: Shield },
  CAUTION: { color: "#EAB308", label: "CAUTION", Icon: AlertTriangle },
  DANGER: { color: "#EF4444", label: "DANGER", Icon: AlertCircle },
};

const STATE_COLORS = {
  OPTIMAL: "#22C55E",
  ACCEPTABLE: "#EAB308",
  WARNING: "#F97316",
  DANGER: "#EF4444",
};

function buildCorrections(jointScores, protocol) {
  if (!jointScores || !protocol?.coaching) return [];

  const entries = Object.entries(jointScores).sort((a, b) => {
    const order = ["DANGER", "WARNING", "ACCEPTABLE", "OPTIMAL"];
    return order.indexOf(a[1].state) - order.indexOf(b[1].state);
  });

  const corrections = [];
  for (const [label, data] of entries) {
    if (data.state === "OPTIMAL") continue;
    const stateKey = `${data.name}_${data.state}`;
    const text = protocol.coaching[stateKey];
    if (text) corrections.push({ title: data.name, tip: text, state: data.state });
    if (corrections.length >= 3) break;
  }

  // Generic fallbacks if protocol has no coaching for this joint state
  if (corrections.length === 0 && entries.length > 0) {
    const [, data] = entries[0];
    if (data.state !== "OPTIMAL") {
      corrections.push({
        title: data.name,
        tip: `Average angle: ${data.avg}°. Aim for ${protocol?.joints?.find(j => j.name === data.name)?.optimal?.join("–") ?? "target range"}°.`,
        state: data.state,
      });
    }
  }

  return corrections;
}

export default function FormReportScreen({ analysisResult, onDone, onBack }) {
  const [showBlueprint, setShowBlueprint] = useState(false);
  const { frameResults, exerciseId, protocol, overallScore, jointScores, riskFlag, duration } = analysisResult;

  const risk = RISK_CONFIG[riskFlag] || RISK_CONFIG.SAFE;
  const corrections = buildCorrections(jointScores, protocol);
  const exerciseName = protocol?.name || exerciseId?.replace(/_/g, " ").toUpperCase() || "UNKNOWN";
  const isGold = overallScore >= 80;

  if (showBlueprint) {
    return (
      <BlueprintCreator
        frameResults={frameResults}
        exerciseId={exerciseId}
        onSaved={() => { setShowBlueprint(false); onDone(); }}
        onBack={() => setShowBlueprint(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-y-auto">
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-lg border-b border-white/5 px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-bold tracking-[0.2em] text-[#C9A84C] uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>
            Form Report
          </h1>
          <p className="text-[10px] text-white/30 tracking-widest uppercase mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
            Video Analysis
          </p>
        </div>
        {isGold && <Trophy className="w-5 h-5 text-[#C9A84C]" />}
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Score card */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider" style={{ fontFamily: "'Syne', sans-serif" }}>
                {exerciseName}
              </h2>
              <p className="text-[10px] text-white/30 mt-0.5 uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
                {Math.round(duration)}s · {analysisResult.frameCount} frames
              </p>
            </div>
            <div className="text-right">
              <span
                className="text-3xl font-bold"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  color: overallScore >= 80 ? "#22C55E" : overallScore >= 60 ? "#EAB308" : "#EF4444",
                }}
              >
                {overallScore}
              </span>
              <span className="text-white/30 text-sm"> / 100</span>
            </div>
          </div>

          {/* Score bar */}
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden mb-4">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${overallScore}%`,
                backgroundColor: overallScore >= 80 ? "#22C55E" : overallScore >= 60 ? "#EAB308" : "#EF4444",
              }}
            />
          </div>

          {/* Risk flag */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
            style={{ borderColor: `${risk.color}30`, backgroundColor: `${risk.color}10` }}
          >
            <risk.Icon className="w-3 h-3" style={{ color: risk.color }} />
            <span className="text-[10px] font-bold tracking-[0.15em]" style={{ fontFamily: "'DM Mono', monospace", color: risk.color }}>
              {risk.label}
            </span>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>
            Timeline
          </p>
          <TimelineBar frameResults={frameResults} duration={duration} />
        </div>

        {/* Joint metrics */}
        {Object.keys(jointScores).length > 0 && (
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>
              Joint Analysis
            </p>
            <div className="space-y-2">
              {Object.entries(jointScores).map(([label, data]) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-xs text-white/50" style={{ fontFamily: "'DM Mono', monospace" }}>{data.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-white/30" style={{ fontFamily: "'DM Mono', monospace" }}>
                      avg {data.avg}° &nbsp; range {data.min}–{data.max}°
                    </span>
                    <span
                      className="text-[10px] font-bold tracking-wider"
                      style={{ fontFamily: "'DM Mono', monospace", color: STATE_COLORS[data.state] || "#fff" }}
                    >
                      {data.state}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top corrections */}
        {corrections.length > 0 && (
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>
              Top Corrections
            </p>
            <div className="space-y-4">
              {corrections.map((c, i) => (
                <div key={i} className="flex gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                    style={{
                      backgroundColor: `${STATE_COLORS[c.state]}15`,
                      color: STATE_COLORS[c.state],
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/80" style={{ fontFamily: "'Syne', sans-serif" }}>
                      {c.title}
                    </p>
                    <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">
                      {c.tip}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unknown movement notice */}
        {exerciseId === "unknown" && (
          <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
            <p className="text-xs text-white/30 text-center" style={{ fontFamily: "'DM Mono', monospace" }}>
              Movement not recognized. Showing general form analysis.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={() => setShowBlueprint(true)}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/5 hover:bg-[#C9A84C]/10 transition-colors text-[#C9A84C] text-sm font-bold tracking-wider uppercase"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            <Bookmark className="w-4 h-4" />
            Create Blueprint
          </button>
          <button
            onClick={onDone}
            className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors text-white/60 text-sm font-bold tracking-wider uppercase"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}