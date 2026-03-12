/**
 * JointIntelligenceRail.jsx
 * Left-side panel showing live joint angles + color-coded state.
 */
import React from 'react';

const STATE_COLORS = {
  OPTIMAL:    '#22C55E',
  ACCEPTABLE: '#EAB308',
  WARNING:    '#F97316',
  DANGER:     '#EF4444',
};

export default function JointIntelligenceRail({ jointResults = [] }) {
  const visible = jointResults.filter(j => j.angle !== null);
  if (visible.length === 0) return null;

  return (
    <div
      className="absolute left-3 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1.5"
      style={{ fontFamily: "'DM Mono', monospace" }}
    >
      {visible.map((joint, i) => {
        const color = STATE_COLORS[joint.state] ?? 'rgba(255,255,255,0.4)';
        return (
          <div
            key={i}
            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border"
            style={{
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
              borderColor: `${color}40`,
              minWidth: 88,
            }}
          >
            <span
              className="text-[9px] tracking-widest uppercase"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              {joint.label || joint.name}
            </span>
            <span
              className="text-sm font-bold tabular-nums transition-colors duration-300"
              style={{ color }}
            >
              {joint.angle}°
            </span>
          </div>
        );
      })}
    </div>
  );
}