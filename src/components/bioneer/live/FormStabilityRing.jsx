/**
 * FormStabilityRing.jsx
 * SVG ring showing overall form quality score (0-100).
 */
import React from 'react';

const R = 28;
const CIRC = 2 * Math.PI * R;

function ringColor(score) {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#EAB308';
  return '#EF4444';
}

export default function FormStabilityRing({ score = 0 }) {
  const pct   = Math.min(100, Math.max(0, score));
  const color = ringColor(pct);
  const dash  = (pct / 100) * CIRC;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 72, height: 72, fontFamily: "'DM Mono', monospace" }}
    >
      <svg width={72} height={72} className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={36} cy={36} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
        <circle
          cx={36} cy={36} r={R}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${CIRC}`}
          style={{ transition: 'stroke-dasharray 0.4s ease, stroke 0.4s ease' }}
        />
      </svg>
      <div className="relative flex flex-col items-center leading-none">
        <span className="text-sm font-bold tabular-nums" style={{ color }}>
          {pct}%
        </span>
        <span className="text-[7px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
          FORM
        </span>
      </div>
    </div>
  );
}