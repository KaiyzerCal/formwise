import React, { useMemo } from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { ShieldAlert, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { getAllSessions } from '../data/unifiedSessionStore';

const SIGNAL_META = {
  fault:   { Icon: ShieldAlert,   color: '#EF4444' },
  warning: { Icon: AlertTriangle, color: '#EAB308' },
  ok:      { Icon: CheckCircle2,  color: '#22C55E' },
  neutral: { Icon: CheckCircle2,  color: COLORS.textTertiary },
};

// Compute risk items from last 10 sessions
function computeRiskItems(sessions) {
  const recent = sessions
    .filter(s => s.started_at)
    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
    .slice(0, 10);

  if (!recent.length) return [];

  // Count fault occurrences across recent sessions
  const faultTotals = {};
  let totalReps = 0;
  recent.forEach(s => {
    totalReps += s.reps_detected || s.rep_count || 1;
    (s.top_faults || []).forEach(f => {
      faultTotals[f] = (faultTotals[f] || 0) + 1;
    });
    // Also check alerts
    (s.alerts || []).forEach(a => {
      if (a.joint) faultTotals[a.joint] = (faultTotals[a.joint] || 0) + 1;
    });
  });

  const denom = Math.max(totalReps, recent.length);
  const items = [];

  // Check specific patterns
  const kneePct  = ((faultTotals['knee_valgus']       || 0) / denom) * 100;
  const spinePct  = ((faultTotals['spine_collapse']    || 0) / denom) * 100;
  const asymPct   = ((faultTotals['asymmetric_load']   || faultTotals['body_side_bias'] || 0) / denom) * 100;

  if (kneePct > 30) {
    items.push({ severity: 'HIGH', text: 'KNEE VALGUS PATTERN — REDUCE LOAD', type: 'fault' });
  } else if (kneePct > 15) {
    items.push({ severity: 'MODERATE', text: 'KNEE VALGUS TREND — MONITOR CAREFULLY', type: 'warning' });
  }

  if (spinePct > 20) {
    items.push({ severity: 'HIGH', text: 'SPINAL LOADING RISK — TECHNIQUE PRIORITY', type: 'fault' });
  } else if (spinePct > 10) {
    items.push({ severity: 'MODERATE', text: 'SPINAL COMPRESSION PATTERN DETECTED', type: 'warning' });
  }

  if (asymPct > 40) {
    items.push({ severity: 'HIGH', text: 'ASYMMETRIC LOADING — ASSESS MOBILITY', type: 'fault' });
  } else if (asymPct > 20) {
    items.push({ severity: 'MODERATE', text: 'MILD LOAD ASYMMETRY DETECTED', type: 'warning' });
  }

  return items;
}

const SEVERITY_STYLE = {
  HIGH:     { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', border: 'rgba(239,68,68,0.25)' },
  MODERATE: { bg: 'rgba(234,179,8,0.12)', color: '#EAB308',  border: 'rgba(234,179,8,0.25)' },
};

export default function RiskSignalPanel({ riskData }) {
  const sessions = useMemo(() => getAllSessions(), []);
  const riskItems = useMemo(() => computeRiskItems(sessions), [sessions]);

  const legacySignals = riskData?.signals || [];
  const hasRisk = riskItems.length > 0;
  const hasLegacy = legacySignals.length > 0;

  return (
    <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <h3 className="text-[9px] tracking-[0.15em] uppercase mb-3 font-bold"
        style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
        Risk Intelligence
      </h3>

      {hasRisk ? (
        <>
          <div className="space-y-3">
            {riskItems.map((item, i) => {
              const meta = SIGNAL_META[item.type] ?? SIGNAL_META.neutral;
              const Icon = meta.Icon;
              const sty = SEVERITY_STYLE[item.severity] || SEVERITY_STYLE.MODERATE;
              return (
                <div key={i}>
                  <div className="flex items-start gap-2.5 px-3 py-2.5 rounded border"
                    style={{ background: sty.bg, borderColor: sty.border }}>
                    <Icon size={13} className="mt-0.5 flex-shrink-0" style={{ color: sty.color }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[10px] font-bold leading-snug" style={{ color: sty.color, fontFamily: FONT.mono }}>
                          {item.text}
                        </p>
                        <span className="text-[7px] font-bold px-1 py-0.5 rounded flex-shrink-0"
                          style={{ background: sty.color + '22', color: sty.color, border: `1px solid ${sty.border}`, fontFamily: FONT.mono }}>
                          {item.severity}
                        </span>
                      </div>
                      {item.severity === 'HIGH' && (
                        <p className="text-[8px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                          CONSULT A PROFESSIONAL before increasing load.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[8px] mt-4 leading-relaxed" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            Movement-risk signals only — not medical diagnosis.
          </p>
        </>
      ) : hasLegacy ? (
        <>
          <div className="space-y-3">
            {legacySignals.map((s, i) => {
              const meta = SIGNAL_META[s.type] ?? SIGNAL_META.neutral;
              const Icon = meta.Icon;
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <Icon size={13} className="mt-0.5 flex-shrink-0" style={{ color: meta.color }} />
                  <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>{s.text}</p>
                </div>
              );
            })}
          </div>
          <p className="text-[8px] mt-4 leading-relaxed" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            Movement-risk signals only — not medical diagnosis.
          </p>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <ShieldCheck size={14} style={{ color: '#22C55E' }} />
          </div>
          <div className="text-center space-y-1">
            <p className="text-[10px] font-medium tracking-[0.08em]"
              style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
              No risk patterns detected
            </p>
            <p className="text-[9px]" style={{ color: COLORS.textMuted, fontFamily: FONT.mono }}>
              Requires 10+ sessions with fault data for pattern analysis
            </p>
          </div>
        </div>
      )}
    </div>
  );
}