import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import WorkoutPlanGenerator from '@/components/workout/WorkoutPlanGenerator';
import WorkoutPlanCard from '@/components/workout/WorkoutPlanCard';

export default function WorkoutPlans() {
  const [showGenerator, setShowGenerator] = useState(false);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['workoutPlans'],
    queryFn: async () => {
      const result = await base44.entities.WorkoutPlan.list('-started_at');
      return result;
    },
  });

  const activePlans = plans.filter(p => p.status === 'active');
  const completedPlans = plans.filter(p => p.status === 'completed');
  const pausedPlans = plans.filter(p => p.status === 'paused');

  const totalSessions = plans.reduce((sum, p) => sum + (p.completed_sessions || 0), 0);
  const totalPlanned = plans.reduce((sum, p) => sum + (p.total_planned_sessions || 0), 0);
  const overallProgress = totalPlanned > 0 ? Math.round((totalSessions / totalPlanned) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Workout Plans</h1>
            <p className="text-slate-600">Create and track personalized workout plans</p>
          </div>
          <Button 
            onClick={() => setShowGenerator(!showGenerator)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Plan
          </Button>
        </div>

        {/* Generator */}
        {showGenerator && (
          <div className="mb-8">
            <WorkoutPlanGenerator />
          </div>
        )}

        {/* Overall Stats */}
        {plans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="text-sm text-slate-600">Total Plans</div>
              <div className="text-2xl font-bold mt-1">{plans.length}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="text-sm text-slate-600">Active</div>
              <div className="text-2xl font-bold mt-1 text-blue-600">{activePlans.length}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="text-sm text-slate-600">Completed</div>
              <div className="text-2xl font-bold mt-1 text-green-600">{completedPlans.length}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="text-sm text-slate-600">Overall Progress</div>
              <div className="text-2xl font-bold mt-1">{overallProgress}%</div>
            </div>
          </div>
        )}

        {/* Plans by Status */}
        <div className="space-y-8">
          {/* Active Plans */}
          {activePlans.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Active Plans</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activePlans.map(plan => (
                  <WorkoutPlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            </div>
          )}

          {/* Paused Plans */}
          {pausedPlans.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Paused Plans</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pausedPlans.map(plan => (
                  <WorkoutPlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Plans */}
          {completedPlans.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Completed Plans</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {completedPlans.map(plan => (
                  <WorkoutPlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {plans.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4">No workout plans yet</div>
              <Button 
                onClick={() => setShowGenerator(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create Your First Plan
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}