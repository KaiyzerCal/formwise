import React from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import InsufficientDataCard from './InsufficientDataCard';

const SIGNAL_META = {
  fault:   { Icon: ShieldAlert,   color: '#EF4444' },
  warning: { Icon: AlertTriangle, color: '#EAB308' },
  ok:      { Icon: CheckCircle2,  color: '#22C55E' },
  neutral: { Icon: CheckCircle2,  color: COLORS.textTertiary },
};

export default function RiskSignalPanel({ riskData }) {
  if (!riskData || riskData.insufficient) {
    return (
      <InsufficientDataCard
        title="Risk Signals"
        message="Complete at least 2 sessions to detect movement risk patterns."
      />
    );
  }

  const { signals } = riskData;

  return (
    <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      <h3 className="text-[9px] tracking-[0.15em] uppercase mb-3" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
        Risk Signals
      </h3>
      <div className="space-y-3">
        {signals.map((s, i) => {
          const meta = SIGNAL_META[s.type] ?? SIGNAL_META.neutral;
          const { Icon } = meta;
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
    </div>
  );
}