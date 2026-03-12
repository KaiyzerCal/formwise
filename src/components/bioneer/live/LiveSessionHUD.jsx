/**
 * LiveSessionHUD.jsx
 * Overlay showing pose confidence, tracking quality, joints, timer.
 */
import React from 'react';

const GOLD = '#C9A84C';

function elapsed(startMs) {
  const s = Math.floor((Date.now() - startMs) / 1000);
  return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
}

function Bar({ label, pct, color }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[9px]" style={{ fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.45)' }}>
        <span className="uppercase tracking-widest">{label}</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function LiveSessionHUD({ confidence, visibleJoints, totalJoints = 33, startMs, delegate }) {
  const confPct   = Math.round((confidence ?? 0) * 100);
  const jointsPct = Math.round(((visibleJoints ?? 0) / totalJoints) * 100);
  const confColor = confPct > 70 ? '#22C55E' : confPct > 45 ? '#EAB308' : '#EF4444';
  const jtColor   = jointsPct > 70 ? '#22C55E' : jointsPct > 45 ? '#EAB308' : '#EF4444';

  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute bottom-24 left-4 z-50 w-44 space-y-2.5 rounded-xl border p-3"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.08)' }}>
      {/* Timer */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.4)' }}>
          Session
        </span>
        <span className="text-sm font-bold tabular-nums" style={{ fontFamily: "'DM Mono', monospace", color: GOLD }}>
          {elapsed(startMs)}
        </span>
      </div>

      <Bar label="Confidence" pct={confPct}   color={confColor} />
      <Bar label="Joints"     pct={jointsPct} color={jtColor} />

      {/* Delegate badge */}
      {delegate && (
        <div className="text-[8px] text-right tracking-widest uppercase"
          style={{ fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.2)' }}>
          {delegate}
        </div>
      )}
    </div>
  );
}