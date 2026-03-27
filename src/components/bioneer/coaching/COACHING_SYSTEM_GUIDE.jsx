# Voice Coaching System Guide

## 🎯 Overview

A contextual voice coaching system that guides users through movements like a real coach — precise timing, natural language, zero data dumps.

### Core Principle
**"Say the right thing, at the right moment."**

---

## 🏗️ Architecture

### 1. **Data Model** (`FormSession.coaching_events`)
```json
{
  "timestamp": 12.5,           // Seconds into session
  "duration": 3,               // How long to display (seconds)
  "message": "Drive your hips back",
  "priority": "high",          // high | medium | low
  "body_parts": ["hip"],       // What to highlight
  "cue_type": "correction"     // correction | reinforcement | positioning
}
```

### 2. **Generation Pipeline**

**When:** After session completes (form analysis finishes)

**How:**
```
Session Data (alerts, faults, timeline)
    ↓
CoachingEventGenerator
    ↓
Exercise-specific library lookup
    ↓
Human language conversion
    ↓
Timestamp + priority assignment
    ↓
Save to FormSession.coaching_events
```

**Example:**
```
Alert: knee_valgus at timestamp 12.5s
    ↓ Library lookup (squat → knee)
    ↓ Message: "Keep your knee over your toes"
    ↓ Priority: high (30° deviation)
    ↓ Coaching Event created
```

### 3. **Playback System**

**Hook:** `useCoachingPlayer(events, currentTime, isPlaying)`

**Sync Logic:**
- Monitor video `currentTime`
- Find events where `timestamp ≈ currentTime`
- Speak message with 0.5–1s natural delay
- Only ONE voice at a time (high priority wins)
- Never repeat identical cues in a row

### 4. **Voice Synthesis**

`VoiceCoachingEngine` wraps browser `SpeechSynthesis`:
- Rate: 0.95 (slightly slower, clearer)
- Pitch: 1.0 (natural)
- Volume: controlled by user slider

---

## 📚 Coaching Library

Exercise-specific cues in `coachingLibrary.js`:

```javascript
squat: {
  knee: {
    message: "Keep your knee over your toes",
    reinforcement: "Nice — knees are tracking well",
    threshold: 90,
    duration: 3
  }
}
```

**Rules:**
- Human language, not metrics
- Short (1–2 sentences max)
- Action-oriented ("Do this" not "Don't do that")
- Include reinforcement variant for improvements

---

## 🎮 User Controls

`CoachingControlPanel` provides:

| Control | Function |
|---------|----------|
| **Mute/Unmute** | Toggle coaching on/off |
| **Volume** | 0–100% master volume |
| **Intensity** | minimal / moderate / detailed |
| **Replay** | Re-speak last coaching cue |
| **Display** | Current cue subtitle |

**Intensity Levels:**
- **Minimal:** Only high-priority cues
- **Moderate:** High + selected medium (default)
- **Detailed:** All events (respects min 3s gap)

---

## 🔌 Integration Points

### Session Replay (LiveSessionReplay)
```jsx
const coachingEvents = session.coaching_events || [];
const coaching = useCoachingPlayer(coachingEvents, currentTime, isPlaying);

<LiveSessionReplay 
  session={session}
  coaching={coaching}
/>
<CoachingControlPanel coaching={coaching} />
```

### Technique Studio
```jsx
const overlay = useCoachingOverlay(coaching.currentEvent, coaching.isPlayingVoice);

// Highlight body parts
if (overlay.isPartHighlighted('knee')) {
  // Apply glow/color to knee joint
  const color = overlay.getHighlightColor('knee');
}
```

---

## 🚀 Workflow

### For Coaches Building Cues

1. **Add to Library** (`coachingLibrary.js`):
```javascript
squat: {
  ankle: {
    message: "Keep weight in your heels",
    reinforcement: "Heels are staying planted",
    threshold: 80,
    duration: 2
  }
}
```

2. **Test Generation:**
```bash
node scripts/test-coaching-events.js
```

3. **Review Output:**
- Check timestamp accuracy
- Verify priority assignment
- Ensure no overload (3s+ gaps)

### For Session Processing

1. **Session completes** → Form analysis runs
2. **generateCoachingEvents** function called
3. **Events stored** in `FormSession.coaching_events`
4. **UI loads** and syncs to playback

---

## 📊 Quality Metrics

**Track:** How well coaching improves user performance

```javascript
// Compare form_score across replays of same session
session_1_first_view: 65
session_1_with_coaching: 78  // +13 points
session_2_next_session: 82   // improvement carries forward
```

---

## 🛡️ Safety Rules

❌ **DON'T:**
- Narrate every movement
- Use technical language (angles, degrees)
- Interrupt playback excessively
- Create long speeches (>5 words per cue)

✅ **DO:**
- Short, precise cues
- Human coaching tone
- Respect user intensity preference
- Allow muting

---

## 🔬 Testing Coaching Events

### Manual Test
```javascript
import { generateCoachingEvents } from '@/components/bioneer/coaching';

const session = {
  alerts: [
    { timestamp: 5, joint: 'knee', angle: 28 },
    { timestamp: 10, joint: 'hip', angle: 110 },
  ],
  top_faults: ['knee', 'ankle'],
  form_score_overall: 75,
  duration_seconds: 30,
};

const events = generateCoachingEvents(session, 'squat');
console.log(events);
// Output:
// [
//   { timestamp: 5, message: "Keep your knee over your toes", priority: "high" },
//   { timestamp: 10, message: "Drive your hips back more", priority: "high" }
// ]
```

### Unit Tests
```bash
npm test -- CoachingEventGenerator.test.js
npm test -- VoiceCoachingEngine.test.js
```

---

## 🎬 Future Enhancements

- [ ] Context-aware variations (1st vs 3rd rep)
- [ ] Difficulty progression (easier cues for beginners)
- [ ] Multi-language support
- [ ] Coach personality selection
- [ ] User-recorded custom coaching
- [ ] A/B testing (which cues improve most)

---

## 📖 Example: Full Integration

```jsx
import { useCoachingPlayer, CoachingControlPanel } from '@/components/bioneer/coaching';

function SessionReplayPage({ sessionId }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const session = useQuery(/* fetch session */);

  // Initialize coaching
  const coaching = useCoachingPlayer(
    session.data?.coaching_events || [],
    currentTime,
    isPlaying
  );

  return (
    <div className="flex gap-4">
      {/* Video Player */}
      <VideoPlayer
        src={session.data?.videoUrl}
        currentTime={currentTime}
        onTimeUpdate={setCurrentTime}
        onPlayChange={setIsPlaying}
      />

      {/* Coaching Controls */}
      <CoachingControlPanel coaching={coaching} />
    </div>
  );
}
```

---

## 📞 Support

For questions or issues:
1. Check this guide
2. Review `coachingLibrary.js` for examples
3. Test with `generateCoachingEvents`
4. Open an issue with session ID + expected vs actual cues