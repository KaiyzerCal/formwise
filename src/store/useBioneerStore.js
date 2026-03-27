/**
 * useBioneerStore — Global Zustand state for Bioneer
 * Separates high-frequency pose updates from low-frequency session state
 * to prevent unnecessary re-renders.
 */

import { create } from 'zustand';

// ── High-frequency pose slice (kept minimal — no raw frames) ──────────────────
const poseSlice = (set) => ({
  jointAngles: {},
  repCount: 0,
  currentPhase: null,
  feedbackState: 'green',   // 'green' | 'yellow' | 'red'
  activeAlerts: [],

  setPoseData: (jointAngles, repCount, currentPhase) =>
    set({ jointAngles, repCount, currentPhase }),

  setFeedbackState: (feedbackState) => set({ feedbackState }),
  setActiveAlerts: (activeAlerts) => set({ activeAlerts }),
});

// ── Session / scoring slice (lower frequency) ─────────────────────────────────
const sessionSlice = (set, get) => ({
  repScores: [],
  sessionScore: 0,
  aiFeedback: null,         // { liveCue, postSetSummary, nextFocus }
  streakData: { current: 0, best: 0 },
  xp: 0,
  level: 1,

  addRepScore: (score) => {
    const scores = [...get().repScores, score];
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    set({ repScores: scores, sessionScore: avg });
  },

  setAiFeedback: (aiFeedback) => set({ aiFeedback }),

  setStreakData: (streakData) => set({ streakData }),

  addXp: (amount) => {
    const newXp = get().xp + amount;
    const newLevel = Math.floor(newXp / 500) + 1;
    set({ xp: newXp, level: newLevel });
  },

  resetSession: () => set({
    repScores: [],
    sessionScore: 0,
    activeAlerts: [],
    feedbackState: 'green',
    repCount: 0,
    currentPhase: null,
    aiFeedback: null,
    jointAngles: {},
  }),
});

const useBioneerStore = create((set, get) => ({
  ...poseSlice(set),
  ...sessionSlice(set, get),
}));

export default useBioneerStore;