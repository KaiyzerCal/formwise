import React from "react";
import { Button } from "@/components/ui/button";
import { Check, X, AlertTriangle, Trophy } from "lucide-react";

function ScoreDonut({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? "#22C55E" : score >= 65 ? "#EAB308" : "#EF4444";

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60" cy="60" r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"
        />
        <circle
          cx="60" cy="60" r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
          {score}
        </span>
        <span className="text-[10px] text-white/40 uppercase tracking-widest">SCORE</span>
      </div>
    </div>
  );
}

export default function SessionSummary({ sessionData, onSave, onDiscard, saving }) {
  const topAlertJoints = [...new Set((sessionData.alerts || []).map((a) => a.joint))].slice(0, 3);
  const score = sessionData.form_score_overall || 0;

  const recommendation =
    score >= 85
      ? "Excellent form! Keep this intensity."
      : score >= 70
      ? "Good session. Focus on maintaining joint alignment."
      : "Form needs attention. Consider reducing weight or getting coaching.";

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-sm w-full rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 space-y-6">
        <div className="text-center">
          <h2
            className="text-lg font-bold text-white tracking-wider mb-1"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            SESSION COMPLETE
          </h2>
          <p className="text-white/30 text-xs uppercase tracking-widest"
             style={{ fontFamily: "'DM Mono', monospace" }}>
            {sessionData.exercise_id} — {Math.round(sessionData.duration_seconds)}s
          </p>
        </div>

        <ScoreDonut score={score} />

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "REPS", value: sessionData.reps_detected || 0 },
            { label: "PEAK", value: `${sessionData.form_score_peak || 0}%` },
            { label: "LOW", value: `${sessionData.form_score_lowest || 0}%` },
          ].map((stat) => (
            <div key={stat.label} className="text-center rounded-xl bg-white/[0.04] py-3 border border-white/5">
              <div className="text-lg font-bold text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
                {stat.value}
              </div>
              <div className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {topAlertJoints.length > 0 && (
          <div className="rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
              <span className="text-xs text-[#EF4444] font-medium uppercase tracking-wider">Top Warnings</span>
            </div>
            <p className="text-xs text-white/50">
              {topAlertJoints.map((j) => j.replace(/_/g, " ")).join(", ")}
            </p>
          </div>
        )}

        {score >= 80 && (
          <div className="flex items-center gap-2 justify-center">
            <Trophy className="w-4 h-4 text-[#C9A84C]" />
            <span className="text-xs text-[#C9A84C] font-medium">Gold Form Achieved</span>
          </div>
        )}

        <p className="text-xs text-white/40 text-center leading-relaxed">{recommendation}</p>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onDiscard}
            className="flex-1 border-white/10 text-white/60 hover:bg-white/5 bg-transparent"
          >
            <X className="w-4 h-4 mr-1.5" /> Discard
          </Button>
          <Button
            onClick={onSave}
            disabled={saving}
            className="flex-1 bg-[#C9A84C] hover:bg-[#b8943f] text-black font-bold"
          >
            <Check className="w-4 h-4 mr-1.5" /> {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}