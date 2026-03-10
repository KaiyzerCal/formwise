import React from "react";
import { COLORS, FONT } from "./DesignTokens";
import { X, AlertTriangle, AlertCircle } from "lucide-react";
import PhasePill from "./PhasePill";

export default function MovementDetailModal({ movement, onClose }) {
  const m = movement;
  const phases = m.phaseTemplate || [];
  const faultRules = m.faultRules || [];
  const cueMap = m.cueMap || {};
  const thresholds = m.thresholds || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-lg border" style={{ background: COLORS.surface, borderColor: COLORS.border }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: COLORS.border }}>
          <h2 className="text-sm font-bold" style={{ color: COLORS.textPrimary, fontFamily: FONT.heading }}>{m.displayName}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5"><X size={16} style={{ color: COLORS.textTertiary }} /></button>
        </div>

        <div className="p-5 space-y-5" style={{ fontFamily: FONT.mono }}>
          {/* Phases */}
          <div>
            <span className="text-[9px] tracking-[0.15em] uppercase block mb-2" style={{ color: COLORS.textTertiary }}>PHASES</span>
            <div className="flex flex-wrap gap-1.5">
              {phases.map((p, i) => <PhasePill key={p} phase={p.replace(/_/g, ' ')} active={i === 0} />)}
            </div>
          </div>

          {/* ROM Targets */}
          <div>
            <span className="text-[9px] tracking-[0.15em] uppercase block mb-2" style={{ color: COLORS.textTertiary }}>ROM TARGETS</span>
            <div className="rounded border overflow-hidden" style={{ borderColor: COLORS.border }}>
              <div className="grid grid-cols-3 text-[9px] tracking-[0.1em] uppercase p-2" style={{ background: COLORS.bg, color: COLORS.textTertiary }}>
                <span>Joint</span><span>Min</span><span>Ideal</span>
              </div>
              <div className="grid grid-cols-3 text-[10px] p-2 border-t" style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}>
                <span>{m.primaryAngleKey}</span>
                <span>{thresholds.bottomAngle || '—'}°</span>
                <span>{thresholds.lockoutAngle || '—'}°</span>
              </div>
              {m.secondaryAngleKey && (
                <div className="grid grid-cols-3 text-[10px] p-2 border-t" style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}>
                  <span>{m.secondaryAngleKey}</span>
                  <span>—</span>
                  <span>—</span>
                </div>
              )}
            </div>
          </div>

          {/* Fault Rules */}
          <div>
            <span className="text-[9px] tracking-[0.15em] uppercase block mb-2" style={{ color: COLORS.textTertiary }}>FAULT RULES</span>
            <div className="space-y-2">
              {faultRules.map((rule, i) => {
                // rule is a function reference from FaultRuleLibrary; its .name is the function name
                const ruleId = typeof rule === 'function' ? rule.name : (typeof rule === 'string' ? rule : `rule_${i}`);
                const displayName = ruleId.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
                const cue = cueMap[ruleId] || '';
                return (
                  <div key={i} className="flex items-start gap-2 px-3 py-2 rounded border" style={{ background: COLORS.bg, borderColor: COLORS.border }}>
                    <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" style={{ color: COLORS.warning }} />
                    <div>
                      <span className="text-[10px] block capitalize" style={{ color: COLORS.textPrimary }}>{displayName}</span>
                      {cue && <span className="text-[9px] block mt-0.5" style={{ color: COLORS.textTertiary }}>{cue}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rep Detection */}
          <div>
            <span className="text-[9px] tracking-[0.15em] uppercase block mb-2" style={{ color: COLORS.textTertiary }}>REP DETECTION</span>
            <div className="flex gap-4 text-[10px]" style={{ color: COLORS.textSecondary }}>
              <div><span style={{ color: COLORS.textTertiary }}>Joint: </span>{m.primaryAngleKey}</div>
              <div><span style={{ color: COLORS.textTertiary }}>Mode: </span>{m.repValidationMode?.replace(/_/g, ' ')}</div>
              <div><span style={{ color: COLORS.textTertiary }}>Min ROM: </span>{thresholds.bottomAngle}°</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}