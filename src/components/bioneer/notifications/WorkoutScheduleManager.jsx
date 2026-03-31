/**
 * WorkoutScheduleManager — UI for creating and managing recurring workout schedules.
 * Shown inside Settings under a "Workout Reminders" section.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Bell, BellOff, Zap } from 'lucide-react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
import {
  getSchedules, addSchedule, updateSchedule, deleteSchedule,
  requestPushPermission, getPushPermission, DAY_NAMES,
} from '@/lib/workoutScheduler';
import { EXERCISES } from '@/components/bioneer/exerciseLibrary';

const ALL_DAYS = DAY_NAMES;

function DayPill({ day, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 rounded text-[8px] font-bold tracking-[0.1em] uppercase transition"
      style={{
        background: selected ? COLORS.goldDim : COLORS.bg,
        border: `1px solid ${selected ? COLORS.goldBorder : COLORS.border}`,
        color: selected ? COLORS.gold : COLORS.textTertiary,
        fontFamily: FONT.mono,
      }}
    >
      {day.slice(0, 3)}
    </button>
  );
}

function ScheduleRow({ schedule, onToggle, onDelete }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border"
      style={{ background: COLORS.bg, borderColor: schedule.enabled ? COLORS.goldBorder : COLORS.border }}
    >
      {/* Enable toggle dot */}
      <button
        onClick={() => onToggle(schedule.id, !schedule.enabled)}
        className="w-3 h-3 rounded-full flex-shrink-0 transition"
        style={{ background: schedule.enabled ? COLORS.gold : COLORS.textMuted }}
        aria-label={schedule.enabled ? 'Disable schedule' : 'Enable schedule'}
      />

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold truncate" style={{ color: COLORS.textPrimary, fontFamily: FONT.mono }}>
          {schedule.exerciseName}
        </p>
        <p className="text-[8px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          {schedule.days?.join(', ')} · {schedule.time}
        </p>
      </div>

      {/* Jump link */}
      <a
        href={`/?exercise=${encodeURIComponent(schedule.exerciseId)}`}
        className="px-2 py-1 rounded border text-[8px] font-bold tracking-[0.08em] uppercase flex-shrink-0 transition hover:opacity-80"
        style={{ background: COLORS.goldDim, borderColor: COLORS.goldBorder, color: COLORS.gold, fontFamily: FONT.mono }}
      >
        <Zap size={9} className="inline mr-1" />
        Start
      </a>

      <button
        onClick={() => onDelete(schedule.id)}
        className="p-1.5 rounded transition hover:opacity-70 flex-shrink-0"
        style={{ color: COLORS.textTertiary }}
        aria-label="Delete schedule"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

export default function WorkoutScheduleManager() {
  const [schedules, setSchedules] = useState([]);
  const [permission, setPermission] = useState('default');
  const [showForm, setShowForm] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(false);

  // New schedule form state
  const [selectedExerciseId, setSelectedExerciseId] = useState(EXERCISES[0]?.id || '');
  const [selectedDays, setSelectedDays] = useState(['Monday', 'Wednesday', 'Friday']);
  const [selectedTime, setSelectedTime] = useState('08:00');

  const refresh = useCallback(() => {
    setSchedules(getSchedules());
    setPermission(getPushPermission());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleRequestPermission = async () => {
    setPermissionLoading(true);
    const result = await requestPushPermission();
    setPermission(result);
    setPermissionLoading(false);
  };

  const handleToggleDay = (day) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleAddSchedule = () => {
    if (!selectedDays.length || !selectedExerciseId) return;
    const exercise = EXERCISES.find(e => e.id === selectedExerciseId);
    addSchedule({
      exerciseId: selectedExerciseId,
      exerciseName: exercise?.displayName || exercise?.name || selectedExerciseId,
      days: selectedDays,
      time: selectedTime,
    });
    setShowForm(false);
    refresh();
  };

  const handleToggle = (id, enabled) => {
    updateSchedule(id, { enabled });
    refresh();
  };

  const handleDelete = (id) => {
    deleteSchedule(id);
    refresh();
  };

  return (
    <div className="space-y-4">
      {/* Push permission banner */}
      {permission !== 'granted' && (
        <div
          className="flex items-center justify-between gap-3 px-3 py-3 rounded-lg border"
          style={{ background: `${COLORS.gold}10`, borderColor: COLORS.goldBorder }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {permission === 'denied'
              ? <BellOff size={14} style={{ color: COLORS.warning, flexShrink: 0 }} />
              : <Bell size={14} style={{ color: COLORS.gold, flexShrink: 0 }} />
            }
            <p className="text-[9px] leading-relaxed" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
              {permission === 'denied'
                ? 'Notifications blocked. Enable in browser site settings.'
                : permission === 'unsupported'
                ? 'Push notifications not supported in this browser.'
                : 'Allow notifications to receive workout reminders.'}
            </p>
          </div>
          {permission === 'default' && (
            <button
              onClick={handleRequestPermission}
              disabled={permissionLoading}
              className="px-3 py-1.5 rounded border text-[8px] font-bold tracking-[0.1em] uppercase flex-shrink-0 transition"
              style={{
                borderColor: COLORS.goldBorder,
                color: COLORS.gold,
                background: COLORS.goldDim,
                fontFamily: FONT.mono,
              }}
            >
              {permissionLoading ? '...' : 'Enable'}
            </button>
          )}
        </div>
      )}

      {/* Existing schedules */}
      {schedules.length > 0 && (
        <div className="space-y-2">
          {schedules.map(s => (
            <ScheduleRow
              key={s.id}
              schedule={s}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {schedules.length === 0 && !showForm && (
        <p className="text-[9px] text-center py-3" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          No reminders set. Add one below.
        </p>
      )}

      {/* Add schedule form */}
      {showForm && (
        <div
          className="rounded-lg border p-4 space-y-4"
          style={{ background: COLORS.surface, borderColor: COLORS.border }}
        >
          {/* Exercise picker */}
          <div className="space-y-1.5">
            <label className="text-[9px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
              Exercise
            </label>
            <select
              value={selectedExerciseId}
              onChange={e => setSelectedExerciseId(e.target.value)}
              className="w-full px-2 py-2 rounded border text-[10px] outline-none"
              style={{ background: COLORS.bg, borderColor: COLORS.border, color: COLORS.textPrimary, fontFamily: FONT.mono }}
            >
              {EXERCISES.map(ex => (
                <option key={ex.id} value={ex.id}>
                  {ex.displayName || ex.name}
                </option>
              ))}
            </select>
          </div>

          {/* Days */}
          <div className="space-y-1.5">
            <label className="text-[9px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
              Days
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_DAYS.map(day => (
                <DayPill
                  key={day}
                  day={day}
                  selected={selectedDays.includes(day)}
                  onClick={() => handleToggleDay(day)}
                />
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="space-y-1.5">
            <label className="text-[9px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
              Reminder time
            </label>
            <input
              type="time"
              value={selectedTime}
              onChange={e => setSelectedTime(e.target.value)}
              className="px-2 py-2 rounded border text-[10px] outline-none"
              style={{ background: COLORS.bg, borderColor: COLORS.border, color: COLORS.textPrimary, fontFamily: FONT.mono }}
            />
            <p className="text-[8px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
              Notification fires 15 min before this time
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleAddSchedule}
              disabled={!selectedDays.length}
              className="flex-1 py-2.5 rounded border text-[10px] font-bold tracking-[0.1em] uppercase transition"
              style={{
                borderColor: COLORS.goldBorder,
                color: COLORS.gold,
                background: COLORS.goldDim,
                fontFamily: FONT.mono,
                opacity: selectedDays.length ? 1 : 0.4,
              }}
            >
              Save Reminder
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded border text-[10px] font-bold tracking-[0.1em] uppercase"
              style={{ borderColor: COLORS.border, color: COLORS.textTertiary, fontFamily: FONT.mono }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-2.5 rounded border text-[10px] font-bold tracking-[0.1em] uppercase flex items-center justify-center gap-2 transition hover:opacity-80"
          style={{ borderColor: COLORS.border, color: COLORS.textSecondary, fontFamily: FONT.mono }}
        >
          <Plus size={12} />
          Add Reminder
        </button>
      )}
    </div>
  );
}