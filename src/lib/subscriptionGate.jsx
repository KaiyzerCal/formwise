/**
 * subscriptionGate.jsx
 * Freemium subscription logic hook.
 */
import { useAuth } from '@/lib/AuthContext';

const FREE_SESSION_LIMIT = 3;
const WEEK_KEY = 'bioneer_weekly_sessions';

function getWeeklySessionsRemaining() {
  try {
    const raw = localStorage.getItem(WEEK_KEY);
    if (!raw) return FREE_SESSION_LIMIT;
    const { count, weekStart } = JSON.parse(raw);
    const now = new Date();
    const start = new Date(weekStart);
    // Reset if it's a new week (Sunday boundary)
    const diffDays = (now - start) / (1000 * 60 * 60 * 24);
    if (diffDays >= 7) return FREE_SESSION_LIMIT;
    return Math.max(0, FREE_SESSION_LIMIT - (count || 0));
  } catch { return FREE_SESSION_LIMIT; }
}

export function incrementWeeklySession() {
  try {
    const raw = localStorage.getItem(WEEK_KEY);
    let count = 0;
    let weekStart = new Date().toISOString();
    if (raw) {
      const parsed = JSON.parse(raw);
      const start = new Date(parsed.weekStart);
      const diffDays = (new Date() - start) / (1000 * 60 * 60 * 24);
      if (diffDays < 7) {
        count = parsed.count || 0;
        weekStart = parsed.weekStart;
      }
    }
    localStorage.setItem(WEEK_KEY, JSON.stringify({ count: count + 1, weekStart }));
  } catch { /* ignore */ }
}

export function useSubscription() {
  const { user } = useAuth();
  const tier = user?.subscription_tier || 'free';

  return {
    tier,
    isPro:    tier === 'pro'  || tier === 'elite',
    isElite:  tier === 'elite',
    canUseAI: tier !== 'free',
    canUseCompare: tier !== 'free',
    weeklySessionsRemaining: tier === 'free' ? getWeeklySessionsRemaining() : Infinity,
  };
}