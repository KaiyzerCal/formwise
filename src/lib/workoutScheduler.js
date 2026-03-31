/**
 * workoutScheduler.js
 * Manages recurring workout schedules stored in localStorage.
 * Handles Web Push permission requests and in-app notification checks.
 */

const SCHEDULES_KEY = 'bioneer_workout_schedules';
const PUSH_PERMISSION_KEY = 'bioneer_push_permission';
const LAST_NOTIFIED_KEY = 'bioneer_last_notified';

// ── Schedule CRUD ─────────────────────────────────────────────────────────────

export function getSchedules() {
  try {
    return JSON.parse(localStorage.getItem(SCHEDULES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveSchedules(schedules) {
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
}

export function addSchedule(schedule) {
  const schedules = getSchedules();
  const newSchedule = {
    id: `schedule-${Date.now()}`,
    enabled: true,
    createdAt: new Date().toISOString(),
    ...schedule,
  };
  saveSchedules([...schedules, newSchedule]);
  return newSchedule;
}

export function updateSchedule(id, updates) {
  const schedules = getSchedules();
  saveSchedules(schedules.map(s => s.id === id ? { ...s, ...updates } : s));
}

export function deleteSchedule(id) {
  saveSchedules(getSchedules().filter(s => s.id !== id));
}

// ── Push Notifications ────────────────────────────────────────────────────────

export async function requestPushPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  localStorage.setItem(PUSH_PERMISSION_KEY, result);
  return result;
}

export function getPushPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export function sendPushNotification({ title, body, exerciseId, exerciseName }) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const jumpUrl = `${window.location.origin}/?exercise=${encodeURIComponent(exerciseId)}`;

  const notification = new Notification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: `workout-${exerciseId}`,
    requireInteraction: true,
    data: { url: jumpUrl },
  });

  notification.onclick = () => {
    window.focus();
    window.location.href = jumpUrl;
    notification.close();
  };
}

// ── Schedule Matching ─────────────────────────────────────────────────────────

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Returns schedules that are due within the next `windowMinutes` minutes.
 */
export function getDueSchedules(windowMinutes = 15) {
  const schedules = getSchedules().filter(s => s.enabled);
  const now = new Date();
  const dayName = DAY_NAMES[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return schedules.filter(s => {
    if (!s.days?.includes(dayName)) return false;
    const [h, m] = (s.time || '09:00').split(':').map(Number);
    const scheduleMinutes = h * 60 + m;
    const diff = scheduleMinutes - currentMinutes;
    return diff >= 0 && diff <= windowMinutes;
  });
}

/**
 * Check for due schedules and fire browser notifications.
 * Call this once on app load and then periodically.
 */
export function checkAndNotify() {
  if (getPushPermission() !== 'granted') return;

  const due = getDueSchedules(15);
  if (!due.length) return;

  const lastNotified = JSON.parse(localStorage.getItem(LAST_NOTIFIED_KEY) || '{}');
  const now = Date.now();

  due.forEach(schedule => {
    const lastTime = lastNotified[schedule.id] || 0;
    // Debounce: don't re-notify within 30 minutes
    if (now - lastTime < 30 * 60 * 1000) return;

    sendPushNotification({
      title: `⚡ Workout in 15 min — ${schedule.exerciseName}`,
      body: `Your ${schedule.exerciseName} session is coming up. Tap to jump in now.`,
      exerciseId: schedule.exerciseId,
      exerciseName: schedule.exerciseName,
    });

    lastNotified[schedule.id] = now;
  });

  localStorage.setItem(LAST_NOTIFIED_KEY, JSON.stringify(lastNotified));
}

export { DAY_NAMES };