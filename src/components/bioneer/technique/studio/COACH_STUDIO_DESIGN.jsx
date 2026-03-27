# ⚡ Technique Studio — Steve Jobs Design Principles

## 🎯 Core Philosophy

**Simplicity is the ultimate sophistication.**

The Technique Studio isn't a tool. It's a **coach-client connection accelerator**. Every pixel serves one purpose: help coaches see movement, understand it, and teach it.

---

## 🎨 Design Principles (In Order of Importance)

### 1. **Clarity Over Complexity**

❌ **NEVER:**
- Show all tools at once
- Add settings nobody uses
- Use jargon in UI labels

✅ **ALWAYS:**
- Hide advanced tools in a menu
- Show only primary tools
- Use simple language ("Box", not "Rectangle")

### 2. **Connection Before Features**

The left sidebar (CoachConnectionPanel) is NOT secondary—it's co-equal to the video.

**Why?**
- A coach's notes are coaching
- Sharing feedback IS the product
- Video is just context

**Result:**
- 50/50 weight: video left, notes right
- Notes panel auto-save
- One-click "Share with Client"

### 3. **Gesture Before Menu**

❌ Too many tools = analysis paralysis

✅ **Primary gesture-based tools:**
- Select (V)
- Line (L)
- Arrow (A)
- Rectangle (R)
- Text (T)

**Everything else:** Collapsed in a menu (press Shift or click dropdown)

### 4. **Speed Over Precision**

A coach drawing for 2 seconds > a coach fiddling with tool settings for 30 seconds.

**Decisions:**
- No color picker (gold only—decision made)
- No stroke width slider (1 size—fast)
- No layer management (flatten on save)

### 5. **First Visit Sets Tone**

CoachWelcomeScreen appears ONCE.

**Message:** This is simple. You can do this. Let's go.

**Content:**
- 4 core features (watch, annotate, share, track)
- Quick keyboard tips
- One big "Start Coaching" button

---

## 🖼️ UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ Technique Studio                               Export ✕ │ ← Minimal header
├──────┬─────────────────────────────────────┬────────────┤
│      │                                     │            │
│  T   │         VIDEO + SKELETON            │  COACH     │
│  O   │         CANVAS (50% width)          │  NOTES     │
│  O   │                                     │  (50%)     │
│  L   │  Play ▶ [========•========] Speed   │            │
│  S   │                                     │            │
│      │                                     │  ✓ Auto    │
│      │                                     │  saves     │
│      │                                     │            │
└──────┴─────────────────────────────────────┴────────────┘

MinimalToolbar (64px wide, 12 buttons max visible)
```

### Header

- **Title:** Minimal, elegant
- **Metadata:** Category, date, annotation count
- **Action:** Export button (CTA), Close button

### Toolbar (Left Side)

**Sections:**
1. **Primary tools** (5 buttons)
   - Select, Line, Arrow, Box, Text
   - 1 per row, square aspect ratio
   
2. **View toggles** (2 buttons)
   - Skeleton on/off
   - Annotations on/off
   
3. **Edit actions** (2 buttons)
   - Undo, Redo (disabled state = 30% opacity)
   
4. **Advanced menu** (1 button)
   - Dropdown reveals: Draw, Circle, Angle, Highlight, Erase
   - Danger zone: Clear Frame, Clear All

**Aesthetic:**
- Background: `COLORS.surface`
- Border: `COLORS.border` (2px)
- Active: `COLORS.goldDim` background + `COLORS.gold` border
- Hover: `scale-110` transform

### Coach Connection Panel (Right Side)

**Goal:** Make coaching VISIBLE.

**Sections:**
1. **Client Name** (large, personal)
   - Input with underline border
   - Gold border when focused
   
2. **Main Focus** (emoji + label buttons)
   - 6 areas: Balance, Depth, Alignment, Tempo, Power, Stability
   - One selection at a time
   - Emoji makes it human
   
3. **Key Insight** (textarea, 200 chars)
   - "What did you notice?"
   - Character counter
   - Gold border when focused
   
4. **Next Session Focus** (textarea)
   - "What should they work on?"
   - Actionable language
   
5. **Share Button** (prominent)
   - Gold, large, "Share with Client"
   - Feedback: "✓ Saved" for 2 seconds

---

## 🎬 Interaction Flow

### Scenario: Coach analyzes squat

```
1. Coach opens Technique Studio
   → Welcome screen (first time only)
   → "Start Coaching" button

2. Video loads
   → Plays automatically on hover
   → Skeleton overlay visible
   
3. Coach spots issue (knee valgus)
   → Pauses (Space key)
   → Presses L (Line tool)
   → Draws arrow pointing at knees
   → Annotation saved instantly

4. Coach wants to coach it
   → Clicks Notes panel
   → Types client name: "Alex"
   → Selects "Alignment" focus
   → Types insight: "Knees are caving in. Stay stacked."
   → Clicks "Share with Client"
   → Feedback: "✓ Saved"
   → 2 sec later, back to normal

5. Next session
   → Coach opens studio again
   → Sidebar shows same client
   → Previous notes are visible
   → Coach can build on feedback
```

---

## 🎨 Color Usage

| Element | Color | Purpose |
|---------|-------|---------|
| Active tool | COLORS.gold | "You are here" |
| Border (active) | COLORS.goldBorder | Subtle reinforcement |
| Disabled state | COLORS.textTertiary (30% opacity) | "Not available" |
| Danger (delete) | COLORS.fault | "Irreversible action" |
| Text input focus | COLORS.gold border | "This matters" |
| Panel background | COLORS.surface | Breathing room |
| Main background | COLORS.bg | Neutral canvas |

---

## ⌨️ Keyboard Shortcuts

| Key | Action | Mental Model |
|-----|--------|--------------|
| **V** | Select tool | **V**ector/pointer |
| **L** | Line | **L**ine |
| **A** | Arrow | **A**rrow |
| **R** | Rectangle | **R**ectangle |
| **T** | Text | **T**ext |
| **Space** | Play/Pause | Universal pause |
| **←** | Step backward | Backward frame |
| **→** | Step forward | Forward frame |
| **Cmd+Z** | Undo | Universal undo |
| **Cmd+Shift+Z** | Redo | Universal redo |
| **Delete** | Delete selected annotation | Delete key |
| **Esc** | Deselect / cancel | Universal cancel |

**Display:** Toolbar shows hints: "Press keys V L A R"

---

## 📱 Mobile Responsiveness

**Breakpoints:**

| Viewport | Layout |
|----------|--------|
| < 768px | Stack vertically (video → notes) |
| 768px - 1280px | Side-by-side (70/30) |
| > 1280px | Side-by-side (60/40) |

**Touch considerations:**
- Buttons: min 48px × 48px
- Text input: larger tap targets
- No hover effects (use focus states)

---

## 🔮 Future Enhancements (Nice-to-Have)

NOT in MVP, but designed to scale:

- [ ] Client view (share link to watch videos + notes)
- [ ] Progress tracking (before/after comparisons)
- [ ] AI coaching suggestions ("Coach, did you mention their hip drop?")
- [ ] Video library (search by client, date, focus area)
- [ ] Angle measurement (auto-detect joint angles)
- [ ] Voice notes (record coaching thoughts)
- [ ] Custom team branding (coach logo in header)

---

## ✅ Design Checklist

When adding a feature, ask:

- [ ] Can I remove something instead?
- [ ] Is it simpler than the current way?
- [ ] Does it help coaches coach faster?
- [ ] Is it beautiful (or at least invisible)?
- [ ] Can it be removed without breaking anything?

**If you answer "no" to 2+, don't ship it.**

---

## 🧠 Cognitive Load Theory

**Human attention span:** ~8 seconds before distraction

**Technique Studio strategy:**
1. **Seconds 0-3:** Play video, coach sees movement
2. **Seconds 3-6:** Coach annotates (draw/text)
3. **Seconds 6-8:** Coach writes insight
4. **Seconds 8+:** Coach is in flow state

**UI should fade away.** The video and notes should feel like thinking out loud.

---

## 📖 Example: Button Styling

```jsx
// ❌ WRONG: Over-designed
<button
  className="px-4 py-2 rounded-lg shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
  style={{
    background: 'linear-gradient(to bottom, #f59e0b, #dc2626)',
    color: '#fff',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  }}
>
  Click me!
</button>

// ✅ RIGHT: Honest, simple
<button
  className="py-3 rounded-lg font-semibold transition-all hover:scale-105"
  style={{
    background: COLORS.gold,
    color: COLORS.bg,
  }}
>
  Share with Client
</button>
```

**Why?**
- No gradients (they're dated)
- No shadows (implies depth we don't have)
- Scale on hover (simple feedback)
- Text is the design

---

## 🎬 Design Motion

**Principle:** Animation should reveal, not distract.

| Interaction | Animation | Duration |
|-------------|-----------|----------|
| Tool selection | Color change + scale | 100ms |
| Button hover | Scale up | 150ms |
| Panel open | Slide in + fade | 200ms |
| Save feedback | Color flash | 2s total |
| Tool tooltip | Fade in | 300ms |

**Never:**
- Bounce animations
- Spinning loaders (use linear)
- Auto-play videos (let user control)
- Parallax effects

---

## 📋 Component Exports

```javascript
// From index.js
export { default as TechniqueStudio } from './TechniqueStudio';
export { default as MinimalToolbar } from './MinimalToolbar';
export { default as CoachConnectionPanel } from './CoachConnectionPanel';
export { default as CoachWelcomeScreen } from './CoachWelcomeScreen';
```

---

## 🎯 Success Metrics

If this design works:

- [ ] New coaches understand the interface in <2 minutes
- [ ] Coaches annotate videos faster than spreadsheet notes
- [ ] Coaches share feedback within same session
- [ ] Clients feel personally coached (not generic)
- [ ] Coaches return to share more videos

**Not a success if:**
- Coaches ignore the notes panel
- Coaches get lost in tool options
- Coaches spend >5 minutes on one annotation
- Adoption drops after first week

---

## 🚀 Launch Checklist

- [ ] Welcome screen tested with 3 coaches
- [ ] Keyboard shortcuts work on Mac + Windows
- [ ] Mobile layout tested (iPad)
- [ ] Auto-save visible and working
- [ ] Annotation export works
- [ ] Client share link preview looks good
- [ ] Performance tested (no lag on annotation)
- [ ] Accessibility: ARIA labels, tab order, contrast