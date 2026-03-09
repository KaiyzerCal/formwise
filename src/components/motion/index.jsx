/**
 * components/motion/index.js
 * ─────────────────────────────────────────────────────────────
 * Motion Intelligence Engine — top-level barrel export.
 *
 * ARCHITECTURE:
 *   contracts/     — shared enums, types, factories
 *   pose/          — pose provider abstraction + normalization
 *   tracking/      — subject lock + identity tracking
 *   readiness/     — motion readiness gate
 *   stabilization/ — 5-filter joint stabilization stack
 *   kinematics/    — angles, velocities, symmetry, COM
 *   movement/      — profiles, registry, classifier
 *   phase/         — phase classification + transitions
 *   reps/          — rep state machine + validation
 *   faults/        — fault detection, persistence, prioritization
 *   confidence/    — 4-factor confidence gating
 *   feedback/      — cue scheduling + audio scaffold
 *   scoring/       — rep + session scoring
 *   session/       — orchestrator, logger, summary builder
 *   reporting/     — report builders (scaffold)
 *
 * Implementation note:
 *   Existing logic lives in components/bioneer/pipeline/*.
 *   This layer re-exports those modules under the domain namespace
 *   and adds the contracts + scaffold modules.
 *   No files were moved or deleted — full backward compatibility maintained.
 */

// ── Contracts ─────────────────────────────────────────────────────────────
export * from './contracts/index.js';

// ── Pose ──────────────────────────────────────────────────────────────────
export { normalizeLandmarks, avgVisibility, MEDIAPIPE_MAP } from '../bioneer/pipeline/PoseNormalizer';

// ── Tracking ──────────────────────────────────────────────────────────────
export { SubjectLockEngine }  from '../bioneer/pipeline/SubjectLockEngine';

// ── Readiness ─────────────────────────────────────────────────────────────
export { MotionReadinessManager } from '../bioneer/pipeline/MotionReadinessManager';

// ── Stabilization ─────────────────────────────────────────────────────────
export { StabilizationEngine } from '../bioneer/pipeline/StabilizationEngine';

// ── Kinematics ────────────────────────────────────────────────────────────
export { KinematicsEngine }    from '../bioneer/pipeline/KinematicsEngine';

// ── Movement ──────────────────────────────────────────────────────────────
export { MOVEMENT_PROFILES, getProfile } from '../bioneer/pipeline/MovementProfiles';
export { MOVEMENT_LIBRARY, getMovement } from '../bioneer/pipeline/MovementLibraryData.js';
export { MovementClassifier }            from '../bioneer/pipeline/MovementClassifier.js';
export { FaultRuleLibrary }              from '../bioneer/pipeline/FaultRuleLibrary.js';
export { PhaseTemplates }                from '../bioneer/pipeline/PhaseTemplates.js';

// ── Phase ─────────────────────────────────────────────────────────────────
export { PhaseClassifier }    from '../bioneer/pipeline/PhaseClassifier';

// ── Reps ──────────────────────────────────────────────────────────────────
export { RepDetector }        from '../bioneer/pipeline/RepDetector';

// ── Faults ────────────────────────────────────────────────────────────────
export { FaultDetector, FaultPersistenceBuffer } from '../bioneer/pipeline/FaultDetector';

// ── Confidence ────────────────────────────────────────────────────────────
export { ConfidenceEngine }   from '../bioneer/pipeline/ConfidenceEngine';

// ── Feedback ──────────────────────────────────────────────────────────────
export { FeedbackScheduler }  from '../bioneer/pipeline/FeedbackScheduler';

// ── Scoring ───────────────────────────────────────────────────────────────
export { RepScoringEngine }   from '../bioneer/pipeline/RepScoringEngine';

// ── Session ───────────────────────────────────────────────────────────────
export { LiveSessionOrchestrator } from '../bioneer/LiveSessionOrchestrator.jsx';
export { SessionLogger }           from '../bioneer/pipeline/SessionLogger';
export { SessionSummaryBuilder }   from '../bioneer/pipeline/SessionSummaryBuilder';