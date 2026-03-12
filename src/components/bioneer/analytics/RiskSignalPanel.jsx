import React from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { ShieldAlert, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';

const SIGNAL_META = {
  fault:   { Icon: ShieldAlert,   color: '#EF4444' },
  warning: { Icon: AlertTriangle, color: '#EAB308' },
  ok:      { Icon: CheckCircle2,  color: '#22C55E' },
  neutral: { Icon: CheckCircle2,  color: COLORS.textTertiary },
};

export default function RiskSignalPanel({ riskData }) {
  const isEmpty   = !riskData || riskData.isEmpty;
  const hasSignals = riskData?.signals?.length > 0;

  return (
    <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <h3 className="text-[9px] tracking-[0.15em] uppercase mb-3" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
        Risk Signals
      </h3>

      {hasSignals ? (
        <>
          <div className="space-y-3">
            {riskData.signals.map((s, i) => {
              const meta = SIGNAL_META[s.type] ?? SIGNAL_META.neutral;
              const Icon = meta.Icon;
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <Icon size={13} className="mt-0.5 flex-shrink-0" style={{ color: meta.color }} />
                  <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
                    {s.text}
                  </p>
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
              {isEmpty ? 'No risks detected' : 'No risk patterns yet'}
            </p>
            <p className="text-[9px]" style={{ color: COLORS.textMuted, fontFamily: FONT.mono }}>
              {isEmpty ? 'Session data required to analyse movement risk' : 'Continue training to enable pattern detection'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}