import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { getAllSessions } from "../data/unifiedSessionStore";
import { COLORS, FONT } from "../ui/DesignTokens";
import { getExerciseById } from "../exerciseLibrary";
import { getSportsMovementById } from "../sportsLibrary";
import { TrendingUp, ArrowRight } from "lucide-react";

// Map exercises to primary muscle groups
const MUSCLE_GROUP_MAP = {
  // Strength movements
  squat: ['Quads', 'Glutes', 'Hamstrings'],
  deadlift: ['Hamstrings', 'Glutes', 'Lower Back'],
  bench_press: ['Chest', 'Triceps', 'Shoulders'],
  pull_ups: ['Lats', 'Biceps', 'Back'],
  barbell_row: ['Back', 'Lats', 'Biceps'],
  overhead_press: ['Shoulders', 'Triceps', 'Chest'],
  leg_press: ['Quads', 'Glutes'],
  leg_curl: ['Hamstrings'],
  
  // Sports movements
  golf_swing: ['Core', 'Shoulders', 'Hips'],
  baseball_pitch: ['Shoulders', 'Core', 'Legs'],
  sprint: ['Legs', 'Core', 'Glutes'],
  vertical_jump: ['Quads', 'Glutes', 'Core'],
};

export default function MuscleGroupProgress() {
  const muscleGroupData = useMemo(() => {
    const sessions = getAllSessions();
    if (!sessions.length) return [];

    const muscleMap = {};

    // Aggregate muscle group data from sessions
    sessions.forEach(session => {
      const exId = session.exercise_id || session.movement_id;
      if (!exId) return;

      const muscleGroups = MUSCLE_GROUP_MAP[exId] || [];
      const score = session.form_score_overall || session.average_form_score || 0;

      muscleGroups.forEach(muscle => {
        if (!muscleMap[muscle]) {
          muscleMap[muscle] = {
            name: muscle,
            engagementCount: 0,
            totalScore: 0,
            avgScore: 0,
            trend: 0,
            sessions: [],
          };
        }
        muscleMap[muscle].engagementCount += 1;
        muscleMap[muscle].totalScore += score;
        muscleMap[muscle].sessions.push({
          score,
          date: new Date(session.started_at || session.created_date),
        });
      });
    });

    // Calculate averages and trends
    return Object.values(muscleMap)
      .map(muscle => {
        muscle.avgScore = Math.round(muscle.totalScore / muscle.engagementCount);
        
        // Calculate trend: compare last 3 vs first 3
        const sorted = muscle.sessions.sort((a, b) => a.date - b.date);
        if (sorted.length >= 2) {
          const recentAvg = Math.round(
            sorted.slice(-3).reduce((sum, s) => sum + s.score, 0) / Math.min(3, sorted.length)
          );
          const olderAvg = Math.round(
            sorted.slice(0, 3).reduce((sum, s) => sum + s.score, 0) / Math.min(3, sorted.length)
          );
          muscle.trend = recentAvg - olderAvg;
        }

        return muscle;
      })
      .sort((a, b) => b.engagementCount - a.engagementCount);
  }, []);

  const topMuscles = useMemo(() => {
    return muscleGroupData.slice(0, 5);
  }, [muscleGroupData]);

  const totalEngagements = useMemo(() => {
    return muscleGroupData.reduce((sum, m) => sum + m.engagementCount, 0);
  }, [muscleGroupData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border p-4 lg:p-5 space-y-4"
      style={{
        background: COLORS.surface,
        borderColor: COLORS.border,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xs font-bold tracking-[0.15em] uppercase"
            style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
            Muscle Group Engagement
          </h3>
          <p className="text-[9px] mt-1"
            style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            {totalEngagements} total engagements · {muscleGroupData.length} groups
          </p>
        </div>
        <TrendingUp size={16} style={{ color: COLORS.gold }} />
      </div>

      {/* Muscle Group Cards */}
      {topMuscles.length > 0 ? (
        <div className="space-y-2">
          {topMuscles.map((muscle, idx) => {
            const engagementPct = Math.round((muscle.engagementCount / totalEngagements) * 100);
            const trendColor = muscle.trend >= 0 ? COLORS.correct : COLORS.fault;
            const trendLabel = muscle.trend >= 0 ? '+' : '';

            return (
              <motion.div
                key={muscle.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-lg border p-3 space-y-2"
                style={{
                  background: COLORS.surface,
                  borderColor: COLORS.border,
                }}
              >
                {/* Name + Score */}
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold"
                    style={{ color: COLORS.textPrimary, fontFamily: FONT.mono }}>
                    {muscle.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold"
                      style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
                      {muscle.avgScore}
                    </p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ color: trendColor, background: trendColor === COLORS.correct ? 'rgba(0,229,160,0.1)' : 'rgba(255,68,68,0.1)', fontFamily: FONT.mono }}>
                      {trendLabel}{muscle.trend}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(muscle.avgScore / 100) * 100}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.05 + 0.2 }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(to right, ${COLORS.gold}, ${COLORS.correct})` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-right w-8"
                    style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                    {engagementPct}%
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-[9px]"
                  style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                  <span>{muscle.engagementCount} engagements</span>
                  <div className="flex items-center gap-1">
                    <span>Projection: {Math.round(muscle.avgScore + (muscle.trend * 0.5))}</span>
                    <ArrowRight size={10} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center"
          style={{ color: COLORS.textTertiary }}>
          <p className="text-xs">Complete sessions to see muscle group data</p>
        </div>
      )}

      {/* All Muscle Groups Summary */}
      {muscleGroupData.length > 5 && (
        <div className="pt-2 border-t" style={{ borderColor: COLORS.border }}>
          <p className="text-[9px] mb-2"
            style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            Other engaged muscles:
          </p>
          <div className="flex flex-wrap gap-2">
            {muscleGroupData.slice(5).map(muscle => (
              <span
                key={muscle.name}
                className="px-2 py-1 rounded text-[9px] font-bold border"
                style={{
                  background: COLORS.goldDim,
                  borderColor: COLORS.goldBorder,
                  color: COLORS.gold,
                  fontFamily: FONT.mono,
                }}
              >
                {muscle.name} ({muscle.engagementCount})
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}