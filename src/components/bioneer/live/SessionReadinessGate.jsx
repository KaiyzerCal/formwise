/**
 * SessionReadinessGate.jsx
 * Shows readiness checklist overlay. Hidden once all checks pass.
 */
import React from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

const GOLD = '#C9A84C';
const RED  = '#EF4444';
const GRN  = '#22C55E';

function Check({ label, ok, warn }) {
  const Icon  = ok ? CheckCircle2 : warn ? AlertCircle : Circle;
  const color = ok ? GRN : warn ? '#EAB308' : 'rgba(255,255,255,0.3)';
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} style={{ color, flexShrink: 0 }} />
      <span className="text-sm" style={{ color: ok ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
        fontFamily: "'DM Mono', monospace" }}>
        {label}
      </span>
    </div>
  );
}

export default function SessionReadinessGate({ checks, guidance }) {
  const allGood = checks.every(c => c.ok);
  if (allGood) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="w-72 rounded-2xl border p-6 space-y-4"
        style={{ background: 'rgba(0,0,0,0.85)', borderColor: `${GOLD}40` }}>

        <p className="text-xs tracking-[0.2em] uppercase text-center"
          style={{ color: GOLD, fontFamily: "'DM Mono', monospace" }}>
          Getting Ready
        </p>

        <div className="space-y-3">
          {checks.map((c, i) => <Check key={i} {...c} />)}
        </div>

        {guidance && (
          <div className="mt-2 pt-3 border-t border-white/10 text-center">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Mono', monospace" }}>
              {guidance}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}