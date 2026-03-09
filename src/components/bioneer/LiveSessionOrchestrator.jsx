/**
 * LiveSessionOrchestrator
 * Wires all pipeline modules. Owns the frame loop.
 * Integrates with existing CameraView via callback pattern.
 *
 * Usage:
 *   const orch = new LiveSessionOrchestrator('squat', userId);
 *   orch.onFrame = (frameData) => { ... };
 *   orch.onRep   = (repData)   => { ... };
 *   orch.onCue   = (cueData)   => { ... };
 *   orch.onLockState = (state) => { ... };  // 'SEARCHING'|'LOCKED'|'DEGRADED'|'LOST'
 *   orch.start(poseResultsStream); // call process(results) each frame
 */

import { normalizeLandmarks, avgVisibility } from './pipeline/PoseNormalizer';
import { SubjectLockEngine }        from './pipeline/SubjectLockEngine';
import { MotionReadinessManager }   from './pipeline/MotionReadinessManager';
import { StabilizationEngine }      from './pipeline/StabilizationEngine';
import { KinematicsEngine }     from './pipeline/KinematicsEngine';
import { MovementResolver }     from './pipeline/MovementResolver';
import { RepDetector }          from './pipeline/RepDetector';
import { PhaseClassifier }      from './pipeline/PhaseClassifier';
import { FaultDetector, FaultPersistenceBuffer } from './pipeline/FaultDetector';
import { ConfidenceEngine }     from './pipeline/ConfidenceEngine';
import { FeedbackScheduler }    from './pipeline/FeedbackScheduler';
import { SessionLogger }        from './pipeline/SessionLogger';

let _sessionIdCounter = 0;

export class LiveSessionOrchestrator {
  constructor(exerciseId, userId) {
    this.exerciseId  = exerciseId;
    this.userId      = userId;
    this.sessionId   = `session_${Date.now()}_${++_sessionIdCounter}`;

    const profile    = MovementResolver.resolve(exerciseId);

    // Modules
    this.subjectLock   = new SubjectLockEngine();
    this.readiness     = new MotionReadinessManager();
    this.stabilizer    = new StabilizationEngine();
    this.kinematics    = new KinematicsEngine();
    this.repDetector   = new RepDetector(profile);
    this.phaseClass    = new PhaseClassifier(profile);
    this.faultDetector = new FaultDetector(exerciseId);
    this.faultBuffer   = new FaultPersistenceBuffer(400);
    this.confidenceEng = new ConfidenceEngine();
    this.scheduler     = new FeedbackScheduler();
    this.logger        = new SessionLogger(this.sessionId, exerciseId, userId);

    // State
    this.currentFaults = [];
    this.lastPhaseId   = null;
    this.baseline      = null;
    this.frameBuffer   = [];
    this.frameCount    = 0;

    // Callbacks (set by consumer)
    this.onFrame     = null;
    this.onRep       = null;
    this.onCue       = null;
    this.onLockState = null;

    // Wire cue callback
    this.scheduler.onCue((cueData) => {
      this.onCue?.(cueData);
    });
  }

  /**
   * Call this once per MediaPipe results frame.
   * @param {Object} results — MediaPipe onResults payload
   * @param {number} tMs     — timestamp in ms (default: Date.now())
   */
  processFrame(results, tMs = Date.now()) {
    this.frameCount++;
    const landmarks = results?.poseLandmarks ?? null;

    // ── LAYER 1: Pose confidence ────────────────────────────────────────────
    const worldLandmarks = results?.poseWorldLandmarks ?? null;
    const { joints: rawJoints, visibility, world: worldJoints } =
      normalizeLandmarks(landmarks ?? [], worldLandmarks ?? undefined);
    const poseConf = avgVisibility(visibility);

    // ── LAYER 2: Subject lock ───────────────────────────────────────────────
    const { locked, landmarks: lockedLandmarks, frozen } =
      this.subjectLock.process(landmarks ?? [], poseConf, tMs);

    const lockState = this.subjectLock.getState();
    if (this.prevLockState !== lockState) {
      this.prevLockState = lockState;
      this.onLockState?.(lockState);
    }

    // ── LAYER 2b: Motion readiness gate ────────────────────────────────────────
    const motionReady = this.readiness.check(poseConf, visibility, lockState);
    if (!motionReady && lockState !== 'LOCKED') {
      // Not ready yet — keep tracking, skip detection
      this.onFrame?.({
        frame: null, phase: this.lastPhaseId, faults: [],
        confidence: poseConf, repState: this.repDetector.getState(),
        lockState, repCount: this.repDetector.getRepCount(),
        activeCue: null, readiness: this.readiness.readinessScore,
      });
      return;
    }

    // If frozen (DEGRADED), use prev stabilized positions but skip fault detection
    if (frozen) {
      const prev = this.stabilizer.getPrev();
      this.onFrame?.({
        frame:      { tMs, phase: this.lastPhaseId, joints: prev },
        phase:      this.lastPhaseId,
        faults:     [],
        confidence: poseConf,
        repState:   this.repDetector.getState(),
        lockState,
        repCount:   this.repDetector.getRepCount(),
        activeCue:  this.scheduler.getActiveCue(),
      });
      return;
    }

    // If no landmarks at all
    if (!landmarks || landmarks.length === 0) {
      this.onFrame?.({
        frame:     null,
        phase:     null,
        faults:    [],
        confidence: 0,
        repState:  this.repDetector.getState(),
        lockState,
        repCount:  this.repDetector.getRepCount(),
        activeCue: this.scheduler.getActiveCue(),
      });
      return;
    }

    // ── LAYER 3: Stabilize (5-filter stack) ────────────────────────────────
    const { smoothed: smoothedJoints, velocities: smoothedVelocities } =
      this.stabilizer.process(rawJoints, visibility, tMs);

    // Capture baseline (ankle Y for heel-rise detection) from first 15 frames
    if (!this.baseline && this.frameCount === 15 && smoothedJoints.l_ankle) {
      this.baseline = { ankleY: smoothedJoints.l_ankle.y };
    }

    // ── LAYER 4: Kinematics (3D world joints from GHUM when available) ─────
    const { velocities, angles, asymmetry } =
      this.kinematics.compute(smoothedJoints, smoothedVelocities, worldJoints);
    const kinAngles = { ...angles, asymmetry };

    // ── LAYER 5a: Rep detection ─────────────────────────────────────────────
    const repEvent = this.repDetector.evaluate(
      smoothedJoints, velocities, angles, tMs, visibility
    );

    if (repEvent?.type === 'PHASE_DESCENT') {
      this.phaseClass.setRepStart(tMs);
      this.scheduler.setRepStartSuppression(tMs, 200);
    }
    if (repEvent?.type === 'REP_COMPLETE') {
      // Build rep score from session data
      const repScore = this._scoreCurrentRep();
      this.logger.logRep(repEvent, repScore, this.currentFaults);
      this.onRep?.({ repNumber: repEvent.repNumber, score: repScore, tMs });
    }

    // ── LAYER 5b: Phase classification ─────────────────────────────────────
    const phase = this.phaseClass.classify(smoothedJoints, tMs, this.repDetector.getState());
    const phaseId = phase?.id ?? null;

    if (phaseId !== this.lastPhaseId) {
      this.logger.logPhase(phaseId, tMs);
      this.lastPhaseId = phaseId;
    }

    // ── LAYER 6: Fault detection (phase-gated) ─────────────────────────────
    const instantFaults = locked
      ? this.faultDetector.evaluate(
          smoothedJoints, phase, tMs, kinAngles, velocities, this.baseline
        )
      : [];

    // Persist for 400ms before promoting
    const confirmedIds     = this.faultBuffer.update(instantFaults.map(f => f.id), tMs);
    const confirmedFaults  = instantFaults.filter(f => confirmedIds.includes(f.id));
    this.currentFaults     = confirmedFaults.map(f => f.id);

    // ── LAYER 7: Confidence gating ──────────────────────────────────────────
    const trackStab = this.confidenceEng.stabilityFromLockState(lockState);

    const cueFaults = confirmedFaults.filter(fault => {
      const pending      = this.faultBuffer.pending[fault.id];
      const persistScore = this.confidenceEng.persistenceScore(
        pending ? tMs - pending.startMs : 0
      );
      return this.confidenceEng.shouldSurface({
        poseConfidence:    poseConf,
        trackingStability: trackStab,
        phaseConfidence:   phaseId ? 0.85 : 0.50,
        faultPersistence:  persistScore,
      });
    });

    // ── LAYER 8: Feedback scheduler ─────────────────────────────────────────
    this.scheduler.ingest(cueFaults, phase, tMs);

    // ── Logging ─────────────────────────────────────────────────────────────
    this.logger.logFrame(smoothedJoints, angles, phaseId, tMs);
    for (const f of cueFaults) {
      this.logger.logFault(f.id, phaseId, tMs, poseConf);
    }

    // ── Frame buffer (for post-session scoring) ──────────────────────────────
    this.frameBuffer.push({ tMs, phase: phaseId, joints: smoothedJoints, angles });
    if (this.frameBuffer.length > 1800) this.frameBuffer.shift(); // 60s @ 30fps

    // ── Emit to UI ───────────────────────────────────────────────────────────
    this.onFrame?.({
      frame:      { tMs, phase: phaseId, joints: smoothedJoints },
      phase:      phaseId,
      faults:     cueFaults,
      confidence: poseConf,
      repState:   this.repDetector.getState(),
      lockState,
      repCount:   this.repDetector.getRepCount(),
      activeCue:  this.scheduler.getActiveCue(),
    });
  }

  /** Finalize and return session summary */
  finalize() {
    return this.logger.finalize();
  }

  /** Compute a simple rep quality score from recent frame buffer */
  _scoreCurrentRep() {
    const recent = this.frameBuffer.slice(-60); // last 2s
    if (!recent.length) return null;

    const faultCount = this.currentFaults.length;
    const basePenalty = Math.min(faultCount * 15, 45);

    // Average pct of frames with no faults (simple heuristic)
    const score = Math.max(10, 100 - basePenalty);
    return score;
  }

  reset() {
    this.subjectLock.reset();
    this.readiness.reset();
    this.stabilizer.reset();
    this.kinematics.reset();
    this.repDetector.reset();
    this.phaseClass.reset();
    this.faultBuffer.reset();
    this.scheduler.reset();
    this.currentFaults = [];
    this.lastPhaseId   = null;
    this.baseline      = null;
    this.frameBuffer   = [];
    this.frameCount    = 0;
  }
}