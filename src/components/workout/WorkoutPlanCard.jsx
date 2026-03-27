import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Pause, RotateCcw, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function WorkoutPlanCard({ plan }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const progress = Math.round((plan.completed_sessions / plan.total_planned_sessions) * 100);
  
  const difficultyColor = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  };

  const statusColor = {
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    paused: 'bg-gray-100 text-gray-800',
  };

  const updatePlanMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkoutPlan.update(plan.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: () => base44.entities.WorkoutPlan.delete(plan.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
    },
  });

  const handleComplete = () => {
    updatePlanMutation.mutate({
      completed_sessions: plan.total_planned_sessions,
      status: 'completed',
    });
  };

  const handlePause = () => {
    updatePlanMutation.mutate({
      status: plan.status === 'paused' ? 'active' : 'paused',
    });
  };

  const handleDelete = () => {
    if (confirm('Delete this plan? This action cannot be undone.')) {
      deletePlanMutation.mutate();
    }
  };

  const startDate = new Date(plan.started_at);
  const today = new Date();
  const daysElapsed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

  return (
    <Card className={`p-5 border ${plan.status === 'completed' ? 'bg-slate-50' : 'bg-white'}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              {plan.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge className={difficultyColor[plan.difficulty]}>
                {plan.difficulty}
              </Badge>
              <Badge className={statusColor[plan.status]}>
                {plan.status}
              </Badge>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500">
            {plan.completed_sessions} / {plan.total_planned_sessions} sessions
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-600">Frequency</div>
            <div className="font-semibold">{plan.frequency_per_week}x/week</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-600">Duration</div>
            <div className="font-semibold">{plan.duration_weeks}w</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-600">Days In</div>
            <div className="font-semibold">{daysElapsed}d</div>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <h4 className="text-sm font-semibold mb-2">Exercises ({plan.exercises.length})</h4>
              <div className="space-y-2">
                {plan.exercises.map((ex, idx) => (
                  <div key={idx} className="text-sm bg-gray-50 p-3 rounded">
                    <div className="font-medium">{ex.exercise_name}</div>
                    <div className="text-gray-600 text-xs mt-1">
                      {ex.target_sets} sets × {ex.target_reps} reps
                    </div>
                    {ex.focus_areas && (
                      <div className="text-gray-500 text-xs mt-1">
                        Focus: {ex.focus_areas.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {plan.performance_notes && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Notes</h4>
                <p className="text-sm text-gray-600">{plan.performance_notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {plan.status !== 'completed' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePause}
                  disabled={updatePlanMutation.isPending}
                >
                  <Pause className="w-4 h-4 mr-1" />
                  {plan.status === 'paused' ? 'Resume' : 'Pause'}
                </Button>
              )}
              {plan.status !== 'completed' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleComplete}
                  disabled={updatePlanMutation.isPending}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Mark Complete
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                disabled={deletePlanMutation.isPending}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}