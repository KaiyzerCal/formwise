import React from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';

const STATUS_CONFIG = {
  locked:  { label: 'Pose Locked',    color: COLORS.correct },
  weak:    { label: 'Tracking Weak',  color: COLORS.warning },
  lost:    { label: 'Pose Lost',      color: COLORS.fault   },
  idle:    { label: 'Waiting',        color: COLORS.textTertiary },
  loading: { label: 'Loading AI…',    color: COLORS.textSecondary },
  ready:   { label: 'Ready',          color: COLORS.textTertiary },
  error:   { label: 'Unavailable',    color: COLORS.fault   },
};

function AngleRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b"
      style={{ borderColor: COLORS.border }}>
      <span className="text-[9px] tracking-[0.1em]" style={{ color: COLORS.textTertiary }}>
        {label}
      </span>
      <span className="text-[10px] font-bold tabular-nums"
        style={{ color: value !== null ? COLORS.textPrimary : COLORS.textMuted }}>
        {value !== null && value !== undefined ? `${value}°` : '—'}
      </span>
    </div>
  );
}

function ConfBar({ value }) {
  const color = value > 70 ? COLORS.correct : value > 45 ? COLORS.warning : COLORS.fault;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[9px] tracking-[0.1em]" style={{ color: COLORS.textTertiary }}>Confidence</span>
        <span className="text-[10px] font-bold tabular-nums" style={{ color }}>{value}%</span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export default function MetricRail({ poseState, metrics, isPlaying }) {
  const statusKey = metrics?.status ?? poseState;
  const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.idle;

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ fontFamily: FONT.mono, background: COLORS.surface }}>

      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: COLORS.border }}>
        <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: COLORS.textTertiary }}>
          Your Analysis
        </p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-5">

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
          <span className="text-[10px] font-bold tracking-[0.1em]" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </div>

        {/* Loading / not-playing state */}
        {!isPlaying && poseState === 'ready' && (
          <p className="text-[9px] leading-relaxed" style={{ color: COLORS.textMuted }}>
            Play your video to begin pose analysis.
          </p>
        )}

        {poseState === 'loading' && (
          <p className="text-[9px] leading-relaxed" style={{ color: COLORS.textMuted }}>
            Loading pose model…<br />This may take a moment.
          </p>
        )}

        {poseState === 'error' && (
          <p className="text-[9px] leading-relaxed" style={{ color: COLORS.textMuted }}>
            Pose analysis unavailable.<br />Video playback still works normally.
          </p>
        )}

        {/* Live metrics */}
        {metrics && (
          <>
            <ConfBar value={metrics.confidence} />

            <div className="text-[9px] flex items-center gap-1" style={{ color: COLORS.textTertiary }}>
              <span>Visible joints:</span>
              <span className="font-bold" style={{ color: COLORS.textSecondary }}>{metrics.visibleJoints} / 33</span>
            </div>

            <div className="space-y-0">
              <p className="text-[8px] tracking-[0.15em] uppercase pb-1" style={{ color: COLORS.textMuted }}>
                Joint Angles
              </p>
              <AngleRow label="Left Knee"  value={metrics.leftKnee} />
              <AngleRow label="Right Knee" value={metrics.rightKnee} />
              <AngleRow label="Left Hip"   value={metrics.leftHip} />
              <AngleRow label="Right Hip"  value={metrics.rightHip} />
              <AngleRow label="Torso Lean" value={metrics.torsoLean} />
            </div>

            {/* Coaching status */}
            <div className="pt-1 space-y-1.5">
              <p className="text-[8px] tracking-[0.15em] uppercase" style={{ color: COLORS.textMuted }}>
                Status
              </p>
              {metrics.status === 'locked' && (
                <CoachNote color={COLORS.correct} text="Pose detected cleanly" />
              )}
              {metrics.status === 'weak' && (
                <CoachNote color={COLORS.warning} text="Some joints partially obscured" />
              )}
              {metrics.status === 'lost' && (
                <CoachNote color={COLORS.fault} text="Low joint visibility — reframe" />
              )}
              {metrics.torsoLean !== null && Math.abs(metrics.torsoLean) > 15 && (
                <CoachNote color={COLORS.warning} text={`Torso lean detected (${metrics.torsoLean > 0 ? 'forward' : 'back'})`} />
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer note */}
      <div className="px-4 py-3 border-t" style={{ borderColor: COLORS.border }}>
        <p className="text-[8px] tracking-[0.1em] uppercase" style={{ color: COLORS.textMuted }}>
          Comparison · Next Pass
        </p>
      </div>
    </div>
  );
}

function CoachNote({ text, color }) {
  return (
    <div className="px-2.5 py-1.5 rounded-lg border-l-2 text-[9px] leading-relaxed"
      style={{ background: `${color}10`, borderColor: color, color: COLORS.textSecondary }}>
      {text}
    </div>
  );
}