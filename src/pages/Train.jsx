/**
 * Train — Workout Execution Hub
 * Auto-generates workouts from detected issues. Daily view default.
 * Wraps existing WorkoutPlans functionality with analysis-driven generation.
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
import { getAllSessions } from '@/components/bioneer/data/unifiedSessionStore';
import { ArrowLeft, Dumbbell, Zap, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PlanCard from '@/components/workout/PlanCard';
import PlanDetail from '@/components/workout/PlanDetail';
import PlanGenerator from '@/components/workout/PlanGenerator';
import DailyWorkoutView from '@/components/train/DailyWorkoutView';

export default function Train() {
  const navigate = useNavigate();
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [view, setView] = useState('daily'); // daily | plans

  const { data: plans = [], isLoading, refetch } = useQuery({
    queryKey: ['workoutPlans'],
    queryFn: () => base44.entities.WorkoutPlan.list('-started_at'),
  });

  const sessions = useMemo(() => getAllSessions(), []);
  const topFaults = useMemo(() => {
    const counts = {};
    sessions.slice(0, 5).forEach(s => {
      (s.top_faults || []).forEach(f => { counts[f] = (counts[f] || 0) + 1; });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([f]) => f);
  }, [sessions]);

  const activePlans = plans.filter(p => p.status === 'active');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: COLORS.bg }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: COLORS.border, borderTopColor: COLORS.gold }} />
      </div>
    );
  }

  return (
    <div className="min-h-full" style={{ background: COLORS.bg, fontFamily: FONT.mono, color: COLORS.textPrimary }}>
      {/* Header */}
      <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: COLORS.border }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1">
            <ArrowLeft size={16} style={{ color: COLORS.textSecondary }} />
          </button>
          <h1 className="text-xs tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.gold }}>Train</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('daily')}
            className="px-3 py-1.5 rounded text-[8px] tracking-[0.1em] uppercase font-bold border"
            style={{
              background: view === 'daily' ? COLORS.goldDim : 'transparent',
              borderColor: view === 'daily' ? COLORS.goldBorder : COLORS.border,
              color: view === 'daily' ? COLORS.gold : COLORS.textTertiary,
            }}
          >
            Today
          </button>
          <button
            onClick={() => setView('plans')}
            className="px-3 py-1.5 rounded text-[8px] tracking-[0.1em] uppercase font-bold border"
            style={{
              background: view === 'plans' ? COLORS.goldDim : 'transparent',
              borderColor: view === 'plans' ? COLORS.goldBorder : COLORS.border,
              color: view === 'plans' ? COLORS.gold : COLORS.textTertiary,
            }}
          >
            Plans
          </button>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5 max-w-3xl mx-auto">
        {view === 'daily' ? (
          <DailyWorkoutView
            topFaults={topFaults}
            activePlans={activePlans}
            onStartExercise={(ex) => navigate(`/analyze?exercise=${ex.exercise_id || ex.id}`)}
            onViewPlan={setSelectedPlan}
          />
        ) : (
          <>
            {/* Plan generator */}
            <button
              onClick={() => setShowGenerator(!showGenerator)}
              className="w-full py-3 rounded-lg border flex items-center justify-center gap-2 text-[9px] tracking-[0.1em] uppercase font-bold"
              style={{ borderColor: COLORS.goldBorder, color: COLORS.gold, background: COLORS.goldDim }}
            >
              <Zap size={12} /> Generate New Plan
            </button>

            {showGenerator && (
              <div className="rounded-lg border p-4" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
                <PlanGenerator
                  onSuccess={() => { setShowGenerator(false); refetch(); }}
                  onClose={() => setShowGenerator(false)}
                />
              </div>
            )}

            {/* Active Plans */}
            {plans.length > 0 ? (
              <div className="space-y-3">
                {plans.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onSelect={setSelectedPlan}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Dumbbell size={28} style={{ color: COLORS.textTertiary }} className="mx-auto mb-3" />
                <p className="text-[10px]" style={{ color: COLORS.textTertiary }}>
                  No plans yet. Generate one based on your analysis.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {selectedPlan && (
        <PlanDetail
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onStartExercise={(ex) => {
            setSelectedPlan(null);
            navigate(`/analyze?exercise=${ex.exercise_id || ex.id}`);
          }}
        />
      )}
    </div>
  );
}