import React from "react";
import { COLORS, FONT, scoreColor } from "./DesignTokens";
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import ScoreRing from "./ScoreRing";
import PhasePill from "./PhasePill";

export default function LiveSidebar({ movement, setMovement, movements, reps, timer, phase, currentScore, avgScore, faults }) {
  return (
    <div className="p-4 space-y-5" style={{ fontFamily: FONT.mono }}>
      {/* Movement selector */}
      <div>
        <label className="text-[9px] tracking-[0.15em] uppercase block mb-1.5" style={{ color: COLORS.textTertiary }}>MOVEMENT</label>
        <select
          value={movement}
          onChange={e => setMovement(e.target.value)}
          className="w-full rounded-md px-3 py-2 text-xs border outline-none"
          style={{ background: COLORS.bg, borderColor: COLORS.border, color: COLORS.textPrimary, fontFamily: FONT.mono }}
        >
          {movements.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Rep counter + Timer */}
      <div className="flex gap-4">
        <div className="flex-1 text-center">
          <div className="text-4xl font-bold" style={{ color: COLORS.gold, fontFamily: FONT.heading }}>{reps}</div>
          <span className="text-[9px] tracking-[0.15em] uppercase" style={{ color: COLORS.textTertiary }}>REPS</span>
        </div>
        <div className="flex-1 text-center">
          <div className="text-4xl font-bold" style={{ color: COLORS.textPrimary, fontFamily: FONT.heading }}>{timer}</div>
          <span className="text-[9px] tracking-[0.15em] uppercase" style={{ color: COLORS.textTertiary }}>TIME</span>
        </div>
      </div>

      {/* Phase indicator */}
      <div>
        <label className="text-[9px] tracking-[0.15em] uppercase block mb-2" style={{ color: COLORS.textTertiary }}>PHASE</label>
        <div className="flex flex-wrap gap-1.5">
          {['Setup', 'Descent', 'Bottom', 'Ascent', 'Lockout'].map(p => (
            <PhasePill key={p} phase={p} active={phase === p} />
          ))}
        </div>
      </div>

      {/* Rep quality score */}
      <div className="flex justify-center">
        <div className="relative">
          <ScoreRing score={currentScore || avgScore || 0} size={90} strokeWidth={4} fontSize={28} />
          <div className="text-center mt-1">
            <span className="text-[9px] tracking-[0.15em] uppercase" style={{ color: COLORS.textTertiary }}>REP QUALITY</span>
          </div>
        </div>
      </div>

      {/* Active faults */}
      <div>
        <label className="text-[9px] tracking-[0.15em] uppercase block mb-2" style={{ color: COLORS.textTertiary }}>ACTIVE FAULTS</label>
        <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
          {faults.length === 0 && (
            <p className="text-[10px]" style={{ color: COLORS.textMuted }}>No faults detected</p>
          )}
          {faults.map((f, i) => {
            const Icon = f.severity === 'error' ? AlertCircle : f.severity === 'warning' ? AlertTriangle : CheckCircle;
            const color = f.severity === 'error' ? COLORS.fault : f.severity === 'warning' ? COLORS.warning : COLORS.correct;
            return (
              <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded border" style={{ background: COLORS.bg, borderColor: COLORS.border }}>
                <Icon size={12} style={{ color, flexShrink: 0 }} />
                <span className="text-[10px] truncate" style={{ color: COLORS.textSecondary }}>{f.text.split('—')[0]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}