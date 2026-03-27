/**
 * PredictiveCoachingEngine.js
 * 
 * Predicts upcoming issues based on trajectory + historical patterns
 * Triggers cues BEFORE user makes the mistake
 * 
 * Principle: "Say it earlier" — predict from current trajectory
 */

export class PredictiveCoachingEngine {
  constructor(userMovementProfile = null) {
    this.userProfile = userMovementProfile;
    this.frameHistory = [];
    this.maxHistoryFrames = 15; // ~150ms at 100fps
    this.cueSchedule = [];
  }

  /**
   * Update with new frame, return predicted upcoming issues
   */
  update(frame, currentTimeMs) {
    this.frameHistory.push({ frame, timeMs: currentTimeMs });
    if (this.frameHistory.length > this.maxHistoryFrames) {
      this.frameHistory.shift();
    }

    // Predict next 200ms of movement
    const predictions = this.predictUpcomingIssues(200);

    return predictions;
  }

  /**
   * Predict issues based on current trajectory
   * lookAheadMs: how far in future to predict (typically 150-300ms)
   */
  predictUpcomingIssues(lookAheadMs = 200) {
    const predictions = [];

    if (this.frameHistory.length < 3) {
      return predictions;
    }

    const currentFrame = this.frameHistory[this.frameHistory.length - 1];
    const previousFrame = this.frameHistory[this.frameHistory.length - 2];

    // Calculate velocity of key joints
    const velocity = this.calculateVelocity(currentFrame, previousFrame);

    // Project position ahead
    const projectedFrame = this.projectFrame(currentFrame, velocity, lookAheadMs);

    // Check if projection would hit a problem
    predictions.push(...this.checkKneeCollapse(projectedFrame));
    predictions.push(...this.checkBackRounding(projectedFrame));
    predictions.push(...this.checkHipDrop(projectedFrame));
    predictions.push(...this.checkDepthIssue(projectedFrame, currentFrame));

    // Filter by user history (prioritize frequent issues)
    return this.prioritizeByHistory(predictions);
  }

  /**
   * Calculate joint velocities (pixels/ms)
   */
  calculateVelocity(currentFrame, previousFrame) {
    const timeDiff = Math.max(1, (currentFrame.timeMs - previousFrame.timeMs) / 1000); // seconds
    const landmarks = currentFrame.frame.landmarks;
    const prevLandmarks = previousFrame.frame.landmarks;

    const velocity = {};

    ['knee', 'hip', 'ankle', 'shoulder'].forEach(joint => {
      const idx = { knee: 25, hip: 23, ankle: 27, shoulder: 11 }[joint];
      if (landmarks[idx] && prevLandmarks[idx]) {
        velocity[joint] = {
          x: (landmarks[idx].x - prevLandmarks[idx].x) / timeDiff,
          y: (landmarks[idx].y - prevLandmarks[idx].y) / timeDiff,
        };
      }
    });

    return velocity;
  }

  /**
   * Project frame forward in time
   */
  projectFrame(currentFrame, velocity, msAhead) {
    const timeDelta = msAhead / 1000; // Convert to seconds
    const projected = JSON.parse(JSON.stringify(currentFrame.frame));

    Object.keys(velocity).forEach(joint => {
      const idx = { knee: 25, hip: 23, ankle: 27, shoulder: 11 }[joint];
      if (projected.landmarks[idx]) {
        projected.landmarks[idx].x += velocity[joint].x * timeDelta;
        projected.landmarks[idx].y += velocity[joint].y * timeDelta;
      }
    });

    return projected;
  }

  /**
   * Will knee collapse in next frame?
   */
  checkKneeCollapse(projectedFrame) {
    const predictions = [];
    const landmarks = projectedFrame.landmarks;

    ['left', 'right'].forEach(side => {
      const hipIdx = side === 'left' ? 23 : 24;
      const kneeIdx = side === 'left' ? 25 : 26;
      const ankleIdx = side === 'left' ? 27 : 28;

      if (!landmarks[hipIdx] || !landmarks[kneeIdx] || !landmarks[ankleIdx]) return;

      const knee = landmarks[kneeIdx];
      const ankle = landmarks[ankleIdx];

      // If knee projected to be inward from ankle
      const lateralDeviation = Math.abs(knee.x - ankle.x);

      if (lateralDeviation > 0.08) {
        predictions.push({
          type: 'knee_collapse',
          severity: Math.min(100, lateralDeviation * 600),
          message: 'Knees out',
          shortMessage: 'Knees',
          priority: 'high',
          timeUntilIssue: 150, // ms before it happens
          confidence: 0.8,
          predictedAt: Date.now(),
        });
      }
    });

    return predictions;
  }

  /**
   * Will back round?
   */
  checkBackRounding(projectedFrame) {
    const predictions = [];
    const landmarks = projectedFrame.landmarks;

    const neck = landmarks[0];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    if (!neck || !leftHip || !rightHip) return predictions;

    const hipMid = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
    };

    const spineVector = {
      x: Math.abs(neck.x - hipMid.x),
      y: neck.y - hipMid.y,
    };

    const forwardLean = Math.atan2(spineVector.x, spineVector.y) * 180 / Math.PI;

    if (forwardLean > 35) {
      predictions.push({
        type: 'back_rounding',
        severity: Math.min(100, (forwardLean - 30) * 5),
        message: 'Chest up',
        shortMessage: 'Chest',
        priority: 'high',
        timeUntilIssue: 120,
        confidence: 0.75,
      });
    }

    return predictions;
  }

  /**
   * Will hip drop?
   */
  checkHipDrop(projectedFrame) {
    const predictions = [];
    const landmarks = projectedFrame.landmarks;

    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    if (!leftHip || !rightHip) return predictions;

    const hipDrop = Math.abs(leftHip.y - rightHip.y) * 100;

    if (hipDrop > 15) {
      predictions.push({
        type: 'hip_drop',
        severity: Math.min(100, hipDrop * 3),
        message: 'Level hips',
        shortMessage: 'Hips',
        priority: 'medium',
        timeUntilIssue: 200,
        confidence: 0.7,
      });
    }

    return predictions;
  }

  /**
   * Will squat be too shallow?
   */
  checkDepthIssue(projectedFrame, currentFrame) {
    const predictions = [];
    const landmarks = projectedFrame.landmarks;
    const currentLandmarks = currentFrame.frame.landmarks;

    const knee = landmarks[25] || landmarks[26];
    const hip = landmarks[23] || landmarks[24];

    if (!knee || !hip) return predictions;

    const currentDepth = ((knee.y - hip.y) / Math.abs(knee.y - hip.y + 0.1)) * 100;

    // If moving down but will stop short
    if (currentLandmarks[25]?.y < landmarks[25]?.y && currentDepth > 30) {
      predictions.push({
        type: 'shallow_depth',
        severity: Math.min(100, (100 - currentDepth) * 0.7),
        message: 'Go deeper',
        shortMessage: 'Deeper',
        priority: 'low',
        timeUntilIssue: 300,
        confidence: 0.65,
      });
    }

    return predictions;
  }

  /**
   * Reorder predictions by user history + severity
   */
  prioritizeByHistory(predictions) {
    return predictions.sort((a, b) => {
      // User history weight
      const aHistoryWeight = this.userProfile?.issueFrequency?.[a.type] || 0;
      const bHistoryWeight = this.userProfile?.issueFrequency?.[b.type] || 0;

      // Combine: severity + history
      const aScore = a.severity * 0.7 + aHistoryWeight * 0.3;
      const bScore = b.severity * 0.7 + bHistoryWeight * 0.3;

      return bScore - aScore;
    });
  }

  /**
   * Clear frame history (e.g., between reps)
   */
  reset() {
    this.frameHistory = [];
    this.cueSchedule = [];
  }
}