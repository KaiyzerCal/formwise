/**
 * Movement Profiles Database
 * Defines biomechanical rules, joint ranges, and rep detection logic for each exercise.
 * Integrates directly with the scoring engine.
 */

export const MOVEMENT_PROFILES = {
  squat: {
    id: "squat",
    name: "Barbell Squat",
    movementType: "strength",
    primaryJoints: ["hip", "knee", "ankle"],
    phases: ["start", "eccentric", "bottom", "concentric", "lockout"],
    
    jointRanges: {
      knee: {
        ideal: [70, 110],
        warning: [60, 120],
        danger: [50, 130]
      },
      hip: {
        ideal: [60, 120],
        warning: [50, 130],
        danger: [40, 140]
      },
      ankle: {
        ideal: [80, 110],
        warning: [70, 120],
        danger: [60, 130]
      }
    },
    
    faults: [
      "knee_valgus",
      "forward_torso",
      "hip_shift",
      "insufficient_depth",
      "heel_lift"
    ],
    
    repLogic: {
      startAngle: 170,
      bottomAngle: 70
    }
  },

  benchpress: {
    id: "benchpress",
    name: "Bench Press",
    movementType: "strength",
    primaryJoints: ["shoulder", "elbow", "wrist"],
    phases: ["start", "descent", "bottom", "ascent", "lockout"],
    
    jointRanges: {
      elbow: {
        ideal: [75, 95],
        warning: [70, 100],
        danger: [60, 110]
      },
      shoulder: {
        ideal: [40, 80],
        warning: [30, 90],
        danger: [20, 100]
      },
      wrist: {
        ideal: [165, 180],
        warning: [155, 180],
        danger: [145, 180]
      }
    },
    
    faults: [
      "uneven_arm_path",
      "excessive_arch",
      "wrist_deviation",
      "elbow_flare",
      "bar_path_deviation"
    ],
    
    repLogic: {
      startAngle: 180,
      bottomAngle: 75
    }
  },

  deadlift: {
    id: "deadlift",
    name: "Deadlift",
    movementType: "strength",
    primaryJoints: ["hip", "knee", "spine"],
    phases: ["setup", "pull", "mid_pull", "lockout"],
    
    jointRanges: {
      hip: {
        ideal: [35, 55],
        warning: [25, 65],
        danger: [15, 75]
      },
      knee: {
        ideal: [30, 50],
        warning: [20, 60],
        danger: [10, 70]
      },
      spine: {
        ideal: [0, 15],
        warning: [0, 25],
        danger: [0, 40]
      }
    },
    
    faults: [
      "spine_rounding",
      "bar_drift",
      "hip_squat_pattern",
      "poor_start",
      "soft_lockout"
    ],
    
    repLogic: {
      startAngle: 90,
      topAngle: 170
    }
  },

  pushup: {
    id: "pushup",
    name: "Push-Up",
    movementType: "strength",
    primaryJoints: ["shoulder", "elbow", "hip"],
    phases: ["start", "descent", "bottom", "ascent", "lockout"],
    
    jointRanges: {
      elbow: {
        ideal: [70, 90],
        warning: [60, 100],
        danger: [50, 110]
      },
      shoulder: {
        ideal: [40, 70],
        warning: [30, 80],
        danger: [20, 90]
      },
      hip: {
        ideal: [170, 180],
        warning: [160, 180],
        danger: [150, 180]
      }
    },
    
    faults: [
      "hip_sag",
      "partial_range",
      "elbow_flare",
      "scapular_winging",
      "forward_head",
      "rushed_tempo"
    ],
    
    repLogic: {
      startAngle: 180,
      bottomAngle: 75
    }
  },

  pullup: {
    id: "pullup",
    name: "Pull-Up",
    movementType: "strength",
    primaryJoints: ["shoulder", "elbow", "scapula"],
    phases: ["hang", "pull", "top", "descent"],
    
    jointRanges: {
      elbow: {
        ideal: [10, 45],
        warning: [5, 55],
        danger: [0, 65]
      },
      shoulder: {
        ideal: [140, 170],
        warning: [130, 180],
        danger: [120, 180]
      },
      scapula: {
        ideal: [30, 60],
        warning: [20, 70],
        danger: [10, 80]
      }
    },
    
    faults: [
      "kipping",
      "partial_range",
      "scapular_shrug",
      "body_swing",
      "uneven_pull"
    ],
    
    repLogic: {
      startAngle: 180,
      topAngle: 30
    }
  },

  lunge: {
    id: "lunge",
    name: "Lunge",
    movementType: "strength",
    primaryJoints: ["hip", "knee", "ankle"],
    phases: ["start", "step", "bottom", "return"],
    
    jointRanges: {
      knee: {
        ideal: [70, 110],
        warning: [60, 120],
        danger: [50, 130]
      },
      hip: {
        ideal: [75, 120],
        warning: [65, 130],
        danger: [55, 140]
      },
      ankle: {
        ideal: [80, 110],
        warning: [70, 120],
        danger: [60, 130]
      }
    },
    
    faults: [
      "knee_valgus",
      "forward_lean",
      "insufficient_depth",
      "knee_extension_lag",
      "uneven_stride"
    ],
    
    repLogic: {
      startAngle: 180,
      bottomAngle: 75
    }
  },

  overhead_press: {
    id: "overhead_press",
    name: "Overhead Press",
    movementType: "strength",
    primaryJoints: ["shoulder", "elbow", "spine"],
    phases: ["start", "press", "lockout"],
    
    jointRanges: {
      elbow: {
        ideal: [160, 180],
        warning: [150, 180],
        danger: [140, 180]
      },
      shoulder: {
        ideal: [170, 180],
        warning: [160, 180],
        danger: [150, 180]
      },
      spine: {
        ideal: [0, 10],
        warning: [0, 20],
        danger: [0, 35]
      }
    },
    
    faults: [
      "excessive_arch",
      "asymmetric_press",
      "bar_path_deviation",
      "incomplete_lockout",
      "head_forward"
    ],
    
    repLogic: {
      startAngle: 90,
      topAngle: 175
    }
  },

  jump_squat: {
    id: "jump_squat",
    name: "Jump Squat",
    movementType: "athletic",
    primaryJoints: ["hip", "knee", "ankle"],
    phases: ["descent", "bottom", "launch", "flight", "landing"],
    
    jointRanges: {
      knee: {
        ideal: [60, 100],
        warning: [50, 115],
        danger: [40, 130]
      },
      hip: {
        ideal: [50, 100],
        warning: [40, 115],
        danger: [30, 130]
      },
      ankle: {
        ideal: [75, 110],
        warning: [65, 120],
        danger: [55, 135]
      }
    },
    
    faults: [
      "knee_valgus",
      "asymmetric_landing",
      "forward_lean",
      "insufficient_depth",
      "balance_loss"
    ],
    
    repLogic: {
      launchAngle: 100,
      landingAngle: 100
    }
  },

  sprint_stride: {
    id: "sprint_stride",
    name: "Sprint Stride",
    movementType: "locomotion",
    primaryJoints: ["hip", "knee", "ankle"],
    phases: ["stance", "mid_swing", "terminal_swing", "impact"],
    
    jointRanges: {
      knee: {
        ideal: [20, 150],
        warning: [10, 160],
        danger: [0, 170]
      },
      hip: {
        ideal: [10, 130],
        warning: [0, 140],
        danger: [-10, 150]
      },
      ankle: {
        ideal: [85, 115],
        warning: [75, 125],
        danger: [65, 135]
      }
    },
    
    faults: [
      "overstriding",
      "insufficient_knee_drive",
      "lateral_sway",
      "asymmetric_stride",
      "foot_scuff"
    ],
    
    repLogic: {
      stridesPerRepetition: 1
    }
  },

  plank: {
    id: "plank",
    name: "Plank",
    movementType: "isometric",
    primaryJoints: ["shoulder", "spine", "hip"],
    phases: ["setup", "hold"],
    
    jointRanges: {
      spine: {
        ideal: [0, 10],
        warning: [0, 20],
        danger: [0, 35]
      },
      shoulder: {
        ideal: [80, 100],
        warning: [70, 110],
        danger: [60, 120]
      },
      hip: {
        ideal: [170, 180],
        warning: [160, 180],
        danger: [150, 180]
      }
    },
    
    faults: [
      "spine_sag",
      "hip_pike",
      "head_drop",
      "uneven_shoulders",
      "hip_drift"
    ],
    
    repLogic: {
      holdDuration: "duration_based"
    }
  }
};

/**
 * Get a movement profile by ID.
 * @param {string} movementId - e.g. "squat", "benchpress"
 * @returns {object|null} - Movement profile or null if not found
 */
export function getMovementProfile(movementId) {
  return MOVEMENT_PROFILES[movementId] || null;
}

/**
 * List all available movements.
 * @returns {array} - Array of { id, name, movementType }
 */
export function listMovementProfiles() {
  return Object.values(MOVEMENT_PROFILES).map(p => ({
    id: p.id,
    name: p.name,
    movementType: p.movementType
  }));
}

/**
 * Filter movements by type.
 * @param {string} type - "strength", "athletic", "sports", "locomotion", "isometric"
 * @returns {array} - Filtered movement profiles
 */
export function getMovementsByType(type) {
  return Object.values(MOVEMENT_PROFILES).filter(p => p.movementType === type);
}