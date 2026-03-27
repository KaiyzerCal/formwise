/**
 * PlanCard — Individual workout plan display
 * Shows progress, exercises, and actions
 */

import React from 'react';
import { COLORS, FONT, scoreColor } from '@/components/bioneer/ui/DesignTokens';
import { Play, Pause, Check, ChevronRight } from 'lucide-react';

export default function PlanCard({ plan, onSelect, onToggleStatus }) {
  const progress = Math.round(
    (plan.completed_sessions / plan.total_planned_sessions) * 100
  );

  const isActive = plan.status === 'active';
  const isCompleted = plan.status === 'completed';

  const handleToggle = (e) => {
    e.stopPropagation();
    const newStatus = isActive ? 'paused' : 'active';
    onToggleStatus(plan.id, newStatus);
  };

  return (
    <button
      onClick={() => onSelect(plan)}
      className="text-left rounded-lg border p-4 hover:bg-white/5 transition-all active:scale-95"
      style={{ background: COLORS.surface, borderColor: COLORS.borderLight }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold capitalize" style={{ color: COLORS.textPrimary }}>
            {plan.name}
          </h3>
          <p className="text-[9px] mt-1 capitalize" style={{ color: COLORS.textSecondary }}>
            {plan.goal} • {plan.difficulty}
          </p>
        </div>
        {isCompleted && <Check size={18} style={{ color: COLORS.correct }} />}
      </div>

      {/* Exercises */}
      <div className="mb-3">
        <p className="text-[8px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary }}>
          {plan.exercises?.length || 0} exercises
        </p>
        <div className="flex flex-wrap gap-1 mt-1">
          {(plan.exercises || []).slice(0, 3).map((ex, i) => (
            <span
              key={i}
              className="text-[8px] px-2 py-1 rounded"
              style={{ background: COLORS.surfaceHover, color: COLORS.textSecondary }}
            >
              {ex.exercise_name || 'Exercise'}
            </span>
          ))}
          {(plan.exercises || []).length > 3 && (
            <span className="text-[8px] px-2 py-1" style={{ color: COLORS.textTertiary }}>
              +{(plan.exercises || []).length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-[8px]" style={{ color: COLORS.textTertiary }}>
            {plan.completed_sessions}/{plan.total_planned_sessions} sessions
          </span>
          <span className="text-[8px] font-bold" style={{ color: scoreColor(progress) }}>
            {progress}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, background: scoreColor(progress) }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: COLORS.border }}>
        <span className="text-[8px]" style={{ color: COLORS.textTertiary }}>
          {plan.frequency_per_week}x/week for {plan.duration_weeks}w
        </span>
        <button
          onClick={handleToggle}
          className="p-1.5 rounded hover:bg-white/10 transition"
          title={isActive ? 'Pause plan' : 'Resume plan'}
        >
          {isActive ? (
            <Pause size={14} style={{ color: COLORS.gold }} />
          ) : (
            <Play size={14} style={{ color: COLORS.textSecondary }} />
          )}
        </button>
      </div>
    </button>
  );
}