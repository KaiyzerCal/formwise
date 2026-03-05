import React from "react";
import { Button } from "@/components/ui/button";
import { Check, X, AlertTriangle, Trophy, CheckCircle2, XCircle, MinusCircle } from "lucide-react";

function ScoreBar({ score }) {
  const color = score >= 80 ? "#22C55E" : score >= 65 ? "#EAB308" : "#EF4444";
  const label = score >= 80 ? "GOOD" : score >= 65 ? "OK" : "NEEDS WORK";
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="h-2 flex-1 rounded-full bg-white/10 overflow-hidden mr-3">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${score}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-[10px] font-bold tracking-widest" style={{ fontFamily: "'DM Mono', monospace", color }}>
          {label}
        </span>
      </div>
    </div>
  );
}

function JointRow({ name, angle, state }) {
  const colors = { OPTIMAL: "#22C55E", ACCEPTABLE: "#EAB308", WARNING: "#F97316", DANGER: "#EF4444" };
  const icons = {
    OPTIMAL: <CheckCircle2 className="w-3.5 h-3.5" style={{ color: colors.OPTIMAL }} />,
    ACCEPTABLE: <MinusCircle className="w-3.5 h-3.5" style={{ color: colors.ACCEPTABLE }} />,
    WARNING: <AlertTriangle className="w-3.5 h-3.5" style={{ color: colors.WARNING }} />,
    DANGER: <XCircle className="w-3.5 h-3.5" style={{ color: colors.DANGER }} />,
  };
  const labels = { OPTIMAL: "Optimal", ACCEPTABLE: "OK", WARNING: "Low", DANGER: "Danger" };

  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/60" style={{ fontFamily: "'DM Mono', monospace" }}>{name}</span>
      <div className="flex items-center gap-2">
        {angle !== null && (
          <span className="text-xs font-bold text-white/40" style={{ fontFamily: "'DM Mono', monospace" }}>
            {angle}°
          </span>
        )}
        <div className="flex items-center gap-1">
          {icons[state] || <MinusCircle className="w-3.5 h-3.5 text-white/20" />}
          <span className="text-[10px] tracking-wider" style={{ fontFamily: "'DM Mono', monospace", color: colors[state] || "#ffffff30" }}>
            {labels[state] || "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

function buildCoachingText(exerciseDef, jointData) {
  if (!exerciseDef?.coaching || !jointData) return null;
  const lines = [];
  for (const [label, data] of Object.entries(jointData)) {
    // Find the joint name from label
    const joint = exerciseDef.joints?.find(j => j.label === label);
    if (!joint) continue;
    const avgAngle = data.angles?.length > 0
      ? Math.round(data.angles.reduce((a, b) => a + b, 0) / data.angles.length)
      : null;
    if (avgAngle === null) continue;
    // Determine state from last known state
    const optimalFrac = data.totalFrames > 0 ? data.optimalFrames / data.totalFrames : 0;
    const stateKey = optimalFrac < 0.3 ? "DANGER" : optimalFrac < 0.6 ? "WARNING" : null;
    if (!stateKey) continue;
    const key = `${joint.name}_${stateKey}`;
    const msg = exerciseDef.coaching[key];
    if (msg && !lines.includes(msg)) lines.push(msg);
    if (lines.length >= 2) break;
  }
  return lines.length > 0 ? lines.join(" ") : null;
}

export default function SessionSummary({ sessionData, onSave, onDiscard, saving }) {
  const score = sessionData.movement_score ?? sessionData.form_score_overall ?? 0;
  const exerciseDef = sessionData.exercise_def;
  const jointData = sessionData.joint_data;

  // Build per-joint summary from joint_data
  const jointSummary = [];
  if (exerciseDef?.joints && jointData) {
    for (const joint of exerciseDef.joints) {
      const data = jointData[joint.label];
      if (!data || data.totalFrames === 0) continue;
      const avgAngle = Math.round(data.angles.reduce((a, b) => a + b, 0) / data.angles.length);
      const optFrac = data.optimalFrames / data.totalFrames;
      const state = optFrac >= 0.7 ? "OPTIMAL" : optFrac >= 0.5 ? "ACCEPTABLE" : optFrac >= 0.3 ? "WARNING" : "DANGER";
      jointSummary.push({ name: joint.name, angle: avgAngle, state });
    }
  }

  const coachingText = buildCoachingText(exerciseDef, jointData);
  const topAlertJoints = [...new Set((sessionData.alerts || []).map((a) => a.joint))].slice(0, 3);
  const isGold = score >= 80;

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] flex items-center justify-center p-4 overflow-y-auto">
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <div className="max-w-sm w-full rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wider" style={{ fontFamily: "'Syne', sans-serif" }}>
              {exerciseDef?.name || sessionData.exercise_id?.replace(/_/g, " ").toUpperCase()}
            </h2>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
              {Math.round(sessionData.duration_seconds)}s session
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold" style={{ fontFamily: "'DM Mono', monospace", color: score >= 80 ? "#22C55E" : score >= 65 ? "#EAB308" : "#EF4444" }}>
              {score}
            </span>
            <span className="text-white/30 text-sm"> / 100</span>
          </div>
        </div>

        <ScoreBar score={score} />

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "REPS", value: sessionData.reps_detected || 0 },
            { label: "PEAK", value: `${sessionData.form_score_peak || 0}%` },
            { label: "LOW", value: `${sessionData.form_score_lowest || 0}%` },
          ].map((stat) => (
            <div key={stat.label} className="text-center rounded-xl bg-white/[0.04] py-3 border border-white/5">
              <div className="text-base font-bold text-white" style={{ fontFamily: "'DM Mono', monospace" }}>{stat.value}</div>
              <div className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Key metrics */}
        {jointSummary.length > 0 && (
          <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
              Key Metrics
            </p>
            {jointSummary.map((j) => (
              <JointRow key={j.name} name={j.name} angle={j.angle} state={j.state} />
            ))}
          </div>
        )}

        {/* Coaching */}
        {coachingText && (
          <div className="rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 p-3">
            <p className="text-[10px] text-[#C9A84C]/70 uppercase tracking-widest mb-1.5" style={{ fontFamily: "'DM Mono', monospace" }}>
              Coaching
            </p>
            <p className="text-xs text-white/60 leading-relaxed">"{coachingText}"</p>
          </div>
        )}

        {/* Fallback alerts */}
        {!coachingText && topAlertJoints.length > 0 && (
          <div className="rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
              <span className="text-xs text-[#EF4444] font-medium uppercase tracking-wider">Top Warnings</span>
            </div>
            <p className="text-xs text-white/50">{topAlertJoints.map((j) => j.replace(/_/g, " ")).join(", ")}</p>
          </div>
        )}

        {/* Gold badge */}
        {isGold && (
          <div className="flex items-center gap-2 justify-center">
            <Trophy className="w-4 h-4 text-[#C9A84C]" />
            <span className="text-xs text-[#C9A84C] font-medium">Gold Form Achieved</span>
          </div>
        )}

        {/* Actions */}
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
            <Check className="w-4 h-4 mr-1.5" /> {saving ? "Saving..." : "Save to Log"}
          </Button>
        </div>
      </div>
    </div>
  );
}