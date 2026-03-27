import React from 'react';
import { Play, TrendingUp, Calendar } from 'lucide-react';
import { COLORS, FONT, scoreColor } from '@/components/bioneer/ui/DesignTokens';
import PrimaryButton from '@/components/buttons/PrimaryButton';

export default function SessionCard({ session, onReplay, onCritique }) {
  const date = new Date(session.started_at || session.createdAt).toLocaleDateString();
  const score = Math.round(session.form_score_overall || session.average_form_score || 0);
  const isGood = score >= 75;

  return (
    <div
      className="p-6 rounded-lg border transition-all hover:border-gold"
      style={{
        borderColor: COLORS.border,
        background: COLORS.surface,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-bold tracking-[0.1em] uppercase" style={{ color: COLORS.textPrimary }}>
            {session.movement_name || session.exercise || 'Movement'}
          </h3>
          <p className="text-[10px] mt-1 flex items-center gap-2" style={{ color: COLORS.textTertiary }}>
            <Calendar size={12} />
            {date}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: scoreColor(score) }}>
            {score}
          </div>
          <p className="text-[9px]" style={{ color: COLORS.textTertiary }}>
            FORM SCORE
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4 py-3 border-t border-b" style={{ borderColor: COLORS.border }}>
        <div>
          <p className="text-[9px]" style={{ color: COLORS.textTertiary }}>REPS</p>
          <p className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
            {session.reps_detected || session.rep_count || 0}
          </p>
        </div>
        <div>
          <p className="text-[9px]" style={{ color: COLORS.textTertiary }}>DURATION</p>
          <p className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
            {Math.round((session.duration_seconds || 0) / 60)}m
          </p>
        </div>
        <div>
          <p className="text-[9px]" style={{ color: COLORS.textTertiary }}>CATEGORY</p>
          <p className="text-sm font-semibold capitalize" style={{ color: COLORS.textPrimary }}>
            {session.category || 'strength'}
          </p>
        </div>
      </div>

      {/* Trend indicator */}
      {isGood && (
        <div className="flex items-center gap-2 mb-4 p-2 rounded" style={{ background: `${COLORS.correct}15` }}>
          <TrendingUp size={14} style={{ color: COLORS.correct }} />
          <span className="text-[9px]" style={{ color: COLORS.correct }}>
            Strong form detected
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onReplay}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded border text-[9px] font-bold tracking-[0.1em] uppercase transition-all hover:bg-white/5"
          style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
        >
          <Play size={12} />
          Review
        </button>
        <button
          onClick={onCritique}
          className="flex-1 py-2 rounded font-bold text-[9px] tracking-[0.1em] uppercase transition-all hover:scale-105"
          style={{
            background: COLORS.gold,
            color: COLORS.bg,
          }}
        >
          Coach
        </button>
      </div>
    </div>
  );
}