/**
 * MetricRail — compact sidebar showing real joint angle comparisons and coaching cues.
 */

import React from 'react';
import { COLORS, FONT, deviationColor } from '../ui/DesignTokens';

const SEVERITY_COLOR = {
  clean:   COLORS.correct,
  warning: COLORS.warning,
  fault:   COLORS.fault,
  none:    COLORS.textTertiary,
};

export default function MetricRail({ metrics, cues, profile }) {
  const hasMetrics = metrics?.some(m => m.leftAngle !== null);

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{ fontFamily: FONT.mono, background: COLORS.surface, minWidth: 0 }}
    >
      {/* Metrics header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: COLORS.border }}>
        <span className="text-[9px] tracking-[0.2em] uppercase" style={{ color: COLORS.textTertiary }}>
          Joint Analysis
        </span>
      </div>

      {/* Metrics */}
      <div className="flex-1 px-4 py-3 space-y-4">
        {!hasMetrics ? (
          <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
            Pause or seek to analyze frame
          </p>
        ) : (
          metrics.map(m => (
            <div key={m.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] tracking-[0.1em] uppercase truncate" style={{ color: COLORS.textTertiary }}>
                  {m.name}
                </span>
                <span className="text-[9px] font-bold ml-2" style={{ color: SEVERITY_COLOR[m.severity] }}>
                  {m.leftAngle !== null ? `${m.leftAngle}°` : '—'}
                </span>
              </div>

              {/* Deviation bar */}
              {m.leftAngle !== null && (
                <div className="space-y-0.5">
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (m.leftAngle / 180) * 100)}%`,
                        background: SEVERITY_COLOR[m.severity],
                      }}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[8px]" style={{ color: COLORS.textMuted }}>0°</span>
                    <span className="text-[8px]" style={{ color: COLORS.textMuted }}>
                      target: {m.target}°
                    </span>
                    <span className="text-[8px]" style={{ color: COLORS.textMuted }}>180°</span>
                  </div>
                </div>
              )}

              {/* Diff vs reference */}
              {m.diff !== null && m.rightAngle !== null && (
                <div className="flex items-center gap-1">
                  <span className="text-[8px]" style={{ color: COLORS.textMuted }}>vs ref:</span>
                  <span className="text-[9px] font-bold"
                    style={{ color: Math.abs(m.diff) > 15 ? COLORS.fault : Math.abs(m.diff) > 8 ? COLORS.warning : COLORS.correct }}>
                    {m.diff > 0 ? '+' : ''}{m.diff}°
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Cues section */}
      {cues?.length > 0 && (
        <>
          <div className="px-4 py-2 border-t" style={{ borderColor: COLORS.border }}>
            <span className="text-[9px] tracking-[0.2em] uppercase" style={{ color: COLORS.textTertiary }}>
              Coaching Cues
            </span>
          </div>
          <div className="px-4 pb-4 space-y-2">
            {cues.map((cue, i) => (
              <div key={i}
                className="px-3 py-2 rounded-lg text-[10px] leading-relaxed border-l-2"
                style={{
                  background: `${SEVERITY_COLOR[cue.severity]}12`,
                  borderColor: SEVERITY_COLOR[cue.severity],
                  color: COLORS.textSecondary,
                }}>
                {cue.text}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}