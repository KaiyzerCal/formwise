/**
 * SessionLearningIntegration.js
 * 
 * Merges live coaching data into UserMovementProfile after session
 * 
 * Updates:
 * - Issue frequency (for future predictions)
 * - Improvement patterns (did user fix issue after cue?)
 * - Severity trends
 * 
 * Goal: Make next session's coaching more targeted
 */

export class SessionLearningIntegration {
  constructor(userProfile = null) {
    this.userProfile = userProfile || {};
    this.sessionData = {
      coachingEvents: [],
      detectedIssues: {},
      improvementPerIssue: {},
      startTime: Date.now(),
    };
  }

  /**
   * Record coaching event during session
   */
  recordCoachingEvent(event) {
    if (!event) return;

    this.sessionData.coachingEvents.push({
      type: event.issueType,
      timestamp: Date.now(),
      priority: event.priority,
      message: event.message,
    });

    // Track frequency
    if (!this.sessionData.detectedIssues[event.issueType]) {
      this.sessionData.detectedIssues[event.issueType] = 0;
    }
    this.sessionData.detectedIssues[event.issueType]++;
  }

  /**
   * Record user improvement after coaching
   * Call when you detect form improved right after a cue
   */
  recordImprovement(issueType, formScoreImprovement = 5) {
    if (!this.sessionData.improvementPerIssue[issueType]) {
      this.sessionData.improvementPerIssue[issueType] = {
        count: 0,
        totalImprovement: 0,
      };
    }

    this.sessionData.improvementPerIssue[issueType].count++;
    this.sessionData.improvementPerIssue[issueType].totalImprovement +=
      formScoreImprovement;
  }

  /**
   * Finalize session — merge into UserMovementProfile
   * Call after session completes (export or save)
   */
  finalizeSession() {
    const merged = { ...this.userProfile };

    // Initialize tracking if needed
    if (!merged.issueFrequency) merged.issueFrequency = {};
    if (!merged.issueHistory) merged.issueHistory = [];
    if (!merged.improvementRate) merged.improvementRate = {};

    // Update issue frequencies
    Object.entries(this.sessionData.detectedIssues).forEach(([issue, count]) => {
      merged.issueFrequency[issue] =
        (merged.issueFrequency[issue] || 0) + count;
    });

    // Track improvement effectiveness
    Object.entries(this.sessionData.improvementPerIssue).forEach(
      ([issue, data]) => {
        const rate = data.count > 0 ? data.totalImprovement / data.count : 0;
        merged.improvementRate[issue] = rate;
      }
    );

    // Add session snapshot
    merged.issueHistory.push({
      timestamp: this.sessionData.startTime,
      issues: this.sessionData.detectedIssues,
      improvements: this.sessionData.improvementPerIssue,
      coachingEventCount: this.sessionData.coachingEvents.length,
    });

    // Keep only last 20 sessions
    if (merged.issueHistory.length > 20) {
      merged.issueHistory = merged.issueHistory.slice(-20);
    }

    return merged;
  }

  /**
   * Get predicted issues for next session
   * (Most frequent from this session)
   */
  getPredictedNextIssues() {
    const sorted = Object.entries(this.sessionData.detectedIssues)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([issue]) => issue);

    return sorted;
  }

  /**
   * Get effectiveness metrics
   */
  getEffectiveness() {
    const totalIssues = Object.values(this.sessionData.detectedIssues).reduce(
      (sum, count) => sum + count,
      0
    );

    const totalImprovements = Object.values(
      this.sessionData.improvementPerIssue
    ).reduce((sum, data) => sum + data.count, 0);

    return {
      issueCount: totalIssues,
      improvementCount: totalImprovements,
      improvementRate: totalIssues > 0 ? totalImprovements / totalIssues : 0,
      coachingEventCount: this.sessionData.coachingEvents.length,
      avgMessagePerIssue:
        totalIssues > 0
          ? this.sessionData.coachingEvents.length / totalIssues
          : 0,
    };
  }
}

/**
 * Backend function to persist session learning
 * 
 * Usage:
 * await base44.functions.invoke('syncSessionLearning', {
 *   sessionId: 'sess_123',
 *   learnedProfile: { issueFrequency: {...}, ... }
 * })
 */
export async function syncSessionLearningToCloud(sessionId, learnedProfile) {
  try {
    // Update FormSession with coaching data
    await fetch('/api/sessions/' + sessionId + '/learning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coaching_data: learnedProfile,
        updated_at: new Date().toISOString(),
      }),
    });

    return { success: true, sessionId };
  } catch (error) {
    console.error('[SessionLearning] Sync failed:', error);
    throw error;
  }
}