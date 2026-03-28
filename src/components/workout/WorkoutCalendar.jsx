/**
 * WorkoutCalendar — Monthly calendar view showing scheduled workout sessions
 * Based on active plans' frequency_per_week, shows upcoming sessions and lets
 * users click a day to log progress for that session.
 */

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Dumbbell, Plus } from 'lucide-react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Given a plan with frequency_per_week and started_at, compute which dates
 * in the given month have scheduled sessions.
 * Strategy: distribute sessions evenly across the week starting from started_at day.
 */
function getScheduledDatesForPlan(plan, year, month) {
  if (!plan.started_at || plan.status === 'completed') return [];

  const start = new Date(plan.started_at);
  const endWeeks = new Date(start);
  endWeeks.setDate(start.getDate() + plan.duration_weeks * 7);

  const freq = plan.frequency_per_week || 3;
  // Spread workout days evenly across the week
  const spacing = Math.round(7 / freq);
  const startDayOfWeek = start.getDay(); // 0–6

  // Collect the days-of-week that are workout days
  const workoutDaysOfWeek = [];
  for (let i = 0; i < freq; i++) {
    workoutDaysOfWeek.push((startDayOfWeek + i * spacing) % 7);
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const scheduledDates = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dayOfWeek = date.getDay();
    if (
      workoutDaysOfWeek.includes(dayOfWeek) &&
      date >= start &&
      date <= endWeeks
    ) {
      scheduledDates.push(d);
    }
  }
  return scheduledDates;
}

export default function WorkoutCalendar({ plans, onLogProgress }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  const activePlans = plans.filter(p => p.status === 'active' || p.status === 'paused');

  // Map: day number → list of plans scheduled that day
  const calendarData = useMemo(() => {
    const map = {};
    activePlans.forEach(plan => {
      const dates = getScheduledDatesForPlan(plan, viewYear, viewMonth);
      dates.forEach(d => {
        if (!map[d]) map[d] = [];
        map[d].push(plan);
      });
    });
    return map;
  }, [plans, viewYear, viewMonth]);

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v + 1); }
    else setViewMonth(m => m + 1);
  };

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  const isToday = (d) => d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
  const isPast = (d) => new Date(viewYear, viewMonth, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const selectedPlans = selectedDay ? (calendarData[selectedDay] || []) : [];

  // Build grid cells: empty prefix cells + day cells
  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ fontFamily: FONT.mono }}>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded hover:bg-white/10 transition"
        >
          <ChevronLeft size={14} style={{ color: COLORS.textSecondary }} />
        </button>
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: COLORS.gold }}>
          {monthLabel}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded hover:bg-white/10 transition"
        >
          <ChevronRight size={14} style={{ color: COLORS.textSecondary }} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(day => (
          <div key={day} className="text-center text-[8px] tracking-[0.1em] py-1" style={{ color: COLORS.textTertiary }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const plansOnDay = calendarData[day] || [];
          const hasSession = plansOnDay.length > 0;
          const past = isPast(day);
          const todayCell = isToday(day);
          const selected = selectedDay === day;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(selected ? null : day)}
              className="relative flex flex-col items-center justify-start rounded transition-all"
              style={{
                minHeight: '52px',
                padding: '5px 2px 4px',
                background: selected
                  ? COLORS.goldDim
                  : todayCell
                  ? 'rgba(255,255,255,0.06)'
                  : 'transparent',
                border: `1px solid ${
                  selected
                    ? COLORS.goldBorder
                    : todayCell
                    ? 'rgba(255,255,255,0.15)'
                    : COLORS.border
                }`,
              }}
            >
              {/* Day number */}
              <span
                className="text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full"
                style={{
                  color: todayCell ? COLORS.gold : past ? COLORS.textMuted : COLORS.textSecondary,
                  background: todayCell ? COLORS.goldDim : 'transparent',
                }}
              >
                {day}
              </span>

              {/* Session dots */}
              {hasSession && (
                <div className="flex flex-wrap gap-0.5 justify-center mt-1 max-w-full">
                  {plansOnDay.slice(0, 3).map((p, i) => (
                    <span
                      key={i}
                      className="rounded-full"
                      style={{
                        width: 5,
                        height: 5,
                        background: past ? COLORS.textMuted : COLORS.gold,
                        opacity: past ? 0.5 : 1,
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Day Detail Panel */}
      {selectedDay && (
        <div
          className="mt-4 rounded-lg border p-4"
          style={{ background: COLORS.surface, borderColor: COLORS.border }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] font-bold tracking-[0.12em] uppercase" style={{ color: COLORS.gold }}>
              {new Date(viewYear, viewMonth, selectedDay).toLocaleDateString('default', {
                weekday: 'long', month: 'short', day: 'numeric'
              })}
            </h3>
            {isPast(selectedDay) && (
              <span className="text-[8px] px-2 py-0.5 rounded" style={{ background: COLORS.surfaceHover, color: COLORS.textTertiary }}>
                Past
              </span>
            )}
          </div>

          {selectedPlans.length === 0 ? (
            <p className="text-[9px]" style={{ color: COLORS.textTertiary }}>
              No workouts scheduled for this day.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedPlans.map(plan => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded border"
                  style={{ background: COLORS.bg, borderColor: COLORS.border }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Dumbbell size={12} style={{ color: COLORS.gold, flexShrink: 0 }} />
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold truncate" style={{ color: COLORS.textPrimary }}>
                        {plan.name}
                      </p>
                      <p className="text-[8px]" style={{ color: COLORS.textTertiary }}>
                        {plan.exercises?.length || 0} exercises · {plan.goal}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onLogProgress(plan)}
                    className="ml-3 flex items-center gap-1 px-2.5 py-1.5 rounded text-[8px] font-bold tracking-[0.08em] uppercase transition hover:opacity-90 flex-shrink-0"
                    style={{ background: COLORS.goldDim, border: `1px solid ${COLORS.goldBorder}`, color: COLORS.gold }}
                  >
                    <Plus size={10} />
                    Log
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="rounded-full" style={{ width: 6, height: 6, background: COLORS.gold, display: 'inline-block' }} />
          <span className="text-[8px]" style={{ color: COLORS.textTertiary }}>Scheduled session</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full" style={{ width: 6, height: 6, background: COLORS.textMuted, display: 'inline-block' }} />
          <span className="text-[8px]" style={{ color: COLORS.textTertiary }}>Past session</span>
        </div>
      </div>
    </div>
  );
}