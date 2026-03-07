/**
 * BIONEER PARETO INTEGRATION LAYER
 * Central entry point — import this once at app root (e.g. in Layout.js)
 * to register all event subscribers.
 *
 * All services are opt-in via moduleRegistry.js MODULE_FLAGS.
 * Existing app is unaffected when all flags are false.
 */

export { eventBus } from "./eventBus";
export { moduleEnabled, setModuleFlag, getAllFlags } from "./moduleRegistry";

// Register all event subscribers by importing the service files
import "./CoachingGraphService";
import "./PerformanceLoopEngine";
import "./InstantReportService";
import "./BiomechanicsEngine";

// UI components — import individually where needed
export { default as CoachingThreadPanel } from "./ui/CoachingThreadPanel";
export { default as InstantReportCard }   from "./ui/InstantReportCard";
export { default as XPBadge }             from "./ui/XPBadge";
export { default as AnnotationLayer }     from "./ui/AnnotationLayer";
export { default as BenchmarkCard }       from "./ui/BenchmarkCard";

// Engines — import individually where needed
export { AutoDetectionEngine }            from "./AutoDetectionEngine";