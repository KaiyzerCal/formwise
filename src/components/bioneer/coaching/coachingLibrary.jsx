/**
 * coachingLibrary.js
 * 
 * Exercise-specific coaching cues.
 * Human language, not data dumps.
 * 
 * EXAMPLES:
 * ✓ "Drive your hips back"
 * ✗ "Hip flexion angle exceeds 120 degrees"
 * 
 * ✓ "Keep your knee over your toes"
 * ✗ "Knee valgus detected at 38 degrees"
 */

export const COACHING_LIBRARY = {
  // SQUAT
  squat: {
    knee: {
      message: "Keep your knee over your toes",
      reinforcement: "Nice — knees are tracking well",
      threshold: 90,
      duration: 3,
    },
    hip: {
      message: "Drive your hips back more",
      reinforcement: "Good depth — hips are tracking down",
      threshold: 90,
      duration: 3,
    },
    back: {
      message: "Keep your chest up",
      reinforcement: "Nice neutral spine",
      threshold: 85,
      duration: 2,
    },
    ankle: {
      message: "Keep weight in your heels",
      reinforcement: "Heels are staying planted",
      threshold: 80,
      duration: 2,
    },
  },

  // DEADLIFT
  deadlift: {
    back: {
      message: "Keep your back straight",
      reinforcement: "Great neutral spine",
      threshold: 85,
      duration: 3,
    },
    hip: {
      message: "Start with your hips higher",
      reinforcement: "Perfect hip position",
      threshold: 95,
      duration: 3,
    },
    knee: {
      message: "Keep the bar close to your body",
      reinforcement: "Bar path is looking solid",
      threshold: 90,
      duration: 2,
    },
    shoulder: {
      message: "Shoulders over the bar at the start",
      reinforcement: "Good starting position",
      threshold: 85,
      duration: 2,
    },
  },

  // BENCH PRESS
  bench_press: {
    shoulder: {
      message: "Keep your shoulders packed",
      reinforcement: "Nice scapular stability",
      threshold: 80,
      duration: 2,
    },
    elbow: {
      message: "Elbows at 45 degrees",
      reinforcement: "Good elbow position",
      threshold: 85,
      duration: 2,
    },
    back: {
      message: "Keep tension in your back",
      reinforcement: "Good upper back engagement",
      threshold: 80,
      duration: 2,
    },
  },

  // GOLF SWING
  golf_swing: {
    spine: {
      message: "Maintain your spine angle",
      reinforcement: "Great spine angle through impact",
      threshold: 90,
      duration: 2,
    },
    shoulder: {
      message: "Rotate from your core",
      reinforcement: "Solid shoulder rotation",
      threshold: 85,
      duration: 2,
    },
    hip: {
      message: "Engage your hips",
      reinforcement: "Nice hip drive",
      threshold: 80,
      duration: 2,
    },
    elbow: {
      message: "Keep your lead elbow in",
      reinforcement: "Good arm path",
      threshold: 75,
      duration: 2,
    },
  },

  // DEFAULT / FALLBACK
  default: {
    knee: {
      message: "Focus on your knee alignment",
      reinforcement: "Knees looking good",
      threshold: 90,
      duration: 2,
    },
    hip: {
      message: "Check your hip position",
      reinforcement: "Hip alignment is solid",
      threshold: 90,
      duration: 2,
    },
    back: {
      message: "Keep a neutral spine",
      reinforcement: "Nice spinal control",
      threshold: 85,
      duration: 2,
    },
    shoulder: {
      message: "Stabilize your shoulder",
      reinforcement: "Good shoulder control",
      threshold: 80,
      duration: 2,
    },
    ankle: {
      message: "Check your ankle position",
      reinforcement: "Ankle stability is solid",
      threshold: 80,
      duration: 2,
    },
    elbow: {
      message: "Adjust your elbow position",
      reinforcement: "Elbow position is good",
      threshold: 85,
      duration: 2,
    },
  },
};

/**
 * Get coaching cue for a specific exercise + fault
 */
export function getCoachingCue(exerciseId, faultName, previousMessage = null) {
  const exerciseLib = COACHING_LIBRARY[exerciseId] || COACHING_LIBRARY.default;
  const cue = exerciseLib[faultName.toLowerCase()];

  if (!cue) return null;

  // Vary language if same cue was just delivered
  if (previousMessage === cue.message && cue.variation) {
    return cue.variation;
  }

  return cue;
}

/**
 * Get all coaching cues for an exercise (for UI reference)
 */
export function getExerciseCoachingCues(exerciseId) {
  return COACHING_LIBRARY[exerciseId] || COACHING_LIBRARY.default;
}