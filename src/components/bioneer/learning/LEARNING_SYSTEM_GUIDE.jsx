# Adaptive Learning System — Complete Guide

## Overview

The Bioneer Adaptive Learning Layer adds personalized coaching insights without modifying the deterministic pose detection pipeline. All processing occurs **post-session**, ensuring zero impact on live form scoring or camera performance.

## Architecture

```
DETERMINISTIC PIPELINE (unchanged)
├─ Camera
├─ Pose Engine
├─ Phase Detector
├─ Rep Counter
├─ Form Score Engine
├─ Audio Engine
└─ Trajectory Renderer

        ↓ (session end)

ADAPTIVE LEARNING LAYER (new)
├─ Session Data Capture
├─ User Movement Baseline
├─ Consistency Analysis
├─ Fatigue Detection
├─ Adaptive Score Refinement
└─ Feedback Generation
```

## Core Modules

### 1. SessionLearningEngine.js

**Purpose**: Capture and persist rep-level metrics to IndexedDB.

**Key Functions**:
- `initLearningDB()` — Initialize IndexedDB
- `captureRepMetrics(repData)` — Store individual rep metrics
- `getMovementMetrics(movement, limit)` — Retrieve historical data
- `getSessionSummaryMetrics(movement, sessionStartTime)` — Aggregate session stats
- `getTrackedMovements()` — List all tracked movements
- `clearMovementHistory(movement)` — Reset movement data

**Storage Structure**:
```javascript
{
  id: auto-increment,
  movement: "squat",
  rep: 3,
  kneeAngleMin: 78,
  kneeAngleMax: 165,
  hipAngleMin: 92,
  hipAngleMax: 170,
  shoulderAngleMin: 45,
  shoulderAngleMax: 90,
  spineAngle: 15,
  repDuration: 2.1,
  stabilityVariance: 0.08,
  faultsDetected: ["knee_valgus"],
  formScore: 87,
  timestamp: 1710336000000
}
```

### 2. UserMovementModel.js

**Purpose**: Build personalized baselines from historical data using weighted averaging.

**Key Functions**:
- `calculateMovementBaseline(movement)` — Generate baseline profile
- `compareToBaseline(movement, sessionMetrics)` — Compare current session to baseline
- `getAllBaselines()` — Retrieve all cached baselines

**Baseline Structure**:
```javascript
{
  movement: "squat",
  sessionCount: 42,
  avgFormScore: 85,
  avgKneeDepth: 82,
  avgHipDepth: 95,
  avgTempo: 1.9,
  stabilityScore: 0.91,
  commonFault: "knee_valgus",
  faultFrequency: 23.8,
  lastUpdated: 1710336000000
}
```

**Weighting**: Recent reps weighted 100%, older reps decay to 50% weight.

### 3. ConsistencyAnalyzer.js

**Purpose**: Detect rep-to-rep variation patterns and fatigue indicators.

**Key Functions**:
- `analyzeConsistency(sessionMetrics)` — Calculate consistency score (0-100)
- `getConsistencyRating(score)` — Get label and color feedback

**Analysis**:
- **Angle Deviation**: Variance in joint angles across reps
- **Tempo Deviation**: Variation in rep duration (%)
- **Stability Deviation**: Fluctuation in balance metrics
- **Unstable Reps**: Outliers flagged for review

**Flags**:
- `high_angle_variance`: >15° angle deviation
- `inconsistent_tempo`: >20% tempo variation
- `stability_breakdown`: >0.2 stability deviation
- `fatigue_detected`: Pattern indicators
- `multiple_failed_reps`: >30% of reps are outliers

### 4. FatigueDetector.js

**Purpose**: Detect fatigue indicators and trigger coaching feedback.

**Key Functions**:
- `detectFatigue(sessionMetrics)` — Analyze fatigue patterns
- `getFatigueLabel(severity)` — Get UI label (HIGH/MEDIUM/LOW/NONE)

**Indicators**:
1. **Speed Degradation**: Last 3 reps >25% slower than first 3
2. **ROM Reduction**: Knee depth reduced >10%
3. **Stability Drop**: Stability declined >15%
4. **Form Score Decline**: Score dropped >10%

**Severity Levels**:
- **HIGH**: 3+ indicators, speed >50% slower
- **MEDIUM**: 2+ indicators, consistent degradation
- **LOW**: 1 indicator or minor decline

**Recommendations**:
- HIGH: "Form degrading — consider ending set."
- MEDIUM: "Tempo slowing — focus on controlled movement."
- LOW: "Monitor fatigue — avoid form breakdown."

### 5. AdaptiveFormScore.js

**Purpose**: Refine base form score with personalized adjustments (post-session).

**Key Functions**:
- `calculateAdaptiveFormScore(baseScore, sessionMetrics, movement)` — Apply adjustments
- `formatAdjustment(adjustment)` — Format for UI
- `getScoreComparisonLabel(baseScore, adjustedScore)` — Compare scores

**Adjustments**:
1. **Consistency Penalty**: Up to -8 points (based on rep variation)
2. **Fatigue Penalty**: 3-8 points (based on severity)
3. **Fault Frequency Penalty**: 1-8 points (fault rate >15%+)
4. **Improvement Bonus**: +0-3 points (vs. personal baseline)

**Example**:
```
Base Form Score: 92
├─ Consistency Penalty: -4 (low variation)
├─ Fatigue Penalty: -6 (medium fatigue)
└─ Fault Penalty: -2 (few faults)
─────────────────────
Adjusted Form Score: 80
```

### 6. AdaptiveFeedbackEngine.js

**Purpose**: Generate personalized coaching insights from session data.

**Key Functions**:
- `generateSessionFeedback(sessionMetrics, movement)` — Create insights
- `formatFeedbackInsight(insight)` — Format for UI display

**Insight Categories**:
1. **Consistency**: Rep-to-rep stability assessment
2. **Faults**: Most common fault pattern + frequency
3. **Fatigue**: Degradation indicators + recommendations
4. **Baseline**: Improvement/decline vs. personal history
5. **Tempo**: Speed assessment and optimization

**Example Insights**:
- "Your squat depth is consistent." ✓
- "Right knee collapse detected in 30% of reps." ⚠️
- "Tempo slowing indicates fatigue." ⚡
- "Form improved by 5 points vs. your baseline." ↑
- "High variation between reps. Practice controlled movement." →

## Usage

### Integration with LiveSession

```javascript
import useSessionLearning from './learning/useSessionLearning';

export default function LiveSession() {
  const { processSessionLearning } = useSessionLearning();

  const handleStopSession = async () => {
    const sessionData = { /* form check session */ };
    
    // Process through adaptive learning (non-blocking)
    const enrichedSession = await processSessionLearning(sessionData);
    
    // Session now includes:
    // enrichedSession.learning.consistency
    // enrichedSession.learning.fatigue
    // enrichedSession.learning.adaptiveScoring
    // enrichedSession.learning.feedback
  };
}
```

### Display Insights in History

```javascript
import MovementInsightsPanel from './learning/MovementInsightsPanel';

export default function Analytics() {
  return (
    <MovementInsightsPanel movement="squat" />
  );
}
```

## Data Privacy

- **Local-First**: All data stored in browser IndexedDB
- **No Cloud Sync**: Optional future enhancement
- **User Control**: `clearMovementHistory()` for data reset
- **Export**: `exportLearningData()` for user backup

## Performance

### Processing Timing
- All learning runs **post-session** (never live)
- Minimal blocking: <100ms total processing
- IndexedDB queries: <50ms per operation
- UI renders: <30ms for insights

### Memory
- IndexedDB: Automatic browser quota management
- Session object: +~2KB for learning insights
- No impact on camera or pose detection

## Data Examples

### Captured Rep Metrics
```javascript
{
  movement: "squat",
  rep: 5,
  kneeAngleMin: 75,      // Deepest knee angle in rep
  kneeAngleMax: 168,     // Highest knee angle in rep
  hipAngleMin: 90,
  hipAngleMax: 172,
  shoulderAngleMin: 40,
  shoulderAngleMax: 85,
  spineAngle: 12,        // Forward lean at bottom
  repDuration: 2.3,      // Seconds per rep
  stabilityVariance: 0.12, // 0-1 scale, lower = more stable
  faultsDetected: ["knee_valgus", "forward_torso"],
  formScore: 81,
  timestamp: 1710336000000
}
```

### Session Feedback
```javascript
{
  movement: "squat",
  sessionDate: "2024-03-12T15:30:00Z",
  insights: [
    {
      category: "consistency",
      sentiment: "positive",
      message: "Your 12-rep set was consistent. Form remained stable throughout.",
      actionable: false
    },
    {
      category: "faults",
      sentiment: "neutral",
      message: "Right knee collapse detected in 25% of reps. Cue: 'knees tracking over toes.'",
      actionable: true
    },
    {
      category: "fatigue",
      sentiment: "neutral",
      message: "Fatigue detected (speed_degradation). Maintain control and adequate rest.",
      actionable: true
    }
  ],
  summary: "Solid session. Room for improvement in consistency."
}
```

## Future Enhancements

- [ ] Velocity and acceleration analysis
- [ ] Machine learning anomaly detection
- [ ] Coaching cue optimization per fault
- [ ] Multi-session trend analysis
- [ ] Cloud sync and cross-device history
- [ ] Custom baseline thresholds
- [ ] Peer comparison (anonymous)
- [ ] Video annotation with insights

## Troubleshooting

### Learning DB Won't Initialize
- Check browser IndexedDB support (all modern browsers)
- Clear browser cache and retry
- Check browser privacy mode (may block IndexedDB)

### No Insights Appearing
- Complete at least 3 sessions with same movement
- Ensure capture is running during session
- Check browser console for errors

### Performance Degradation
- Learning processing happens post-session only
- Clear very old data with `clearMovementHistory()`
- Learning should add <100ms to session save

## API Reference

See individual module files for detailed API docs:
- `SessionLearningEngine.js` — Data capture and retrieval
- `UserMovementModel.js` — Baseline calculations
- `ConsistencyAnalyzer.js` — Variation analysis
- `FatigueDetector.js` — Fatigue detection
- `AdaptiveFormScore.js` — Score refinement
- `AdaptiveFeedbackEngine.js` — Insight generation

## Summary

The Adaptive Learning Layer transforms Bioneer from rule-based form scoring into a personalized coaching system:

```
Before: "Form score: 85/100"
After: "Form score: 85/100. Right knee collapse in 25% of reps. 
        Tempo slowing indicates fatigue. Consider shorter sets."
```

All insights are non-intrusive, personalized, and derived from user's own movement history.