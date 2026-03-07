const MODULE_FLAGS = {
  coaching:        true,   // CoachingGraphService
  videoAnalysis:   true,   // MotionReviewService
  teamStructure:   false,  // TeamStructureService (coach mode only)
  motionSequence:  true,   // MotionSequenceRenderer
  autoDetection:   true,   // AutoDetectionEngine
  performanceLoop: true,   // PerformanceLoopEngine
  instantReport:   true,   // InstantReportService
  biomechanics:    true,   // BiomechanicsEngine
};

export function moduleEnabled(key) { return MODULE_FLAGS[key] ?? false; }
export function setModuleFlag(key, value) { MODULE_FLAGS[key] = value; }
export function getAllFlags() { return { ...MODULE_FLAGS }; }