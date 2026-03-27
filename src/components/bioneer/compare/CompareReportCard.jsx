/**
 * CompareReportCard
 * Displays the post-session comparison report with score,
 * per-joint breakdown, and coaching cues.
 */
import React from 'react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { CheckCircle2, AlertTriangle, XCircle, Trophy } from 'lucide-react';

function scoreColor(s) {
  if (s >= 80) return COLORS.correct;
  if (s >= 55) return COLORS.warning;
  return COLORS.fault;
}

function JointBar({ label, matchPct }) {
  const color = scoreColor(matchPct);
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[9px] truncate" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
          {label}
        </span>
        <span className="text-[9px] font-bold tabular-nums" style={{ color, fontFamily: FONT.mono }}>
          {matchPct}%
        </span>
      </div>
      <div className="h-0.5 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${matchPct}%`, background: color }} />
      </div>
    </div>
  );
}

function CueRow({ cue }) {
  return (
    <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg border-l-2"
      style={{ background: `${COLORS.warning}10`, borderColor: COLORS.warning }}>
      <AlertTriangle size={10} style={{ color: COLORS.warning, flexShrink: 0, marginTop: 2 }} />
      <span className="text-[9px] leading-relaxed" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
        {cue}
      </span>
    </div>
  );
}

export default function CompareReportCard({ report, onDismiss, onSave }) {
  if (!report) return null;

  const color = scoreColor(report.overallScore);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-2xl border overflow-hidden"
        style={{ background: COLORS.surface, borderColor: COLORS.borderLight }}>

        {/* Header */}
        <div className="px-5 py-4 border-b" style={{ borderColor: COLORS.border }}>
          <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            Comparison Report
          </p>
          <p className="text-xs font-bold mt-0.5 uppercase" style={{ color: COLORS.gold, fontFamily: FONT.heading }}>
            {report.exerciseName}
          </p>
        </div>

        <div className="px-5 py-4 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Score */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center flex-shrink-0"
              style={{ borderColor: color, background: `${color}15` }}>
              <span className="text-2xl font-bold tabular-nums leading-none" style={{ color, fontFamily: FONT.heading }}>
                {report.overallScore}
              </span>
              <span className="text-[7px] tracking-widest uppercase mt-0.5" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                Match
              </span>
            </div>
            <div className="space-y-1 min-w-0">
              {report.bestJoint && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={10} style={{ color: COLORS.correct, flexShrink: 0 }} />
                  <span className="text-[9px] truncate" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
                    Best: {report.bestJoint.label} ({report.bestJoint.matchPct}%)
                  </span>
                </div>
              )}
              {report.worstJoint && (
                <div className="flex items-center gap-1.5">
                  <XCircle size={10} style={{ color: COLORS.fault, flexShrink: 0 }} />
                  <span className="text-[9px] truncate" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
                    Work on: {report.worstJoint.label} ({report.worstJoint.matchPct}%)
                  </span>
                </div>
              )}
              {report.worstPhase && report.worstPhase !== 'unknown' && (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={10} style={{ color: COLORS.warning, flexShrink: 0 }} />
                  <span className="text-[9px] truncate" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
                    Phase: {report.worstPhase}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Joint breakdown */}
          {report.jointBreakdown?.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-[8px] tracking-[0.15em] uppercase" style={{ color: COLORS.textMuted, fontFamily: FONT.mono }}>
                Joint Match %
              </p>
              {report.jointBreakdown.map(j => (
                <JointBar key={j.id} label={j.label} matchPct={j.matchPct} />
              ))}
            </div>
          )}

          {/* Coaching cues */}
          {report.topCues?.length > 0 && (
            <div className="space-y-2">
              <p className="text-[8px] tracking-[0.15em] uppercase" style={{ color: COLORS.textMuted, fontFamily: FONT.mono }}>
                Coaching Notes
              </p>
              {report.topCues.map((cue, i) => (
                <CueRow key={i} cue={cue} />
              ))}
            </div>
          )}

          <p className="text-[8px]" style={{ color: COLORS.textMuted, fontFamily: FONT.mono }}>
            {report.framesAnalyzed} frames analyzed
          </p>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t flex gap-3" style={{ borderColor: COLORS.border }}>
          <button onClick={onSave}
            className="flex-1 py-2.5 rounded-lg text-[10px] font-bold tracking-[0.1em] uppercase"
            style={{ background: COLORS.goldDim, border: `1px solid ${COLORS.goldBorder}`, color: COLORS.gold, fontFamily: FONT.mono }}>
            Save Report
          </button>
          <button onClick={onDismiss}
            className="flex-1 py-2.5 rounded-lg text-[10px] font-bold tracking-[0.1em] uppercase"
            style={{ background: COLORS.border, color: COLORS.textSecondary, fontFamily: FONT.mono }}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}