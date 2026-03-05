// Rep detection logic

const DEBOUNCE_MS = 800;

export function createRepCounter(config) {
  let state = "UP"; // UP or DOWN
  let count = 0;
  let lastRepTime = 0;

  return {
    update(angle) {
      if (angle === null) return count;
      const now = Date.now();

      if (state === "UP" && angle < config.downThreshold) {
        state = "DOWN";
      } else if (state === "DOWN" && angle > config.upThreshold) {
        if (now - lastRepTime > DEBOUNCE_MS) {
          count++;
          lastRepTime = now;
        }
        state = "UP";
      }

      return count;
    },
    getCount() {
      return count;
    },
    reset() {
      state = "UP";
      count = 0;
      lastRepTime = 0;
    },
  };
}