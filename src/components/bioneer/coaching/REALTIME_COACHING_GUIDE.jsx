# ⚡ Real-Time Live Coaching System

## 🎯 Core Principle

**"Say less. Say it earlier."**

Real-time coaching that feels like a coach reacting to your movement — not a system talking at you.

---

## 🏗️ Architecture Overview

```
Live Pose Stream (30-60fps)
    ↓
RealtimeIssueDetector
    ├─ Detect current frame issues (knees, hips, back, stability)
    ├─ Severity scoring (0-100)
    └─ Joint-specific misalignment
    ↓
PredictiveCoachingEngine
    ├─ Calculate joint velocity
    ├─ Project next 200ms of movement
    ├─ Predict upcoming knee collapse, rounding, etc.
    └─ Confidence scoring
    ↓
RealtimeCoachScheduler
    ├─ Merge detected + predicted issues
    ├─ Select TOP issue only (no overwhelm)
    ├─ Check timing constraints (2-4s gaps)
    ├─ Filter by intensity preference
    └─ Generate ultra-short cue (3 words max)
    ↓
RealtimeVoiceEngine
    ├─ Pre-cache common cues
    ├─ <200ms trigger-to-audio latency
    ├─ Interrupt capability (high priority)
    └─ Optimize for headphones/AirPods
    ↓
UI Feedback
    ├─ LiveCoachingOverlay (big bold text)
    ├─ Joint highlighting (glow on canvas)
    ├─ Priority color coding
    └─ Fade in/out animation
```

---

## ⚙️ Component Details

### 1. **RealtimeIssueDetector.js**

Analyzes CURRENT pose frame for problems.

**Detects:**
- **Misalignment**: Knee valgus, hip drop, back rounding
- **Instability**: Tremor, wobble, asymmetry
- **Range Issues**: Shallow depth, limited ROM

**Severity Scoring:**
```javascript
// Knee deviation: 0-90°
// Maps to severity: 0-100

deviation: 45°  →  severity: 90 (almost collapsed)
deviation: 15°  →  severity: 30 (minor)
```

**Output:**
```javascript
{
  type: 'knee_collapse',
  severity: 85,        // 0-100
  joint: 'left_knee',
  message: 'Knees out',
  priority: 'high'     // high|medium|low
}
```

---

### 2. **PredictiveCoachingEngine.js**

Predicts issues BEFORE they happen.

**Algorithm:**
1. Calculate velocity of key joints (pixels/second)
2. Project position 200ms into future
3. Check if projection would hit a problem
4. Return prediction + confidence

**Example:**
```
Current: Knee at x=100
Velocity: -2 pixels/frame (moving inward)
Time: 200ms ahead
Projected: x=80

If projection < ankle position:
  → Predict knee collapse in 200ms
  → Confidence: 0.8
  → Send cue NOW (before it happens)
```

**Confidence Scoring:**
- Detected issues: 1.0 (100%)
- Predicted issues: 0.7 (70%)

---

### 3. **RealtimeCoachScheduler.js**

Decides what to say, when to say it.

**Decision Logic:**

```
For each frame:
  1. Merge detected + predicted issues
  2. Score by: priority + severity + user history
  3. Select TOP issue only
  4. Check time gap (2-4s minimum)
  5. Check suppression (don't repeat within 500ms)
  6. Generate cue
  7. Speak if all checks pass
```

**Intensity Filter:**
```
User Setting: "Moderate"
  ├─ Always: High priority issues
  ├─ Include: Medium priority
  └─ Exclude: Low priority

Result: Only 2-3 cues per rep max
```

---

### 4. **RealtimeVoiceEngine.js**

Ultra-low latency voice delivery.

**Optimization:**
- Pre-synthesize common cues on app boot
- Interrupt capability (high priority overrides)
- <200ms latency from decision to audio

**Features:**
```javascript
// Preload common cues
preloadCommonCues()
  → Triggers synthesis of:
    - "Knees"
    - "Chest"
    - "Hips"
    - "Deeper"
    - etc.

// When cue needed:
speak('Knees', {
  priority: 'high',        // Can interrupt
  volume: 1,
  rate: 0.9,               // Slower = clearer
  interruptCurrent: true   // Stop previous cue
})
```

---

### 5. **useLiveCoaching Hook**

React integration for capture components.

**Usage:**
```jsx
function FreestyleCameraView() {
  const coaching = useLiveCoaching(
    isCapturing,
    userMovementProfile,
    enabled
  );

  const handlePoseFrame = (frame) => {
    // Call on every pose inference
    coaching.processFrame(frame, timestamp);
  };

  return (
    <>
      <CameraCanvas onFrame={handlePoseFrame} />
      <LiveCoachingOverlay coaching={coaching} />
      <LiveCoachingControls coaching={coaching} />
    </>
  );
}
```

---

## 🎯 Real-Time Flow Example

### Scenario: User doing a squat

```
T=0ms:  Frame arrives
        └─ Knees are straight, hip height 70cm
        └─ No detected issues

T=50ms: Next frame
        └─ Knees starting to cave inward
        └─ Detector: deviation = 18° (early detection!)
        └─ Severity: 36
        └─ Priority: high
        └─ Decision: Speak "Knees"
        └─ Audio output: <200ms

T=800ms: User hears "Knees"
         └─ Sees joint highlight overlay
         └─ Corrects form immediately
         └─ (Issue prevented before completing)

T=1500ms: Next coaching opportunity
          └─ Different issue (hip drop detected)
          └─ Speak "Hips"
```

**Result:** User prevented issue instead of being corrected after.

---

## 📊 Cue Rules

### Message Format

**❌ BAD:**
```
"Your knee is collapsing inward due to weak glute medius activation..."
```

**✅ GOOD:**
```
"Knees out"
```

**Rules:**
- 3 words max
- Action verb first
- No explanation (fix it first, explain later)
- No technical terms

### Timing Rules

```
Gap between cues: 2-4 seconds minimum
  └─ Respect focus/attention span

Suppression window: 500ms
  └─ Don't repeat same cue 2x in rapid succession

Rate limiting: Max 1 cue per 2 seconds
  └─ Even if multiple issues detected
```

### Priority System

```
HIGH (always coach):
  ├─ Knee collapse (safety)
  ├─ Back rounding (injury risk)
  ├─ Hip drop (form breaking)
  └─ User's known weak areas

MEDIUM (situational):
  ├─ Minor misalignment
  ├─ Stability wobble
  └─ Range of motion

LOW (optional):
  ├─ Minor instability
  └─ Nitpicks
```

---

## 🧠 User Learning Integration

### Session Learning Loop

After session:

```
1. Aggregate detected issues
   └─ knee_collapse: 8 times
   └─ hip_drop: 3 times
   └─ back_rounding: 5 times

2. Track improvements
   └─ After "Knees" cue: form improved 12pts
   └─ After "Hips" cue: form improved 3pts

3. Update UserMovementProfile
   ├─ issueFrequency: { knee: 8, hip: 3, back: 5 }
   └─ improvementRate: { knee: 0.75, hip: 0.4 }

4. Next session uses this data
   └─ Prioritize coaching knee issues (most frequent)
   └─ Shorter cues for known issues
   └─ Skip low-impact issues
```

---

## 🎮 User Controls

### LiveCoachingControls UI

```
┌─────────────────────────┐
│      🔊 Mute Button     │  ← Primary (large, easy to tap)
├─────────────────────────┤
│ Volume: ▓▓▓▓░ (80%)     │
├─────────────────────────┤
│ Intensity:              │
│  [min] [mod] [det]      │  ← Quick intensity toggle
├─────────────────────────┤
│ ● Live Coaching Active  │  ← Status indicator
└─────────────────────────┘
```

**Intensity Levels:**
- **Minimal**: Only high-priority cues (1-2 per rep)
- **Moderate**: High + medium (2-3 per rep) [DEFAULT]
- **Detailed**: All cues (could overwhelm)

---

## 📋 Integration Checklist

### In FreestyleCameraView

```javascript
// 1. Initialize live coaching
const coaching = useLiveCoaching(isCapturing, userProfile, true);

// 2. Call on every pose frame
const handleNewPose = (frame) => {
  coaching.processFrame(frame, Date.now());
};

// 3. Render overlay + controls
<LiveCoachingOverlay coaching={coaching} />
<LiveCoachingControls coaching={coaching} />

// 4. On session end, finalize learning
onSessionSave(() => {
  const learned = learningIntegration.finalizeSession();
  saveToUserProfile(learned);
});
```

### In LiveSessionHUD

```javascript
// Same pattern for structured sessions
const coaching = useLiveCoaching(
  isRecording,
  userProfile,
  sessionConfig.enableCoaching
);

// Process frames from pose detector
poseDetector.onFrame((pose) => {
  coaching.processFrame(pose.landmarks, performance.now());
});
```

---

## 🔧 Performance Requirements

| Metric | Target | Status |
|--------|--------|--------|
| Detection latency | <150ms | ✅ Frame-based, minimal computation |
| Prediction latency | <100ms | ✅ Lightweight trajectory math |
| Decision latency | <50ms | ✅ Single scoring pass |
| Voice trigger latency | <200ms | ✅ Pre-cached cues |
| UI update latency | <300ms | ✅ React state update |
| **Total**: Issue → Audio | <200ms | ✅ |
| Frame drop impact | None | ✅ Runs every 50-100ms, not every frame |

---

## ⚠️ Safety Guardrails

### Prevent Overwhelm

```javascript
// Only coach highest severity
if (allIssues.length > 1) {
  speak(allIssues[0]); // Top only
}

// Respect user intensity
if (intensity === 'minimal' && severity < 70) {
  skip(); // Too low priority
}

// Time gates
if (now - lastCue < 2000) {
  skip(); // Too soon
}
```

### Prevent Repetition

```javascript
// Don't say same thing twice
if (issueType === lastMessage && now - lastTime < 500) {
  skip();
}

// Gradual intensity reduction
if (issueFrequency[type] > 10) {
  minGap += 500; // Space cues out more
}
```

---

## 🚀 Testing Coaching

### Manual Test

```javascript
import { RealtimeIssueDetector } from './RealtimeIssueDetector';
import { PredictiveCoachingEngine } from './PredictiveCoachingEngine';
import { RealtimeCoachScheduler } from './RealtimeCoachScheduler';

// Simulate frame sequence
const frames = [
  { landmarks: [...], timestamp: 0 },
  { landmarks: [...], timestamp: 50 },  // Knees starting to cave
  { landmarks: [...], timestamp: 100 }, // Knees collapsed 30°
];

frames.forEach((frame, i) => {
  const detected = detectRealtimeIssues(frame, frames.slice(0, i));
  const predicted = predictiveEngine.predictUpcomingIssues(200);
  const decision = scheduler.decide(detected, predicted);

  console.log(decision);
  // Output: { shouldSpeak: true, message: "Knees out", ... }
});
```

---

## 📈 Metrics to Track

```javascript
// Per session
coachingMetrics = {
  issuesDetected: 14,
  coachingCuesGiven: 7,    // Some filtered out
  coachingCueAvgLatency: 145, // ms
  userComplianceRate: 0.86,  // % fixed after cue
  estimatedFormImprovement: 12, // points
};
```

---

## 🔮 Future Enhancements

- [ ] AI coach personality selection
- [ ] User-recorded custom coaching
- [ ] Fatigue detection (reduce coaching when tired)
- [ ] Multi-language support
- [ ] Coach "patience" adaptation (less cues if user improving)
- [ ] Breathing cue integration (cue on exhale)
- [ ] Haptic feedback (vibration on high-priority issue)