import React, { useState, useEffect } from 'react';
import { COLORS, FONT } from '../../ui/DesignTokens';

export default function AxisTimeline({ markers, duration, currentTime, onSeek, focusMode }) {
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    if (!tooltip) return;
    const timer = setTimeout(() => setTooltip(null), 2000);
    return () => clearTimeout(timer);
  }, [tooltip]);

  const displayMarkers = focusMode
    ? [...markers].sort((a, b) => {
        const sev = { high: 3, medium: 2, low: 1 };
        return (sev[b.severity] || 0) - (sev[a.severity] || 0);
      }).slice(0, 2)
    : markers;

  const severityColor = (s) => {
    if (s === 'high') return COLORS.fault;
    if (s === 'medium') return COLORS.warning;
    return COLORS.correct;
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', width: '100%', height: 8, borderRadius: 4, background: COLORS.border }}>
        {/* Progress indicator */}
        {duration > 0 && (
          <div style={{
            position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 4,
            width: `${(currentTime / duration) * 100}%`, background: 'rgba(201,162,39,0.2)',
          }} />
        )}
        {/* Markers */}
        {displayMarkers.map((marker, i) => {
          const pct = duration > 0 ? (marker.time / duration) * 100 : 0;
          return (
            <button
              key={i}
              onClick={() => { onSeek(marker.time); setTooltip({ idx: i, name: marker.fault || `Issue at ${Math.round(marker.time)}s` }); }}
              style={{
                position: 'absolute', left: `${pct}%`, top: '50%', transform: 'translate(-50%, -50%)',
                width: 10, height: 10, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer',
                background: severityColor(marker.severity),
              }}
            />
          );
        })}
        {/* Tooltip */}
        {tooltip && (() => {
          const marker = displayMarkers[tooltip.idx];
          if (!marker) return null;
          const pct = duration > 0 ? (marker.time / duration) * 100 : 0;
          return (
            <div style={{
              position: 'absolute', left: `${pct}%`, bottom: 16, transform: 'translateX(-50%)',
              background: COLORS.surface, border: `1px solid ${COLORS.borderLight}`, borderRadius: 6,
              padding: '4px 8px', whiteSpace: 'nowrap', fontSize: 8, color: COLORS.textSecondary,
              fontFamily: FONT.mono, pointerEvents: 'none',
            }}>
              {(tooltip.name || '').replace(/_/g, ' ')}
            </div>
          );
        })()}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 8, color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          {formatTime(currentTime)}
        </span>
        <span style={{ fontSize: 8, color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}