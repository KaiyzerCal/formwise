import React from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';

const SEVERITY_COLOR = {
  good:    COLORS.correct,
  warning: COLORS.warning,
  fault:   COLORS.fault,
  none:    COLORS.textMuted,
};

const POSE_STATUS = {
  locked:  { label: 'Pose Locked',   color: COLORS.correct },
  weak:    { label: 'Tracking Weak', color: COLORS.warning },
  lost:    { label: 'Pose Lost',     color: COLORS.fault   },
  idle:    { label: 'Waiting',       color: COLORS.textTertiary },
  loading: { label: 'Loading AI…',   color: COLORS.textSecondary },
  ready:   { label: 'Ready',         color: COLORS.textTertiary },
  error:   { label: 'Unavailable',   color: COLORS.fault   },
};

function ConfBar({ label, value, color }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-[8px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary }}>{label}</span>
        <span className="text-[9px] font-bold tabular-nums" style={{ color }}>{value !== null ? `${value}%` : '—'}</span>
      </div>
      <div className="h-0.5 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${value ?? 0}%`, background: color }} />
      </div>
    </div>
  );
}

function ScoreBadge({ score }) {
  const color = score >= 80 ? COLORS.correct : score >= 55 ? COLORS.warning : COLORS.fault;
  return (
    <div className="flex flex-col items-center justify-center py-3 rounded-xl border"
      style={{ background: `${color}10`, borderColor: `${color}40` }}>
      <span className="text-2xl font-bold tabular-nums" style={{ color, fontFamily: FONT.heading }}>
        {score}
      </span>
      <span className="text-[8px] tracking-[0.15em] uppercase mt-0.5" style={{ color: COLORS.textTertiary }}>
        Match Score
      </span>
    </div>
  );
}

function DeviationRow({ label, user, ref, diff, severity }) {
  const color = SEVERITY_COLOR[severity] ?? COLORS.textMuted;
  return (
    <div className="py-1.5 border-b last:border-0" style={{ borderColor: COLORS.border }}>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] truncate" style={{ color: COLORS.textTertiary }}>{label}</span>
        <span className="text-[9px] font-bold tabular-nums ml-2" style={{ color }}>
          {diff !== null ? (diff > 0 ? `+${diff}°` : `${diff}°`) : '—'}
        </span>
      </div>
      <div className="flex gap-2 text-[8px] tabular-nums" style={{ color: COLORS.textMuted }}>
        <span>You: {user !== null ? `${user}°` : '—'}</span>
        <span>Ref: {ref !== null ? `${ref}°` : '—'}</span>
      </div>
    </div>
  );
}

function CoachNote({ text, severity }) {
  const color = SEVERITY_COLOR[severity] ?? COLORS.textMuted;
  return (
    <div className="px-2.5 py-2 rounded-lg border-l-2 text-[9px] leading-relaxed"
      style={{ background: `${color}10`, borderColor: color, color: COLORS.textSecondary }}>
      {text}
    </div>
  );
}

export default function MetricRail({
  userPoseState, refPoseState,
  deviations, cues, score,
  userConf, refConf,
  isPlaying, hasRef,
}) {
  const userStatus = POSE_STATUS[userPoseState] ?? POSE_STATUS.idle;
  const refStatus  = POSE_STATUS[refPoseState]  ?? POSE_STATUS.idle;
  const hasData    = deviations?.some(d => d.diff !== null);

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ fontFamily: FONT.mono, background: COLORS.surface }}>

      {/* Header */}
      <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: COLORS.border }}>
        <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: COLORS.textTertiary }}>
          Comparison
        </p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">

        {/* Pose status row */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: userStatus.color }} />
            <span className="text-[9px]" style={{ color: userStatus.color }}>You: {userStatus.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: refStatus.color }} />
            <span className="text-[9px]" style={{ color: refStatus.color }}>Ref: {refStatus.label}</span>
          </div>
        </div>

        {/* Confidence bars */}
        {(userConf > 0 || refConf > 0) && (
          <div className="space-y-2">
            <ConfBar
              label="Your Conf."
              value={userConf}
              color={userConf > 65 ? COLORS.correct : userConf > 40 ? COLORS.warning : COLORS.fault}
            />
            {hasRef && (
              <ConfBar
                label="Ref Conf."
                value={refConf}
                color={refConf > 65 ? COLORS.correct : refConf > 40 ? COLORS.warning : COLORS.fault}
              />
            )}
          </div>
        )}

        {/* Score */}
        {score !== null && <ScoreBadge score={score} />}

        {/* Not playing / no data */}
        {!isPlaying && !hasData && (
          <p className="text-[9px] leading-relaxed" style={{ color: COLORS.textMuted }}>
            {!hasRef ? 'Load a reference clip for comparison.' : 'Play both videos to compare.'}
          </p>
        )}

        {/* Deviations */}
        {hasData && (
          <div className="space-y-0">
            <p className="text-[8px] tracking-[0.15em] uppercase pb-2" style={{ color: COLORS.textMuted }}>
              Joint Deviations
            </p>
            {deviations.map(d => (
              <DeviationRow key={d.id} {...d} />
            ))}
          </div>
        )}

        {/* Coaching cues */}
        {cues?.length > 0 && (
          <div className="space-y-2">
            <p className="text-[8px] tracking-[0.15em] uppercase" style={{ color: COLORS.textMuted }}>
              Coaching
            </p>
            {cues.map((c, i) => <CoachNote key={i} {...c} />)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t flex-shrink-0" style={{ borderColor: COLORS.border }}>
        <p className="text-[8px] tracking-[0.1em] uppercase" style={{ color: COLORS.textMuted }}>
          Pass 4 · Dual-Video Compare
        </p>
      </div>
    </div>
  );
}