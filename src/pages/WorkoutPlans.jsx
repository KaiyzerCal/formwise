import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Zap } from 'lucide-react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
import PlanGenerator from '@/components/workout/PlanGenerator';
import PlanCard from '@/components/workout/PlanCard';
import PlanDetail from '@/components/workout/PlanDetail';

export default function WorkoutPlans() {
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['workoutPlans'],
    queryFn: async () => {
      const result = await base44.entities.WorkoutPlan.list('-started_at');
      return result;
    },
  });

  // Update plan status mutation
  const { mutate: updatePlanStatus } = useMutation({
    mutationFn: async (data) => {
      await base44.entities.WorkoutPlan.update(data.id, { status: data.status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
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
      <div className="flex items-center justify-center h-screen" style={{ background: COLORS.bg }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: COLORS.border, borderTopColor: COLORS.gold }} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ fontFamily: FONT.mono, background: COLORS.bg, color: COLORS.textPrimary }}>
      <div className="px-6 py-4 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="border-b flex items-center justify-between pb-4" style={{ borderColor: COLORS.border }}>
          <div>
            <h1 className="text-xs tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.gold }}>
              Workout Plans
            </h1>
            <p className="text-[9px] mt-1" style={{ color: COLORS.textTertiary }}>
              Personalized training programs
            </p>
          </div>
          <button
            onClick={() => setShowGenerator(!showGenerator)}
            className="px-3 py-2 rounded text-[9px] tracking-[0.1em] uppercase font-bold border flex items-center gap-2 transition hover:opacity-90"
            style={{ background: COLORS.goldDim, borderColor: COLORS.goldBorder, color: COLORS.gold }}
          >
            <Plus size={12} />
            New
          </button>
        </div>

        {/* Generator Modal */}
        {showGenerator && (
          <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
            <PlanGenerator
              onSuccess={() => {
                setShowGenerator(false);
                queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
              }}
              onClose={() => setShowGenerator(false)}
            />
          </div>
        )}

        {/* Overall Stats */}
        {plans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="rounded-lg border p-3" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
              <div className="text-[8px] tracking-[0.12em] uppercase" style={{ color: COLORS.textTertiary }}>Total Plans</div>
              <div className="text-lg font-bold mt-1.5" style={{ color: COLORS.textPrimary }}>{plans.length}</div>
            </div>
            <div className="rounded-lg border p-3" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
              <div className="text-[8px] tracking-[0.12em] uppercase" style={{ color: COLORS.textTertiary }}>Active</div>
              <div className="text-lg font-bold mt-1.5" style={{ color: COLORS.gold }}>{activePlans.length}</div>
            </div>
            <div className="rounded-lg border p-3" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
              <div className="text-[8px] tracking-[0.12em] uppercase" style={{ color: COLORS.textTertiary }}>Completed</div>
              <div className="text-lg font-bold mt-1.5" style={{ color: COLORS.correct }}>{completedPlans.length}</div>
            </div>
            <div className="rounded-lg border p-3" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
              <div className="text-[8px] tracking-[0.12em] uppercase" style={{ color: COLORS.textTertiary }}>Overall Progress</div>
              <div className="text-lg font-bold mt-1.5" style={{ color: COLORS.gold }}>{overallProgress}%</div>
            </div>
          </div>
        )}

        {/* Overall Stats */}
        {plans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Plans', value: plans.length, color: COLORS.textPrimary },
              { label: 'Active', value: activePlans.length, color: COLORS.gold },
              { label: 'Completed', value: completedPlans.length, color: COLORS.correct },
              { label: 'Progress', value: `${overallProgress}%`, color: COLORS.gold },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-lg border p-3"
                style={{ background: COLORS.surface, borderColor: COLORS.border }}
              >
                <p className="text-[8px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary }}>
                  {stat.label}
                </p>
                <p className="text-lg font-bold mt-2" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Plans by Status */}
        <div className="space-y-6">
          {/* Active Plans */}
          {activePlans.length > 0 && (
            <div>
              <h2 className="text-[10px] tracking-[0.15em] uppercase font-bold mb-3" style={{ color: COLORS.gold }}>
                Active Plans
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activePlans.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onSelect={setSelectedPlan}
                    onToggleStatus={updatePlanStatus}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Paused Plans */}
          {pausedPlans.length > 0 && (
            <div>
              <h2 className="text-[10px] tracking-[0.15em] uppercase font-bold mb-3" style={{ color: COLORS.gold }}>
                Paused Plans
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pausedPlans.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onSelect={setSelectedPlan}
                    onToggleStatus={updatePlanStatus}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Plans */}
          {completedPlans.length > 0 && (
            <div>
              <h2 className="text-[10px] tracking-[0.15em] uppercase font-bold mb-3" style={{ color: COLORS.gold }}>
                Completed Plans
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {completedPlans.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onSelect={setSelectedPlan}
                    onToggleStatus={updatePlanStatus}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {plans.length === 0 && (
            <div className="text-center py-12 rounded-lg border" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
              <Zap size={28} className="mx-auto mb-3" style={{ color: COLORS.gold }} />
              <p className="text-[10px] mb-4" style={{ color: COLORS.textTertiary }}>
                No workout plans yet
              </p>
              <button
                onClick={() => setShowGenerator(true)}
                className="px-4 py-2 rounded text-[9px] tracking-[0.1em] uppercase font-bold border"
                style={{ background: COLORS.goldDim, borderColor: COLORS.goldBorder, color: COLORS.gold }}
              >
                Create Your First Plan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Plan Detail Modal */}
      {selectedPlan && (
        <PlanDetail
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onStartExercise={(exercise) => {
            // Could navigate to session with pre-selected exercise
            console.log('Start exercise:', exercise);
            setSelectedPlan(null);
          }}
        />
      )}
    </div>
  );
}