/**
 * Mock data for the Bioneer platform UI
 */

export const MOCK_SESSIONS = [
  { id: 's1', date: '2026-02-08', time: '07:30', exercise: 'Back Squat', exerciseId: 'back_squat', category: 'strength', reps: 8, duration: 245, score: 82, topFault: 'Knee Valgus', insights: ['ROM improved 4.2% from last session.', 'Rep quality consistent through set.'], repScores: [85, 88, 82, 80, 79, 83, 78, 82] },
  { id: 's2', date: '2026-02-12', time: '18:15', exercise: 'Deadlift', exerciseId: 'deadlift', category: 'strength', reps: 5, duration: 180, score: 76, topFault: 'Excessive Forward Lean', insights: ['Lumbar flexion detected in reps 4–5.', 'Consider reducing load.'], repScores: [84, 80, 78, 70, 65] },
  { id: 's3', date: '2026-02-15', time: '08:00', exercise: 'Back Squat', exerciseId: 'back_squat', category: 'strength', reps: 10, duration: 310, score: 88, topFault: 'Heel Rise', insights: ['Best squat session recorded.', 'Depth improved 8° from baseline.'], repScores: [90, 92, 88, 87, 85, 88, 86, 84, 82, 80] },
  { id: 's4', date: '2026-02-19', time: '17:45', exercise: 'Overhead Press', exerciseId: 'overhead_press', category: 'strength', reps: 6, duration: 150, score: 71, topFault: 'Lower Back Arch', insights: ['Brace before pressing to protect lumbar.', 'Rep tempo too fast after rep 4.'], repScores: [78, 75, 72, 70, 68, 65] },
  { id: 's5', date: '2026-02-22', time: '07:15', exercise: 'Back Squat', exerciseId: 'back_squat', category: 'strength', reps: 8, duration: 260, score: 85, topFault: 'Knee Valgus', insights: ['Knee valgus decreasing trend.', 'Concentric speed well-controlled.'], repScores: [88, 90, 86, 84, 82, 85, 80, 78] },
  { id: 's6', date: '2026-02-26', time: '18:30', exercise: 'Pull Up', exerciseId: 'pull_up', category: 'strength', reps: 7, duration: 195, score: 79, topFault: 'Asymmetric Pull', insights: ['Left side dominant — focus right lat.', 'Full ROM achieved on all reps.'], repScores: [85, 82, 80, 78, 76, 74, 72] },
  { id: 's7', date: '2026-03-02', time: '07:30', exercise: 'Back Squat', exerciseId: 'back_squat', category: 'strength', reps: 8, duration: 255, score: 62, topFault: 'Knee Valgus', insights: ['Fatigue caused form breakdown after rep 5.', 'ROM dropped 12° in final reps.'], repScores: [80, 78, 72, 68, 60, 58, 55, 55] },
  { id: 's8', date: '2026-03-08', time: '08:00', exercise: 'Back Squat', exerciseId: 'back_squat', category: 'strength', reps: 8, duration: 250, score: 87, topFault: 'Heel Rise', insights: ['ROM improved 12.4% over 8 sessions.', 'Rep quality drops after rep 6 — fatigue signal detected.'], repScores: [92, 90, 88, 86, 85, 82, 80, 78] },
];

export const MOCK_ROM_TREND = [
  { session: 'Feb 8', rom: 95 },
  { session: 'Feb 12', rom: 92 },
  { session: 'Feb 15', rom: 98 },
  { session: 'Feb 19', rom: 96 },
  { session: 'Feb 22', rom: 100 },
  { session: 'Feb 26', rom: 97 },
  { session: 'Mar 2', rom: 102 },
  { session: 'Mar 8', rom: 107 },
];

export const MOCK_FAULT_FREQ = [
  { fault: 'Knee Valgus', pct: 67 },
  { fault: 'Forward Lean', pct: 40 },
  { fault: 'Heel Rise', pct: 28 },
  { fault: 'Lower Back Arch', pct: 22 },
  { fault: 'Asymmetric Push', pct: 15 },
  { fault: 'Hip Shift', pct: 10 },
];

export const MOCK_INSIGHTS = [
  { text: 'ROM improved 12.4% over your tracked sessions.', type: 'improvement' },
  { text: 'Rep quality drops after rep 6 — fatigue signal detected.', type: 'warning' },
  { text: 'Knee valgus occurs in 67% of reps — your #1 priority.', type: 'fault' },
  { text: 'Concentric tempo improved — more controlled ascents.', type: 'improvement' },
  { text: 'Ankle mobility limiting squat depth below parallel.', type: 'warning' },
];

export const MOCK_SYMMETRY = [
  { rep: 1, score: 92 }, { rep: 2, score: 90 }, { rep: 3, score: 88 },
  { rep: 4, score: 85 }, { rep: 5, score: 83 }, { rep: 6, score: 80 },
  { rep: 7, score: 78 }, { rep: 8, score: 76 },
];

export const MOCK_BODY_HEATMAP = [
  { joint: 'Left Knee', region: 'knee_l', severity: 'red', pct: 67 },
  { joint: 'Right Knee', region: 'knee_r', severity: 'red', pct: 62 },
  { joint: 'Lower Back', region: 'lower_back', severity: 'amber', pct: 40 },
  { joint: 'Left Ankle', region: 'ankle_l', severity: 'amber', pct: 28 },
  { joint: 'Right Ankle', region: 'ankle_r', severity: 'green', pct: 12 },
  { joint: 'Left Hip', region: 'hip_l', severity: 'green', pct: 10 },
  { joint: 'Right Hip', region: 'hip_r', severity: 'green', pct: 8 },
  { joint: 'Left Shoulder', region: 'shoulder_l', severity: 'green', pct: 5 },
  { joint: 'Right Shoulder', region: 'shoulder_r', severity: 'green', pct: 4 },
];

export const FEATURED_MOVEMENTS = [
  'back_squat', 'front_squat', 'goblet_squat', 'deadlift', 'sumo_deadlift',
  'romanian_deadlift', 'bench_press', 'overhead_press', 'pull_up', 'bent_over_row',
  'bulgarian_split_squat', 'hip_thrust', 'push_up', 'sprint_acceleration',
  'baseball_swing', 'golf_swing', 'soccer_kick', 'vertical_jump', 'tennis_forehand',
  'power_clean'
];

// Simulated live session data
export const COACHING_CUES = [
  { text: 'Drive knees out — push them over your pinky toes', severity: 'error' },
  { text: 'Chest up — maintain upright torso position', severity: 'warning' },
  { text: 'Go deeper — break parallel at the hip crease', severity: 'warning' },
  { text: 'Brace your core — inhale and lock before descent', severity: 'error' },
  { text: 'Great depth — solid bottom position', severity: 'clean' },
  { text: 'Heels down — maintain full foot contact', severity: 'warning' },
];

export const PHASE_SEQUENCE = ['Setup', 'Descent', 'Bottom', 'Ascent', 'Lockout'];

export const LIVE_MOVEMENTS = [
  'Back Squat', 'Deadlift', 'Bench Press', 'Overhead Press', 'Pull Up',
  'Lunge', 'Bulgarian Split Squat', 'Hip Thrust', 'Push Up', 'Sprint Stride'
];

export const JOINT_DEVIATIONS = [
  { joint: 'Knee', deviation: 8, ideal: 95 },
  { joint: 'Hip', deviation: 14, ideal: 105 },
  { joint: 'Shoulder', deviation: 5, ideal: 170 },
  { joint: 'Ankle', deviation: 22, ideal: 85 },
];