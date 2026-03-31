/**
 * useWorkoutNotifier — React hook that runs the schedule checker every minute.
 * Mount this once at the app root level (e.g. CoachingHub or Layout).
 */
import { useEffect } from 'react';
import { checkAndNotify } from '@/lib/workoutScheduler';

export function useWorkoutNotifier() {
  useEffect(() => {
    // Run immediately on mount
    checkAndNotify();

    // Then every 60 seconds
    const interval = setInterval(checkAndNotify, 60 * 1000);
    return () => clearInterval(interval);
  }, []);
}