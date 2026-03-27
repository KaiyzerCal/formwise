import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { getAllSessions } from "../data/unifiedSessionStore";
import { COLORS, FONT } from "../ui/DesignTokens";
import { getExerciseById } from "../exerciseLibrary";
import { getSportsMovementById } from "../sportsLibrary";

const EXERCISE_CATEGORIES = {
  strength: 'Strength',
  sports: 'Sports',
  athletic: 'Athletic',
  rotational: 'Rotational',
  locomotion: 'Locomotion',
};

export default function FaultCategoryBreakdown() {
  const categoryFaults = useMemo(() => {
    const sessions = getAllSessions();
    if (!sessions.length) return [];

    const categoryMap = {};

    sessions.forEach(session => {
      const exId = session.exercise_id || session.movement_id;
      if (!exId) return;

      // Get category from exercise or sports library
      const exercise = getExerciseById(exId) || getSportsMovementById(exId);
      const category = exercise?.category || session.category || 'unknown';

      if (!categoryMap[category]) {
        categoryMap[category] = {
          category: EXERCISE_CATEGORIES[category] || category,
          faults: {},
          sessions: 0,
        };
      }

      categoryMap[category].sessions += 1;

      // Aggregate faults from top_faults array
      const topFaults = session.top_faults || [];
      topFaults.forEach(fault => {
        categoryMap[category].faults[fault] = (categoryMap[category].faults[fault] || 0) + 1;
      });
    });

    // Transform to chart format
    return Object.values(categoryMap)
      .map(cat => ({
        category: cat.category,
        faultCount: Object.values(cat.faults).reduce((a, b) => a + b, 0),
        avgFaultPerSession: Math.round((Object.values(cat.faults).reduce((a, b) => a + b, 0) / cat.sessions) * 10) / 10,
        topFault: Object.entries(cat.faults).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A',
      }))
      .sort((a, b) => b.faultCount - a.faultCount);
  }, []);

  const totalFaults = useMemo(() => {
    return categoryFaults.reduce((sum, cat) => sum + cat.faultCount, 0);
  }, [categoryFaults]);

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
      <div>
        <h3 className="text-xs font-bold tracking-[0.15em] uppercase"
          style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
          Fault Distribution by Category
        </h3>
        <p className="text-[9px] mt-1"
          style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          {totalFaults} total faults across {categoryFaults.length} categories
        </p>
      </div>

      {/* Chart */}
      {categoryFaults.length > 0 ? (
        <div className="h-64 -mx-4 lg:-mx-5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryFaults} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis
                dataKey="category"
                tick={{ fill: COLORS.textTertiary, fontSize: 10 }}
                stroke={COLORS.border}
              />
              <YAxis
                tick={{ fill: COLORS.textTertiary, fontSize: 10 }}
                stroke={COLORS.border}
              />
              <Tooltip
                contentStyle={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                }}
                labelStyle={{ color: COLORS.gold }}
              />
              <Bar
                dataKey="faultCount"
                fill={COLORS.gold}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center"
          style={{ color: COLORS.textTertiary }}>
          <p className="text-xs">No fault data yet</p>
        </div>
      )}

      {/* Category Breakdown List */}
      {categoryFaults.length > 0 && (
        <div className="space-y-2 pt-2 border-t" style={{ borderColor: COLORS.border }}>
          {categoryFaults.map((cat, idx) => (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between p-2 rounded border"
              style={{
                background: COLORS.surface,
                borderColor: COLORS.border,
              }}
            >
              <div className="flex-1">
                <p className="text-xs font-bold"
                  style={{ color: COLORS.textPrimary, fontFamily: FONT.mono }}>
                  {cat.category}
                </p>
                <p className="text-[9px]"
                  style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                  Most common: {cat.topFault.replace(/_/g, ' ')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold"
                  style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
                  {cat.faultCount}
                </p>
                <p className="text-[9px]"
                  style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
                  {cat.avgFaultPerSession}/session avg
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}