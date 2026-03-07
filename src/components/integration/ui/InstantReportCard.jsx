import React, { useState, useEffect } from "react";
import { getInstantReport } from "../InstantReportService";
import { moduleEnabled } from "../moduleRegistry";
import { Zap, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Dumbbell } from "lucide-react";

const SCORE_COLORS = {
  "ELITE":       "text-emerald-400 border-emerald-400/30 bg-emerald-400/5",
  "STRONG":      "text-green-400 border-green-400/30 bg-green-400/5",
  "GOOD":        "text-[#C9A84C] border-[#C9A84C]/30 bg-[#C9A84C]/5",
  "NEEDS WORK":  "text-orange-400 border-orange-400/30 bg-orange-400/5",
  "MAJOR ISSUE": "text-red-400 border-red-400/30 bg-red-400/5",
};

export default function InstantReportCard({ sessionId }) {
  if (!moduleEnabled("instantReport")) return null;

  const [report, setReport]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    getInstantReport(sessionId).then(r => { setReport(r); setLoading(false); });
  }, [sessionId]);

  if (loading) return (
    <div className="mt-6 border border-white/10 rounded-xl bg-[#0F0F0F] p-4 flex items-center gap-3">
      <Zap className="w-4 h-4 text-[#C9A84C] animate-pulse" />
      <span className="text-sm text-gray-500">Generating instant report…</span>
    </div>
  );

  if (!report) return null;

  const colorClass = SCORE_COLORS[report.score_label] ?? SCORE_COLORS["GOOD"];

  return (
    <div className="mt-6 border border-white/10 rounded-xl bg-[#0F0F0F] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#C9A84C]" />
          <span className="text-sm font-semibold text-[#C9A84C] tracking-wider">INSTANT REPORT</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold tracking-widest px-2 py-1 rounded border ${colorClass}`}>
            {report.score_label}
          </span>
          {collapsed ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronUp className="w-4 h-4 text-gray-500" />}
        </div>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-4">
          {/* Headline */}
          <p className="text-gray-300 text-sm leading-relaxed border-l-2 border-[#C9A84C]/40 pl-3">
            {report.headline}
          </p>

          {/* Score */}
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-black tabular-nums ${colorClass.split(" ")[0]}`}>
              {Math.round(report.overall_score)}
            </div>
            <div className="text-xs text-gray-500 leading-tight">OVERALL<br/>FORM SCORE</div>
          </div>

          {/* Primary Fault */}
          {report.primary_fault && (
            <div className="flex gap-2 bg-red-900/10 border border-red-500/20 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-400 tracking-wider">{report.primary_fault.label}</p>
                <p className="text-xs text-gray-400 mt-1">{report.primary_fault.correction}</p>
              </div>
            </div>
          )}

          {/* Top Findings */}
          {(report.top_findings ?? []).length > 0 && (
            <div>
              <p className="text-xs text-gray-500 tracking-widest mb-2">TOP FINDINGS</p>
              <div className="space-y-1.5">
                {report.top_findings.map((f, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <CheckCircle className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-300"><span className="text-gray-100 font-medium">{f.label}</span> — {f.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phase Breakdown */}
          {(report.phase_breakdown ?? []).length > 0 && (
            <div>
              <p className="text-xs text-gray-500 tracking-widest mb-2">PHASE BREAKDOWN</p>
              <div className="space-y-1.5">
                {report.phase_breakdown.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-24 font-mono">{p.phase_label}</span>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#C9A84C] rounded-full transition-all"
                        style={{ width: `${Math.round(p.score)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 font-mono w-8 text-right">{Math.round(p.score)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Drill */}
          {report.recommended_drill && (
            <div className="flex gap-2 bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-lg p-3">
              <Dumbbell className="w-4 h-4 text-[#C9A84C] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[#C9A84C] tracking-wider">{report.recommended_drill.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{report.recommended_drill.sets}×{report.recommended_drill.reps} — {report.recommended_drill.cue}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}