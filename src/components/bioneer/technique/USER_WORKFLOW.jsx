# Technique Studio — User Workflow

## From History to Studio (Coach Perspective)

### Step 1: Open History
- Coach navigates to **History** page
- Sees list of all sessions (exercise + freestyle)
- Freestyle sessions show:
  - Thumbnail
  - Category (strength, sports, freestyle)
  - Date & time
  - Duration
  - **REPLAY** button (plays video in modal)
  - **TECHNIQUE** button (opens Studio)
  - **DELETE** button

### Step 2: Click TECHNIQUE
```
SessionHistory → Click "TECHNIQUE" button on freestyle session
  ↓
Creates technique draft: createTechniqueDraftFromFreestyleSession()
  ↓
Navigates to: /TechniqueStudio?draft={draftId}
```

### Step 3: Studio Loads
```
TechniqueStudio mounts
  ↓
Reads ?draft={draftId} from URL
  ↓
Loads draft from IndexedDB: getTechniqueDraft(draftId)
  ↓
Normalizes to TechniqueSession: normalizeToTechniqueSession(draft)
  ↓
Initializes:
  - Video player with real video
  - Pose frames for overlay
  - Frame sync engine
  - Annotation editor
  ↓
Renders fullscreen coaching environment
```

### Step 4: Coach Reviews & Annotates

#### Review Mode (Play video)
```
Coach clicks PLAY
  ↓
Video plays at normal speed
  ↓
Skeleton overlay synchronized with video
  ↓
Coach watches movement in real-time
```

#### Analyze Mode (Pause & step)
```
Coach clicks PAUSE
  ↓
Video stops, current frame displayed
  ↓
Coach clicks → (step forward) or ← (step backward)
  ↓
Video seeks to next/prev frame
  ↓
Skeleton overlay updates
```

#### Slow Motion Analysis
```
Coach clicks speed button: 0.5×
  ↓
Video plays at half speed
  ↓
Can analyze in slow motion
  ↓
Can change speed anytime (0.25x, 0.5x, 0.75x, 1x, 1.5x, 2x)
```

### Step 5: Annotate Form Issues

#### Example: Knee Angle Check
```
Coach uses Frame Controls → to find rep peak
  ↓
Coach pauses on key frame
  ↓
Coach selects ANGLE tool from Toolbar (left side)
  ↓
Coach clicks on:
  1. Hip
  2. Knee (vertex)
  3. Ankle
  ↓
Annotation appears: angle marker with degree reading (e.g., "145°")
  ↓
Coach can move annotation by selecting and dragging
  ↓
Coach can delete by selecting and pressing Delete
```

#### Example: Form Cue
```
Coach selects LINE tool
  ↓
Coach draws line from shoulder to hip (showing desired alignment)
  ↓
Line appears on current frame
  ↓
Coach can add TEXT label: "Should be vertical"
  ↓
Annotations visible when ANNOTATIONS toggle is ON
```

#### Example: Focus Area
```
Coach selects CIRCLE tool
  ↓
Coach draws circle around knee area
  ↓
Coach adds focus note in Notes Panel → Focus Areas
  ↓
Selects "Form" and "Alignment" tags
```

### Step 6: Document Coaching Observations

#### Notes Panel (right side)
```
Coach enters athlete name: "Alex Johnson"
  ↓
Coach selects focus areas: Balance, Depth, Form
  ↓
Coach writes notes:
  "Good depth on reps 3-5. Needs work on knee alignment
   in reps 1 and 2. Watch video at 0.5x for detail."
  ↓
Coach clicks SAVE
  ↓
Notes persisted to session
```

### Step 7: Export for Client/Archive

#### Export as JSON (Metadata)
```
Coach clicks EXPORT button (header)
  ↓
Export Panel opens
  ↓
Coach selects "JSON Metadata"
  ↓
Coach clicks EXPORT
  ↓
Downloads: technique-{sessionId}.json
  ↓
Contains: session data, annotations, metadata
  ↓
Coach emails to client as supplementary data
```

#### Export as Package (Complete Data)
```
Coach selects "Session Package"
  ↓
Coach clicks EXPORT
  ↓
Downloads: package-{sessionId}-{timestamp}.json
  ↓
Contains:
  - All session data
  - All annotations
  - Pose frame references
  - Reconstruction instructions
  ↓
Coach archives or sends to backend rendering service
```

#### Export as Snapshot (Frame Image)
```
Coach pauses on best form frame
  ↓
Coach selects "PNG Snapshot"
  ↓
Coach clicks EXPORT
  ↓
Downloads: snapshot-{sessionId}-frame{N}.png
  ↓
Image includes:
  - Actual video frame
  - Skeleton overlay
  - All annotations on this frame
  ↓
Coach shares with athlete via email/messaging
```

### Step 8: Future MP4 Export

```
[Currently available as export option but backend not yet live]

When backend service ready:

Coach selects "Video Export" (future)
  ↓
Coach clicks EXPORT
  ↓
Job submitted to rendering service
  ↓
Email notification with download link
  ↓
Coach downloads fully rendered MP4:
  - Original video
  - Skeleton overlay
  - All annotations baked in
  - Timestamp labels
  ↓
Coach sends to athlete for review
```

### Step 9: Return to History

```
Coach clicks X (close button, header)
  ↓
Studio closes
  ↓
Navigates back to SessionHistory
  ↓
All annotations and notes automatically saved
```

---

## Complete Coaching Workflow Summary

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. HISTORY                2. STUDIO                 3. EXPORT
│                                                             │
│  • View sessions           • Play/pause/speed         • JSON
│  • Click TECHNIQUE    →    • Step frames         →    • PNG
│  • Draft created           • Draw annotations        • Package
│  • Navigate to Studio      • Add notes & tags       • Future MP4
│                            • Save changes
│                            • Return to history
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Interaction Patterns

### Toolbar (Left sidebar)
```
┌─ TOOLS ──────────────┐
│ ⚫ Select            │  Select/pointer
│ ─ Line              │  Draw straight line
│ → Arrow             │  Directional arrow
│ ■ Rectangle         │  Box annotation
│ ◯ Circle            │  Circle annotation
│ ✏ Draw              │  Freehand drawing
│ ⦝ Angle             │  3-point angle measurement
│ T Text              │  Text label
│ 💡 Spotlight        │  Focus highlight
├─ VIEW ───────────────┤
│ 👁 Skeleton         │  Toggle skeleton on/off
│ 👁 Annotations      │  Toggle annotations on/off
│ J Joint Labels      │  Toggle joint names
│ ° Angle Labels      │  Toggle angle values
├─ EDIT ───────────────┤
│ ↶ Undo              │  Undo last annotation
│ ↷ Redo              │  Redo last undo
│ 🗑 Clear Frame      │  Clear annotations on current frame
│ 🗑 ALL              │  Clear all annotations (confirm)
└──────────────────────┘
```

### Timeline (Bottom)
```
┌──────────────────────────────────────────────────┐
│ [════════●═══════════════════════════════════════]│  Scrubber
│ 0:15 / 2:30                                      │  Current / Total
│                                                   │
│ [▶] [◀] [▶] [+5] ... [0.5×] [1×] [2×]           │  Controls
│ Play Prev Next Jump    Speed options
└──────────────────────────────────────────────────┘
```

### Notes Panel (Right sidebar)
```
┌─ NOTES ─────────────────┐
│ Athlete/Client Name:     │
│ [Alex Johnson        ]   │
│                         │
│ Focus Areas:            │
│ [Balance] [Depth]       │
│ [Form]    [Alignment]   │
│ [Tempo]   [Power] ...   │
│                         │
│ Coach Notes:            │
│ [Good depth reps 3-5.   │
│  Knee alignment needs   │
│  work in reps 1-2.  ]   │
│                         │
│ Duration: 45s           │
│ Frames:   1,350         │
│ Confidence: 87%         │
│                         │
│ [SAVE]                  │
└─────────────────────────┘
```

---

## Real-World Coaching Scenarios

### Scenario 1: Form Correction Email
```
Coach loads session
  → Pauses at peak of problematic rep
  → Draws LINE from shoulder to ankle
  → Adds TEXT: "Should be vertical"
  → Exports as PNG snapshot
  → Emails to athlete with message: "See attached form check"
```

### Scenario 2: Side-by-Side Form Analysis
```
Coach loads session
  → Uses notes to record comparison observations
  → Frame-steps through worst form rep
  → Creates ANGLE measurements at key joints
  → Exports as JSON package
  → Uploads to analysis partner's system
```

### Scenario 3: Progress Tracking
```
Coach loads previous session
  → Compares current rep quality vs 2 weeks ago
  → Documents improvements in notes
  → Marks focus areas that have improved (tag "Strength")
  → Saves session with progress notes
  → Creates archive for client portfolio
```

### Scenario 4: Training Plan Update
```
Coach reviews 3 recent sessions
  → Identifies pattern: right knee valgus
  → Creates annotations documenting the issue
  → Exports all 3 sessions as JSON
  → Uses data to generate updated training plan
  → Sends client annotated videos + new plan
```

---

## Mobile Considerations

✅ **What works on mobile**:
- Video playback at full screen
- Frame controls (buttons responsive to touch)
- Basic annotation (toolbar simplified to essential tools)
- Notes editing
- Export modal

⚠️ **Best experience on**:
- Desktop (larger canvas for precision annotation)
- Tablet (good balance of screen real estate and control)

---

## Keyboard Shortcuts (Future Enhancement)

Prepared for future shortcuts without changing current UI:

| Key | Action |
|-----|--------|
| Space | Play/Pause |
| → | Next frame |
| ← | Previous frame |
| Z | Undo |
| Shift+Z | Redo |
| L | Line tool |
| C | Circle tool |
| T | Text tool |
| Del | Delete selected annotation |

---

## Support & Help

**In-app help** (future):
- Hover tooltips on all buttons
- Keyboard shortcut cheat sheet
- Tutorial overlay on first use

**External docs**:
- See `components/bioneer/technique/studio/README.md`
- Comprehensive architecture guide with examples

---

**Version**: 1.0  
**Last Updated**: 2026-03-12