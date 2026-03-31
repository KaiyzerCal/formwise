/**
 * WorkoutReminderBanner — in-app banner shown when a scheduled workout is due soon.
 * Renders as a dismissible top strip with a "Jump to Workout" link.
 */
import React, { useState, useEffect } from 'react';
import { Zap, X } from 'lucide-react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
import { getDueSchedules } from '@/lib/workoutScheduler';

export default function WorkoutReminderBanner() {
  const [due, setDue] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const check = () => setDue(getDueSchedules(15));
    check();
    const interval = setInterval(check, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!due.length || dismissed) return null;

  const next = due[0];

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between gap-3 px-4 py-2.5 border-b"
      style={{
        background: `${COLORS.gold}15`,
        borderColor: COLORS.goldBorder,
        backdropFilter: 'blur(12px)',
        fontFamily: FONT.mono,
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Zap size={13} style={{ color: COLORS.gold, flexShrink: 0 }} />
        <p className="text-[9px] font-bold tracking-[0.1em] uppercase truncate" style={{ color: COLORS.gold }}>
          {next.exerciseName} in ~15 min
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <a
          href={`/?exercise=${encodeURIComponent(next.exerciseId)}`}
          className="px-3 py-1 rounded border text-[8px] font-bold tracking-[0.1em] uppercase transition hover:opacity-80"
          style={{ borderColor: COLORS.goldBorder, color: COLORS.gold, background: COLORS.goldDim }}
        >
          Jump to Workout
        </a>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss reminder"
          className="p-1 rounded transition hover:opacity-60"
          style={{ color: COLORS.textTertiary }}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}