import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Plus, Zap } from 'lucide-react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
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
      <div className="flex items-center justify-center h-screen" style={{ background: COLORS.bg }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: COLORS.border, borderTopColor: COLORS.gold }}></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-5" style={{ fontFamily: FONT.mono, background: COLORS.bg, color: COLORS.textPrimary }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-xs tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.gold }}>Workout Plans</h1>
            <p className="text-[10px] mt-1" style={{ color: COLORS.textTertiary }}>Create and track personalized workout programs</p>
          </div>
          <button
            onClick={() => setShowGenerator(!showGenerator)}
            className="px-4 py-2 rounded text-[9px] tracking-[0.1em] uppercase font-bold border flex items-center gap-2 flex-shrink-0"
            style={{ background: COLORS.goldDim, borderColor: COLORS.goldBorder, color: COLORS.gold }}
          >
            <Plus size={12} />
            New Plan
          </button>
        </div>

        {/* Generator */}
        {showGenerator && (
          <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
            <WorkoutPlanGenerator />
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

        {/* Plans by Status */}
        <div className="space-y-6">
          {/* Active Plans */}
          {activePlans.length > 0 && (
            <div>
              <h2 className="text-[10px] tracking-[0.15em] uppercase font-bold mb-3" style={{ color: COLORS.gold }}>Active Plans</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {activePlans.map(plan => (
                  <WorkoutPlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            </div>
          )}

          {/* Paused Plans */}
          {pausedPlans.length > 0 && (
            <div>
              <h2 className="text-[10px] tracking-[0.15em] uppercase font-bold mb-3" style={{ color: COLORS.gold }}>Paused Plans</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {pausedPlans.map(plan => (
                  <WorkoutPlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Plans */}
          {completedPlans.length > 0 && (
            <div>
              <h2 className="text-[10px] tracking-[0.15em] uppercase font-bold mb-3" style={{ color: COLORS.gold }}>Completed Plans</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {completedPlans.map(plan => (
                  <WorkoutPlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {plans.length === 0 && (
            <div className="text-center py-12 rounded-lg border" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
              <Zap size={24} className="mx-auto mb-3" style={{ color: COLORS.gold }} />
              <div className="text-[10px] mb-4" style={{ color: COLORS.textTertiary }}>No workout plans yet</div>
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
    </div>
  );
}