// Rep detection logic with per-user anthropometric calibration

const DEBOUNCE_MS = 800;
const CALIBRATION_STORAGE_KEY = 'bioneer_rep_calibration';

function loadCalibration(exerciseId) {
  try {
    const stored = JSON.parse(localStorage.getItem(CALIBRATION_STORAGE_KEY) || '{}');
    return stored[exerciseId] ?? null;
  } catch { return null; }
}

function saveCalibration(exerciseId, data) {
  try {
    const stored = JSON.parse(localStorage.getItem(CALIBRATION_STORAGE_KEY) || '{}');
    stored[exerciseId] = data;
    localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(stored));
  } catch { /* ignore */ }
}

export function createRepCounter(config) {
  const exerciseId = config.exerciseId || config.id || 'unknown';

  // Try loading previously saved calibration for this exercise
  const savedCal = loadCalibration(exerciseId);

  let state = "UP";
  let count = 0;
  let lastRepTime = 0;

  // Calibration state
  let calibrating = !savedCal;
  let calibrationReps = 0;
  let trackedMinAngle = Infinity;
  let trackedMaxAngle = -Infinity;

  // Active thresholds (may be overridden after calibration)
  let downThreshold = savedCal ? savedCal.downThreshold : config.downThreshold;
  let upThreshold   = savedCal ? savedCal.upThreshold   : config.upThreshold;

  return {
    isCalibrating() {
      return calibrating;
    },

    getCalibrationRepsRemaining() {
      return Math.max(0, 2 - calibrationReps);
    },

    update(angle) {
      if (angle === null || angle === undefined) return count;
      const now = Date.now();

      // Track range of motion for calibration
      if (calibrating) {
        if (angle < trackedMinAngle) trackedMinAngle = angle;
        if (angle > trackedMaxAngle) trackedMaxAngle = angle;
      }

      if (state === "UP" && angle < downThreshold) {
        state = "DOWN";
      } else if (state === "DOWN" && angle > upThreshold) {
        if (now - lastRepTime > DEBOUNCE_MS) {
          count++;
          lastRepTime = now;

          // Calibration phase: track first 2 reps
          if (calibrating) {
            calibrationReps++;
            if (calibrationReps >= 2 && trackedMinAngle < Infinity && trackedMaxAngle > -Infinity) {
              // Derive thresholds with small buffer
              const newDown = trackedMinAngle + 5;
              const newUp   = trackedMaxAngle - 5;

              // Only apply if the derived range is sensible
              if (newUp > newDown + 10) {
                downThreshold = newDown;
                upThreshold   = newUp;
                saveCalibration(exerciseId, { downThreshold, upThreshold });
              }
              calibrating = false;
            }
          }
        }
        state = "UP";
      }

      return count;
    },

    getCount() { return count; },

    reset() {
      state = "UP";
      count = 0;
      lastRepTime = 0;
      calibrating = !savedCal;
      calibrationReps = 0;
      trackedMinAngle = Infinity;
      trackedMaxAngle = -Infinity;
      downThreshold = savedCal ? savedCal.downThreshold : config.downThreshold;
      upThreshold   = savedCal ? savedCal.upThreshold   : config.upThreshold;
    },
  };
}

// Clear calibration for a specific exercise (or all)
export function clearRepCalibration(exerciseId) {
  try {
    if (exerciseId) {
      const stored = JSON.parse(localStorage.getItem(CALIBRATION_STORAGE_KEY) || '{}');
      delete stored[exerciseId];
      localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(stored));
    } else {
      localStorage.removeItem(CALIBRATION_STORAGE_KEY);
    }
  } catch { /* ignore */ }
}