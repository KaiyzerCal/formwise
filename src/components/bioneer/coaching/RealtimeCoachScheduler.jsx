/**
 * RealtimeCoachScheduler.js
 * 
 * Decides what to coach RIGHT NOW based on:
 * - Detected issues (current frame)
 * - Predicted issues (next 200ms)
 * - User history + frequency
 * - Coaching noise limits (max 1 cue per 2-4 seconds)
 * 
 * Returns: { shouldSpeak, message, priority, duration }
 * 
 * Core rule: ONLY coach highest priority issue at any moment
 */

export class RealtimeCoachScheduler {
  constructor(userMovementProfile = null) {
    this.userProfile = userMovementProfile;
    this.lastCoachingTimeMs = -999999;
    this.minGapMs = 2000; // 2 seconds minimum between cues
    this.lastCoachingMessage = null;
    this.suppressionWindow = 500; // Don't repeat same cue within 500ms
    this.priorityOverride = null;
    this.overrideTimeout = null;
  }

  /**
   * Main decision point
   * Called every frame (16-33ms at 30-60fps)
   */
  decide(detectedIssues = [], predictedIssues = [], currentTimeMs = Date.now()) {
    // Combine detected + predicted issues
    const allIssues = this.mergeIssues(detectedIssues, predictedIssues);

    if (allIssues.length === 0) {
      return { shouldSpeak: false, message: null, reason: 'no_issues' };
    }

    // Filter by time gap (don't coach too frequently)
    if (currentTimeMs - this.lastCoachingTimeMs < this.minGapMs) {
      return { shouldSpeak: false, reason: 'gap_cooldown' };
    }

    // Get top issue (highest priority + severity)
    const topIssue = this.selectTopIssue(allIssues);

    if (!topIssue) {
      return { shouldSpeak: false, reason: 'no_top_issue' };
    }

    // Check if we should suppress (repetition)
    if (this.shouldSuppress(topIssue, currentTimeMs)) {
      return { shouldSpeak: false, reason: 'suppressed_duplicate' };
    }

    // Generate ultra-short cue
    const cue = this.generateCue(topIssue);

    // Record timing
    this.lastCoachingTimeMs = currentTimeMs;
    this.lastCoachingMessage = topIssue.type;

    return {
      shouldSpeak: true,
      message: cue.message,
      shortMessage: cue.shortMessage,
      duration: cue.duration, // 500-1500ms
      priority: topIssue.priority,
      issueType: topIssue.type,
      bodyParts: [topIssue.joint],
      confidence: topIssue.confidence || 0.8,
    };
  }

  /**
   * Merge detected (current) + predicted (future) issues
   * Weight predicted slightly lower (they might not happen)
   */
  mergeIssues(detected = [], predicted = []) {
    const merged = [];

    // Add detected issues (100% confidence they're happening now)
    detected.forEach(issue => {
      merged.push({
        ...issue,
        source: 'detected',
        confidenceMultiplier: 1.0,
      });
    });

    // Add predicted issues (lower weight)
    predicted.forEach(issue => {
      merged.push({
        ...issue,
        source: 'predicted',
        confidenceMultiplier: 0.7,
      });
    });

    return merged;
  }

  /**
   * Select THE issue to coach (highest priority only)
   */
  selectTopIssue(issues) {
    if (issues.length === 0) return null;

    // Sort by: priority → severity → user history
    const scored = issues.map(issue => {
      const priorityScore = {
        high: 100,
        medium: 50,
        low: 20,
      }[issue.priority] || 0;

      const historyScore =
        (this.userProfile?.issueFrequency?.[issue.type] || 0) * 20;

      const severityScore =
        (issue.severity || 0) * (issue.confidenceMultiplier || 1);

      return {
        ...issue,
        totalScore: priorityScore + historyScore + severityScore,
      };
    });

    scored.sort((a, b) => b.totalScore - a.totalScore);

    return scored[0] || null;
  }

  /**
   * Should we suppress this coaching cue?
   * (Don't repeat same cue within short window)
   */
  shouldSuppress(issue, currentTimeMs) {
    // If same message was just coached, suppress
    if (
      issue.type === this.lastCoachingMessage &&
      currentTimeMs - this.lastCoachingTimeMs < this.suppressionWindow
    ) {
      return true;
    }

    return false;
  }

  /**
   * Generate ultra-short coaching cue
   * 3 words max, action-oriented
   */
  generateCue(issue) {
    const templates = {
      knee_misalignment: {
        message: 'Keep your knees out',
        shortMessage: 'Knees out',
        duration: 800,
      },
      knee_collapse: {
        message: 'Knees out',
        shortMessage: 'Knees',
        duration: 600,
      },
      hip_drop: {
        message: 'Level your hips',
        shortMessage: 'Hips',
        duration: 700,
      },
      back_rounding: {
        message: 'Chest up',
        shortMessage: 'Chest',
        duration: 700,
      },
      shallow_depth: {
        message: 'Go deeper',
        shortMessage: 'Deeper',
        duration: 800,
      },
      knee_instability: {
        message: 'Control it',
        shortMessage: 'Steady',
        duration: 600,
      },
      ankle_instability: {
        message: 'Stable base',
        shortMessage: 'Stable',
        duration: 600,
      },
    };

    const template = templates[issue.type];

    if (!template) {
      return {
        message: 'Fix it',
        shortMessage: 'Fix',
        duration: 600,
      };
    }

    // Adjust message based on frequency
    const frequency = this.userProfile?.issueFrequency?.[issue.type] || 0;

    if (frequency > 5) {
      // This is a recurring issue — shorter cue
      return {
        message: template.shortMessage,
        shortMessage: template.shortMessage,
        duration: 500,
      };
    }

    if (frequency < 1) {
      // New issue — slightly longer explanation
      return {
        message: template.message,
        shortMessage: template.shortMessage,
        duration: 1000,
      };
    }

    // Standard cue
    return template;
  }

  /**
   * User is improving — deliver reinforcement
   */
  deliverReinforcement(issueType) {
    const reinforcements = {
      knee_misalignment: 'Good — keep them out',
      back_rounding: 'Perfect — chest up',
      hip_drop: 'Nice — level',
      knee_collapse: 'Great — controlled',
      shallow_depth: 'Excellent depth',
    };

    const message = reinforcements[issueType] || 'Good form';

    return {
      shouldSpeak: true,
      message: message,
      duration: 1200,
      priority: 'low',
      issueType: issueType + '_improvement',
      isReinforcement: true,
    };
  }

  /**
   * Set a priority issue that should be coached next
   * (overrides normal decision logic)
   */
  setPriorityOverride(issueType, durationMs = 5000) {
    this.priorityOverride = issueType;

    if (this.overrideTimeout) clearTimeout(this.overrideTimeout);

    this.overrideTimeout = setTimeout(() => {
      this.priorityOverride = null;
    }, durationMs);
  }

  /**
   * Clear coaching state (e.g., between reps)
   */
  reset() {
    this.lastCoachingTimeMs = -999999;
    this.lastCoachingMessage = null;
    this.priorityOverride = null;

    if (this.overrideTimeout) {
      clearTimeout(this.overrideTimeout);
    }
  }

  /**
   * Gradually reduce coaching frequency if movement stabilizes
   */
  adaptToImprovement(issueType) {
    // Increase min gap between cues for this issue
    if (!this.userProfile?.issueFrequency?.[issueType]) {
      // Issue is gone — we can be quieter
      this.minGapMs = Math.min(5000, this.minGapMs + 500);
    }
  }
}