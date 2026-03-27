import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';

export default function ExerciseTracking({ planId, exercises }) {
  const [showForm, setShowForm] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [formData, setFormData] = useState({
    exercise_id: exercises[0]?.exercise_id || '',
    exercise_name: exercises[0]?.exercise_name || '',
    weight: '',
    reps: '',
    sets: '',
    notes: '',
  });

  const queryClient = useQueryClient();

  const logMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.ExerciseTracking.create({
        workout_plan_id: planId,
        ...data,
        logged_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackingData', planId] });
      setShowForm(false);
      setFormData({
        exercise_id: exercises[0]?.exercise_id || '',
        exercise_name: exercises[0]?.exercise_name || '',
        weight: '',
        reps: '',
        sets: '',
        notes: '',
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    logMutation.mutate({
      exercise_id: formData.exercise_id,
      exercise_name: formData.exercise_name,
      weight: parseFloat(formData.weight),
      reps: parseInt(formData.reps),
      sets: parseInt(formData.sets),
      notes: formData.notes,
    });
  };

  return (
    <div className="mt-4 border-t pt-4" style={{ borderColor: COLORS.border }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] tracking-[0.1em] uppercase font-bold" style={{ color: COLORS.gold }}>
          Strength Tracking
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-1.5 rounded transition hover:opacity-80"
          style={{ background: COLORS.goldDim, color: COLORS.gold }}
          title="Log exercise"
        >
          <Plus size={12} />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-3 rounded mb-3" style={{ background: COLORS.surfaceHover, borderColor: COLORS.border }}>
          <div className="space-y-2">
            <select
              value={formData.exercise_id}
              onChange={(e) => {
                const ex = exercises.find(x => x.exercise_id === e.target.value);
                setFormData({
                  ...formData,
                  exercise_id: e.target.value,
                  exercise_name: ex?.exercise_name || '',
                });
              }}
              className="w-full px-2 py-1.5 rounded text-[9px] border"
              style={{ background: COLORS.surface, borderColor: COLORS.border, color: COLORS.textPrimary }}
            >
              {exercises.map(ex => (
                <option key={ex.exercise_id} value={ex.exercise_id}>
                  {ex.exercise_name}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                placeholder="Weight"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="px-2 py-1.5 rounded text-[9px] border"
                style={{ background: COLORS.surface, borderColor: COLORS.border, color: COLORS.textPrimary }}
                step="0.5"
              />
              <input
                type="number"
                placeholder="Reps"
                value={formData.reps}
                onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                className="px-2 py-1.5 rounded text-[9px] border"
                style={{ background: COLORS.surface, borderColor: COLORS.border, color: COLORS.textPrimary }}
              />
              <input
                type="number"
                placeholder="Sets"
                value={formData.sets}
                onChange={(e) => setFormData({ ...formData, sets: e.target.value })}
                className="px-2 py-1.5 rounded text-[9px] border"
                style={{ background: COLORS.surface, borderColor: COLORS.border, color: COLORS.textPrimary }}
              />
            </div>

            <textarea
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-2 py-1.5 rounded text-[9px] border"
              style={{ background: COLORS.surface, borderColor: COLORS.border, color: COLORS.textPrimary }}
              rows="2"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={logMutation.isPending}
                className="flex-1 px-2 py-1.5 rounded text-[9px] tracking-[0.1em] uppercase font-bold border transition hover:opacity-90 disabled:opacity-50"
                style={{ background: COLORS.goldDim, borderColor: COLORS.goldBorder, color: COLORS.gold }}
              >
                {logMutation.isPending ? 'Logging...' : 'Log'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-2 py-1.5 rounded text-[9px]"
                style={{ background: COLORS.surfaceHover, color: COLORS.textSecondary }}
              >
                <X size={12} />
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-1.5">
        {exercises.map(ex => (
          <ExerciseTrackingItem
            key={ex.exercise_id}
            planId={planId}
            exercise={ex}
            isExpanded={expandedExercise === ex.exercise_id}
            onToggle={() => setExpandedExercise(expandedExercise === ex.exercise_id ? null : ex.exercise_id)}
          />
        ))}
      </div>
    </div>
  );
}

function ExerciseTrackingItem({ planId, exercise, isExpanded, onToggle }) {
  const { data: logs = [] } = useQuery({
    queryKey: ['trackingData', planId, exercise.exercise_id],
    queryFn: () =>
      base44.entities.ExerciseTracking.filter({
        workout_plan_id: planId,
        exercise_id: exercise.exercise_id,
      }),
  });

  const latestLog = logs[0];
  const maxWeight = Math.max(...logs.map(l => l.weight || 0), 0);
  const maxWeightIncrease = latestLog && logs.length > 1 ? latestLog.weight - logs[logs.length - 1].weight : 0;

  return (
    <button
      onClick={onToggle}
      className="w-full text-left p-2 rounded transition"
      style={{ background: isExpanded ? COLORS.surfaceHover : 'transparent' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold" style={{ color: COLORS.textPrimary }}>
            {exercise.exercise_name}
          </p>
          {latestLog && (
            <p className="text-[8px] mt-0.5" style={{ color: COLORS.textTertiary }}>
              {latestLog.weight}lbs × {latestLog.reps}r × {latestLog.sets}s
            </p>
          )}
        </div>
        {maxWeightIncrease > 0 && (
          <div className="text-right ml-2">
            <p className="text-[8px] font-bold" style={{ color: COLORS.correct }}>
              +{maxWeightIncrease.toFixed(1)}lbs
            </p>
          </div>
        )}
      </div>

      {isExpanded && logs.length > 0 && (
        <div className="mt-2 pt-2 border-t" style={{ borderColor: COLORS.border }}>
          <TrackingChart logs={logs} />
          <div className="mt-2 space-y-1 max-h-[120px] overflow-y-auto">
            {logs.map((log, idx) => (
              <div key={log.id} className="text-[8px] p-1.5 rounded" style={{ background: COLORS.surface }}>
                <p style={{ color: COLORS.textSecondary }}>
                  {new Date(log.logged_date).toLocaleDateString()}
                </p>
                <p style={{ color: COLORS.textPrimary }}>
                  {log.weight}lbs • {log.reps}r • {log.sets}s {log.notes && `— ${log.notes}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </button>
  );
}

function TrackingChart({ logs }) {
  const sortedLogs = [...logs].reverse();
  const maxLog = Math.max(...sortedLogs.map(l => l.weight || 0));
  const minLog = Math.min(...sortedLogs.map(l => l.weight || 0));
  const range = maxLog - minLog || 1;

  return (
    <div className="h-[80px] flex items-flex-end gap-1 px-1">
      {sortedLogs.slice(0, 12).map((log, idx) => {
        const height = ((log.weight - minLog) / range) * 100;
        return (
          <div key={log.id} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className="w-full rounded-t transition"
              style={{
                height: `${Math.max(height, 5)}%`,
                background: COLORS.gold,
                opacity: 0.8,
              }}
              title={`${log.weight}lbs`}
            />
          </div>
        );
      })}
    </div>
  );
}