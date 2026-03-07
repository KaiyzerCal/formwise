import { eventBus } from "./eventBus";
import { moduleEnabled } from "./moduleRegistry";

const SERVICE = "AutoDetectionEngine";

const MOVEMENT_CONFIGS = {
  squat:           { repJoint: "l_knee",  descentThreshold: 0.008, ascendThreshold: 0.003 },
  deadlift:        { repJoint: "l_hip",   descentThreshold: 0.006, ascendThreshold: 0.002 },
  pushup:          { repJoint: "l_elbow", descentThreshold: 0.008, ascendThreshold: 0.003 },
  basketball_shot: { repJoint: "l_wrist", descentThreshold: 0.010, ascendThreshold: 0.004 },
  baseball_swing:  { repJoint: "r_wrist", descentThreshold: 0.015, ascendThreshold: 0.006 },
};

export class AutoDetectionEngine {
  constructor(movementId, sessionId) {
    this.movementId = movementId;
    this.sessionId  = sessionId;
    this.buffer     = [];
    this.repState   = "LOCKOUT";
    this.repCount   = 0;
    this.bufferMax  = 90;
    this.config     = MOVEMENT_CONFIGS[movementId] ?? MOVEMENT_CONFIGS.squat;
    this.enabled    = moduleEnabled("autoDetection");
    if (this.enabled) console.log(`[${SERVICE}] Initialized for ${movementId}`);
  }

  ingestFrame(frame) {
    if (!this.enabled) return;
    this.buffer.push(frame);
    if (this.buffer.length > this.bufferMax) this.buffer.shift();
    this.analyze();
  }

  analyze() {
    if (this.buffer.length < 10) return;
    const velocityY = this.computeVelocityY(this.config.repJoint);

    if (this.repState === "LOCKOUT" && velocityY > this.config.descentThreshold) {
      this.repState = "DESCENT";
      eventBus.emit("PhaseChange", { phase: "descent", sessionId: this.sessionId });
    } else if (this.repState === "DESCENT" && velocityY < this.config.ascendThreshold) {
      this.repState = "BOTTOM";
      eventBus.emit("PhaseChange", { phase: "bottom", sessionId: this.sessionId });
    } else if (this.repState === "BOTTOM" && velocityY < -this.config.ascendThreshold) {
      this.repState = "ASCENT";
    } else if (this.repState === "ASCENT" && velocityY > -this.config.descentThreshold) {
      this.repState = "LOCKOUT";
      this.repCount++;
      console.log(`[${SERVICE}] Rep ${this.repCount} detected`);
      eventBus.emit("RepDetected", {
        sessionId: this.sessionId,
        repNumber: this.repCount,
        score:     this.scoreCurrentRep(),
        faultIds:  this.detectFaults(),
      });
    }
  }

  computeVelocityY(jointId) {
    const recent = this.buffer.slice(-5);
    if (recent.length < 2) return 0;
    const first = recent[0][jointId]?.y ?? 0;
    const last  = recent[recent.length - 1][jointId]?.y ?? 0;
    return (last - first) / recent.length;
  }

  scoreCurrentRep() {
    // Placeholder — integrate with existing scoringEngine if available
    return 75 + Math.round(Math.random() * 20);
  }

  detectFaults() {
    // Placeholder — plug in existing fault detection logic
    return [];
  }

  reset() {
    this.buffer   = [];
    this.repState = "LOCKOUT";
    this.repCount = 0;
  }
}