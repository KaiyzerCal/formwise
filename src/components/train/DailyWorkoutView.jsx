/**
 * DailyWorkoutView — Today's corrective workout based on analysis
 */
import React from 'react';
import { motion } from 'framer-motion';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
import { Dumbbell, ChevronRight, Target, CheckCircle } from 'lucide-react';

const FAULT_EXERCISES = {
  knee_valgus: [
    { id: 'clamshell', name: 'Clamshells', sets: 3, reps: 15, cue: 'Drive knees apart against resistance' },
    { id: 'goblet_squat', name: 'Goblet Squat', sets: 3, reps: 10, cue: 'Push knees out over pinky toe' },
  ],
  early_extension: [
    { id: 'pause_squat', name: 'Pause Squats', sets: 3, reps: 8, cue: '3-second pause at bottom' },
    { id: 'rdl', name: 'Romanian Deadlift', sets: 3, reps: 10, cue: 'Feel hamstring stretch, hinge at hips' },
  ],
  excessive_lean: [
    { id: 'front_squat', name: 'Front Squat', sets: 3, reps: 8, cue: 'Elbows high, chest up' },
    { id: 'plank', name: 'Plank Hold', sets: 3, reps: '45s', cue: 'Brace core, neutral spine' },
  ],
  asymmetry: [
    { id: 'split_squat', name: 'Bulgarian Split Squat', sets: 3, reps: 10, cue: 'Equal depth both sides' },
    { id: 'single_leg_dl', name: 'Single Leg Deadlift', sets: 3, reps: 8, cue: 'Balance and control' },
  ],
  depth_loss: [
    { id: 'ankle_mob', name: 'Ankle Mobility', sets: 2, reps: '60s', cue: 'Wall ankle stretch each side' },
    { id: 'box_squat', name: 'Box Squat', sets: 3, reps: 10, cue: 'Sit fully onto box each rep' },
  ],
};

export default function DailyWorkoutView({ topFaults, activePlans, onStartExercise, onViewPlan }) {
  // Build today's workout from top faults
  const todayExercises = [];
  const seen = new Set();
  (topFaults || []).forEach(fault => {
    const exercises = FAULT_EXERCISES[fault] || FAULT_EXERCISES.excessive_lean;
    exercises.forEach(ex => {
      if (!seen.has(ex.id)) {
        seen.add(ex.id);
        todayExercises.push({ ...ex, fault });
      }
    });
  });

  if (todayExercises.length === 0 && (!activePlans || activePlans.length === 0)) {
    return (
      <div className="text-center py-12">
        <Target size={28} style={{ color: COLORS.textTertiary }} className="mx-auto mb-3" />
        <p className="text-xs font-bold" style={{ color: COLORS.textSecondary }}>No issues detected yet</p>
        <p className="text-[9px] mt-1" style={{ color: COLORS.textTertiary }}>
          Run an analysis to generate your corrective workout
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Today's Correction Plan */}
      {todayExercises.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[8px] tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.gold }}>
              Today's Correction Plan
            </p>
            <span className="text-[8px]" style={{ color: COLORS.textTertiary }}>
              {todayExercises.length} exercises
            </span>
          </div>
          {todayExercises.map((ex, i) => (
            <motion.button
              key={ex.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => onStartExercise(ex)}
              className="w-full px-4 py-3 rounded-lg border flex items-center gap-3 text-left hover:bg-white/[0.02] transition"
              style={{ background: COLORS.surface, borderColor: COLORS.border }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: COLORS.goldDim }}>
                <Dumbbell size={14} style={{ color: COLORS.gold }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold" style={{ color: COLORS.textPrimary }}>{ex.name}</p>
                <p className="text-[8px] mt-0.5" style={{ color: COLORS.textTertiary }}>
                  {ex.sets}×{ex.reps} · {ex.cue}
                </p>
              </div>
              <ChevronRight size={12} style={{ color: COLORS.textTertiary }} />
            </motion.button>
          ))}
        </div>
      )}

      {/* Active Plans */}
      {activePlans && activePlans.length > 0 && (
        <div className="space-y-3">
          <p className="text-[8px] tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.textTertiary }}>
            Active Plans
          </p>
          {activePlans.map(plan => (
            <button
              key={plan.id}
              onClick={() => onViewPlan(plan)}
              className="w-full px-4 py-3 rounded-lg border flex items-center justify-between text-left hover:bg-white/[0.02] transition"
              style={{ background: COLORS.surface, borderColor: COLORS.border }}
            >
              <div>
                <p className="text-[10px] font-bold" style={{ color: COLORS.textPrimary }}>{plan.name}</p>
                <p className="text-[8px] mt-0.5" style={{ color: COLORS.textTertiary }}>
                  {plan.completed_sessions || 0}/{plan.total_planned_sessions || 0} sessions
                </p>
              </div>
              <ChevronRight size={12} style={{ color: COLORS.textTertiary }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}