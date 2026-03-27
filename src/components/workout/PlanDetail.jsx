/**
 * PlanDetail — Full workout plan view with exercise details
 * Shows exercises, form focus areas, and progress tracking
 */

import React, { useState } from 'react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
import { X, Edit2, ChevronRight } from 'lucide-react';

export default function PlanDetail({ plan, onClose, onStartExercise }) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(plan.performance_notes || '');

  const handleSaveNotes = () => {
    setEditingNotes(false);
    // Would save via API
  };

  const progress = Math.round(
    (plan.completed_sessions / plan.total_planned_sessions) * 100
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div
        className="w-full max-w-2xl rounded-lg border max-h-[90vh] overflow-y-auto"
        style={{ background: COLORS.surface, borderColor: COLORS.border }}
      >
        {/* Header */}
        <div className="sticky top-0 px-6 py-4 border-b flex items-start justify-between" style={{ borderColor: COLORS.border }}>
          <div>
            <h1 className="text-sm font-bold capitalize mb-1" style={{ color: COLORS.textPrimary }}>
              {plan.name}
            </h1>
            <p className="text-[9px]" style={{ color: COLORS.textSecondary }}>
              {plan.goal} • {plan.difficulty} • {plan.frequency_per_week}x/week
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-white/10 transition">
            <X size={16} style={{ color: COLORS.textSecondary }} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Progress */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-[9px] font-bold" style={{ color: COLORS.textTertiary }}>
                PROGRESS
              </span>
              <span className="text-[9px] font-bold" style={{ color: COLORS.gold }}>
                {plan.completed_sessions}/{plan.total_planned_sessions} ({progress}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, background: COLORS.gold }}
              />
            </div>
          </div>

          {/* Exercises */}
          <div>
            <h2 className="text-[10px] font-bold tracking-[0.1em] uppercase mb-3" style={{ color: COLORS.gold }}>
              Exercises ({plan.exercises?.length || 0})
            </h2>
            <div className="space-y-2">
              {(plan.exercises || []).map((ex, i) => (
                <button
                  key={i}
                  onClick={() => onStartExercise?.(ex)}
                  className="w-full text-left px-3 py-3 rounded border hover:bg-white/5 transition flex items-start justify-between"
                  style={{ background: COLORS.bg, borderColor: COLORS.border }}
                >
                  <div className="flex-1">
                    <h3 className="text-[10px] font-bold mb-1" style={{ color: COLORS.textPrimary }}>
                      {ex.exercise_name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[8px] font-bold" style={{ color: COLORS.gold }}>
                        {ex.target_sets}x{ex.target_reps}
                      </span>
                      <span className="text-[8px]" style={{ color: COLORS.textTertiary }}>
                        •
                      </span>
                      <span className="text-[8px] capitalize" style={{ color: COLORS.textTertiary }}>
                        {ex.difficulty_level || 'standard'}
                      </span>
                    </div>

                    {ex.focus_areas && ex.focus_areas.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ex.focus_areas.map((area, j) => (
                          <span
                            key={j}
                            className="text-[7px] px-1.5 py-0.5 rounded"
                            style={{ background: COLORS.surfaceHover, color: COLORS.textSecondary }}
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={14} style={{ color: COLORS.gold, flexShrink: 0, marginTop: '4px' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Performance Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[10px] font-bold tracking-[0.1em] uppercase" style={{ color: COLORS.gold }}>
                Performance Notes
              </h2>
              <button
                onClick={() => setEditingNotes(!editingNotes)}
                className="p-1 rounded hover:bg-white/10 transition"
              >
                <Edit2 size={12} style={{ color: COLORS.textSecondary }} />
              </button>
            </div>

            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-[9px]"
                  style={{ background: COLORS.bg, borderColor: COLORS.border, color: COLORS.textPrimary }}
                  rows="3"
                  placeholder="Track your progress and improvements..."
                />
                <button
                  onClick={handleSaveNotes}
                  className="w-full px-3 py-1.5 rounded text-[9px] font-bold"
                  style={{ background: COLORS.gold, color: COLORS.bg }}
                >
                  Save Notes
                </button>
              </div>
            ) : (
              <p className="text-[9px] p-3 rounded" style={{ background: COLORS.bg, color: COLORS.textSecondary }}>
                {notes || 'No notes yet. Track your progress here.'}
              </p>
            )}
          </div>

          {/* Metadata */}
          <div className="border-t pt-4" style={{ borderColor: COLORS.border }}>
            <div className="grid grid-cols-2 gap-4 text-[9px]">
              <div>
                <p style={{ color: COLORS.textTertiary }} className="mb-1">
                  Duration
                </p>
                <p style={{ color: COLORS.textPrimary }} className="font-bold">
                  {plan.duration_weeks} weeks
                </p>
              </div>
              <div>
                <p style={{ color: COLORS.textTertiary }} className="mb-1">
                  Frequency
                </p>
                <p style={{ color: COLORS.textPrimary }} className="font-bold">
                  {plan.frequency_per_week}x per week
                </p>
              </div>
              <div>
                <p style={{ color: COLORS.textTertiary }} className="mb-1">
                  Status
                </p>
                <p className="font-bold capitalize" style={{ color: COLORS.gold }}>
                  {plan.status}
                </p>
              </div>
              <div>
                <p style={{ color: COLORS.textTertiary }} className="mb-1">
                  Started
                </p>
                <p style={{ color: COLORS.textPrimary }} className="font-bold">
                  {new Date(plan.started_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}