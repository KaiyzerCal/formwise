/**
 * Technique Session Normalizer
 * Converts various session sources (freestyle, live, imported drafts) into a unified TechniqueSession format
 * Handles backward compatibility and graceful fallbacks for missing data
 */

export const TECHNIQUE_SESSION_VERSION = '1.0';

/**
 * Normalize any session source into a standard TechniqueSession shape
 * Fills defaults and flags missing/degraded fields without crashing
 */
export function normalizeToTechniqueSession(source) {
  if (!source) {
    return createEmptyTechniqueSession();
  }

  // Detect source type
  let sourceType = 'unknown';
  let videoBlob = null;
  let poseFrames = [];
  let duration = 0;
  let category = 'unknown';
  let sessionId = null;
  let createdAt = new Date().toISOString();

  // Handle freestyle session from history
  if (source._freestyleData || (source.poseFrames && source.videoBlob)) {
    const fs = source._freestyleData || source;
    sourceType = 'freestyle';
    videoBlob = fs.videoBlob || null;
    poseFrames = Array.isArray(fs.poseFrames) ? fs.poseFrames : [];
    duration = typeof fs.duration === 'number' ? fs.duration : 0;
    category = fs.category || 'freestyle';
    sessionId = fs.sessionId || `freestyle-${Date.now()}`;
    createdAt = fs.createdAt || createdAt;
  }

  // Handle technique draft (from history import)
  if (source.techniqueId || (source.sourceType && source.sourceType.includes('history'))) {
    sourceType = source.sourceType || 'technique_draft';
    videoBlob = source.videoBlob || videoBlob;
    poseFrames = Array.isArray(source.poseFrames) ? source.poseFrames : poseFrames;
    duration = typeof source.duration === 'number' ? source.duration : duration;
    category = source.category || category;
    sessionId = source.techniqueId || source.sourceSessionId || sessionId;
    createdAt = source.createdAt || createdAt;
  }

  // Handle live FormSession from database
  if (source.exercise_id || (source.movement_id && !source.poseFrames)) {
    sourceType = 'live_form_session';
    category = source.category || source.movement_name || 'unknown';
    sessionId = source.session_id || source.id || sessionId;
    createdAt = source.started_at || source.created_date || createdAt;
    // Note: live sessions don't have video blobs directly — they come from elsewhere
  }

  // Extract video metadata if blob exists (always safe)
  let videoMetadata = {
    url: null,
    width: null,
    height: null,
    fps: null,
    durationMs: null,
  };

  if (videoBlob instanceof Blob) {
    try {
      videoMetadata = {
        url: URL.createObjectURL(videoBlob),
        width: null,
        height: null,
        fps: 30, // Default assumption
        durationMs: typeof duration === 'number' ? duration * 1000 : null,
      };
    } catch (error) {
      console.warn('Failed to create object URL from blob:', error);
      videoBlob = null; // Fallback to null on error
    }
  }

  // Validate and coerce poseFrames to always be an array
  const safePoseFrames = Array.isArray(poseFrames) ? poseFrames : [];

  // Build normalized session (GUARANTEED valid shape)
  const normalized = {
    version: TECHNIQUE_SESSION_VERSION,
    id: sessionId || `technique-${Date.now()}`,
    createdAt,
    sourceType,
    sourceSessionId: source.sourceSessionId || source.sessionId || null,

    // VIDEO OBJECT (always valid structure)
    video: {
      blob: videoBlob || null,
      url: videoMetadata.url || null,
      width: videoMetadata.width || null,
      height: videoMetadata.height || null,
      fps: videoMetadata.fps || 30,
      durationMs: videoMetadata.durationMs || null,
    },

    // POSE OBJECT (always valid structure)
    pose: {
      frames: safePoseFrames,
      timestamps: extractTimestamps(safePoseFrames),
      jointsTracked: extractTrackedJoints(safePoseFrames),
      confidenceSummary: {
        average: calculateAverageConfidence(safePoseFrames),
        min: calculateMinConfidence(safePoseFrames),
        max: calculateMaxConfidence(safePoseFrames),
      },
    },

    // DERIVED OBJECT (always valid structure)
    derived: {
      angleFrames: Array.isArray(source.angleFrames) ? source.angleFrames : [],
      movementName: source.movement_name || source.movementName || category || 'unknown',
      category: category || 'unknown',
      metrics: (source.metrics && typeof source.metrics === 'object') ? source.metrics : {},
    },

    // ANNOTATIONS OBJECT — preserve existing if present, otherwise empty
    annotations: _extractAnnotations(source),

    // AUXILIARY FIELDS (always valid)
    audioComments: Array.isArray(source.audioComments) ? source.audioComments : [],
    compareTargets: Array.isArray(source.compareTargets) ? source.compareTargets : [],

    // FLAGS FOR UI/UX DEGRADATION (always valid)
    flags: {
      hasVideo: videoBlob instanceof Blob,
      hasPoseData: safePoseFrames.length > 0,
      isComplete: (videoBlob instanceof Blob) && (safePoseFrames.length > 0),
      isFallback: !(videoBlob instanceof Blob) || (safePoseFrames.length === 0),
    },
  };

  return normalized;
}

/**
 * Create an empty but valid TechniqueSession
 */
export function createEmptyTechniqueSession() {
  return {
    version: TECHNIQUE_SESSION_VERSION,
    id: `technique-${Date.now()}`,
    createdAt: new Date().toISOString(),
    sourceType: 'empty',
    sourceSessionId: null,

    video: {
      blob: null,
      url: null,
      width: null,
      height: null,
      fps: null,
      durationMs: null,
    },

    pose: {
      frames: [],
      timestamps: [],
      jointsTracked: [],
      confidenceSummary: { average: 0, min: 0, max: 0 },
    },

    derived: {
      angleFrames: [],
      movementName: null,
      category: 'unknown',
      metrics: {},
    },

    annotations: {
      frames: [],
      ranges: [],
      markers: [],
    },

    audioComments: [],
    compareTargets: [],

    flags: {
      hasVideo: false,
      hasPoseData: false,
      isComplete: false,
      isFallback: true,
    },
  };
}

/**
 * Extract timestamps from pose frames
 * Assumes each frame has a timestamp property in milliseconds
 */
function extractTimestamps(frames) {
  if (!Array.isArray(frames)) return [];
  return frames.map((f, i) => {
    if (f.timestamp !== undefined) return f.timestamp;
    if (f.ms !== undefined) return f.ms;
    return i * (1000 / 30); // Default 30 fps fallback
  });
}

/**
 * Extract which joints are actually tracked across frames
 */
function extractTrackedJoints(frames) {
  if (!Array.isArray(frames) || frames.length === 0) return [];

  const jointSet = new Set();
  frames.forEach(frame => {
    if (frame.landmarks && Array.isArray(frame.landmarks)) {
      frame.landmarks.forEach((lm, idx) => {
        if (lm && lm.visibility > 0.3) {
          jointSet.add(idx);
        }
      });
    }
  });

  return Array.from(jointSet);
}

/**
 * Calculate average pose confidence across all frames
 */
function calculateAverageConfidence(frames) {
  if (!Array.isArray(frames) || frames.length === 0) return 0;

  let sum = 0;
  let count = 0;

  frames.forEach(frame => {
    if (frame.landmarks && Array.isArray(frame.landmarks)) {
      frame.landmarks.forEach(lm => {
        if (lm && lm.visibility !== undefined) {
          sum += lm.visibility;
          count++;
        }
      });
    }
  });

  return count > 0 ? sum / count : 0;
}

/**
 * Calculate minimum confidence in any frame
 */
function calculateMinConfidence(frames) {
  if (!Array.isArray(frames) || frames.length === 0) return 0;

  let minConf = 1;
  frames.forEach(frame => {
    if (frame.landmarks && Array.isArray(frame.landmarks)) {
      frame.landmarks.forEach(lm => {
        if (lm && lm.visibility !== undefined) {
          minConf = Math.min(minConf, lm.visibility);
        }
      });
    }
  });

  return minConf === 1 ? 0 : minConf;
}

/**
 * Calculate maximum confidence in any frame
 */
function calculateMaxConfidence(frames) {
  if (!Array.isArray(frames) || frames.length === 0) return 0;

  let maxConf = 0;
  frames.forEach(frame => {
    if (frame.landmarks && Array.isArray(frame.landmarks)) {
      frame.landmarks.forEach(lm => {
        if (lm && lm.visibility !== undefined) {
          maxConf = Math.max(maxConf, lm.visibility);
        }
      });
    }
  });

  return maxConf;
}

/**
 * Extract and normalize annotations from any source shape
 */
function _extractAnnotations(source) {
  // Flat array of annotation objects
  if (Array.isArray(source?.annotations)) return source.annotations;
  // Already structured with frames array
  if (Array.isArray(source?.annotations?.frames)) {
    const flat = source.annotations.frames.flat();
    return flat.length > 0 ? flat : [];
  }
  // Saved project annotations (flat)
  if (source?.annotations && typeof source.annotations === 'object') {
    const flat = source.annotations.frames ? source.annotations.frames.flat() : [];
    return flat;
  }
  return [];
}

/**
 * Merge annotations/metadata into a TechniqueSession (non-destructive)
 */
export function updateTechniqueSession(session, updates) {
  return {
    ...session,
    ...updates,
    // Preserve version, id, createdAt
    version: session.version,
    id: session.id,
    createdAt: session.createdAt,
  };
}