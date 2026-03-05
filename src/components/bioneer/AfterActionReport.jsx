import React from "react";
import { Button } from "@/components/ui/button";
import { Check, Play, AlertTriangle, Shield, ShieldCheck, ShieldX } from "lucide-react";

const STATE_COLORS = {
  OPTIMAL: "#22C55E",
  ACCEPTABLE: "#EAB308",
  WARNING: "#F97316",
  DANGER: "#EF4444",
};

function PhaseTimeline({ comparisonResults }) {
  const valid = comparisonResults.filter(f => f.phase !== "unknown");
  if (valid.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-white/30 uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
        Phase Timeline
      </p>
      <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
        {valid.map((f, i) => {
          const states = Object.values(f.jointStates).filter(Boolean);
          const order  = ["DANGER", "WARNING", "ACCEPTABLE", "OPTIMAL"];
          const worst  = order.find(s => states.includes(s)) || "OPTIMAL";
          return (
            <div key={i} className="flex-1" style={{ backgroundColor: STATE_COLORS[worst] }} />
          );
        })}
      </div>
      <div className="flex gap-3 flex-wrap">
        {Object.entries(STATE_COLORS).map(([s, c]) => (
          <div key={s} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
            <span className="text-[9px] text-white/30 uppercase tracking-wider" style={{ fontFamily: "'DM Mono', monospace" }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreDonut({ score }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const color = score >= 80 ? "#22C55E" : score >= 65 ? "#EAB308" : "#EF4444";
  const dash  = circ * (score / 100);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        <circle
          cx="48" cy="48" r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - dash}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold" style={{ fontFamily: "'DM Mono', monospace", color }}>{score}</span>
        <span className="text-[9px] text-white/30" style={{ fontFamily: "'DM Mono', monospace" }}>/100</span>
      </div>
    </div>
  );
}

export default function AfterActionReport({ report, session, onSave, onReplay, saving }) {
  const { movementScore, riskLevel, topFixes } = report;
  const RISK_CONFIG = {
    LOW:      { color: "#22C55E", Icon: ShieldCheck, label: "LOW RISK" },
    MODERATE: { color: "#EAB308", Icon: Shield,      label: "MODERATE RISK" },
    HIGH:     { color: "#EF4444", Icon: ShieldX,     label: "HIGH RISK" },
  };
  const risk = RISK_CONFIG[riskLevel] || RISK_CONFIG.MODERATE;
  const RiskIcon = risk.Icon;

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] overflow-y-auto">
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <div className="max-w-sm mx-auto px-4 py-8 space-y-5">

        {/* Header */}
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.25em] mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
            After Action Report
          </p>
          <h2 className="text-lg font-bold text-white tracking-wide" style={{ fontFamily: "'Syne', sans-serif" }}>
            {session.exerciseName || "Movement"} Analysis
          </h2>
        </div>

        {/* Score + Risk row */}
        <div className="flex items-center gap-5">
          <ScoreDonut score={movementScore} />
          <div className="space-y-2">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border"
              style={{ background: `${risk.color}10`, borderColor: `${risk.color}30` }}
            >
              <RiskIcon className="w-4 h-4" style={{ color: risk.color }} />
              <span className="text-xs font-bold tracking-widest" style={{ fontFamily: "'DM Mono', monospace", color: risk.color }}>
                {risk.label}
              </span>
            </div>
            <p className="text-[10px] text-white/30 leading-relaxed" style={{ fontFamily: "'DM Mono', monospace" }}>
              {movementScore >= 80
                ? "Excellent form quality detected."
                : movementScore >= 60
                ? "Good effort — minor corrections needed."
                : "Several form issues detected — review below."}
            </p>
          </div>
        </div>

        {/* Phase timeline */}
        <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
          <PhaseTimeline comparisonResults={session.comparisonResults} />
        </div>

        {/* Top corrections */}
        {topFixes.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] text-white/30 uppercase tracking-[0.25em]" style={{ fontFamily: "'DM Mono', monospace" }}>
              Top Corrections
            </p>
            {topFixes.map((fix, i) => {
              const numeral = ["①", "②", "③"][i] || `${i + 1}.`;
              const stateColor = STATE_COLORS[fix.state] || "#EAB308";
              return (
                <div
                  key={fix.jointId}
                  className="rounded-xl p-3.5 border"
                  style={{ background: `${stateColor}08`, borderColor: `${stateColor}25` }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm" style={{ color: stateColor }}>{numeral}</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                      {fix.jointLabel}
                    </span>
                    <div
                      className="ml-auto text-[9px] px-2 py-0.5 rounded-full font-bold tracking-wider"
                      style={{ background: `${stateColor}20`, color: stateColor, border: `1px solid ${stateColor}40`, fontFamily: "'DM Mono', monospace" }}
                    >
                      {fix.state}
                    </div>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">{fix.suggestion}</p>
                </div>
              );
            })}
          </div>
        )}

        {topFixes.length === 0 && (
          <div className="rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 p-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-[#22C55E]" />
            <p className="text-sm text-white/70">No major corrections detected — solid form!</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          <Button
            onClick={onSave}
            disabled={saving}
            className="w-full bg-[#C9A84C] hover:bg-[#b8943f] text-black font-bold tracking-wider py-5 text-sm"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            <Check className="w-4 h-4 mr-2" />
            {saving ? "SAVING..." : "SAVE TO LOG"}
          </Button>
          <Button
            variant="outline"
            onClick={onReplay}
            className="w-full border-white/10 bg-transparent text-white/60 hover:bg-white/5 hover:text-white tracking-wider py-5 text-sm"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            <Play className="w-4 h-4 mr-2" />
            REPLAY ANALYSIS
          </Button>
        </div>

        <p className="text-center text-[9px] text-white/15 tracking-widest pb-4" style={{ fontFamily: "'DM Mono', monospace" }}>
          All processing is local · no video data is stored
        </p>
      </div>
    </div>
  );
}