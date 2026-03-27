# Bioneer Premium UI System — Upgrade Guide

## 🎯 Vision

Transform Bioneer from a fitness app into an **elite, performance-driven coaching system** that feels:
- **Precise** — every pixel intentional
- **Intelligent** — data-driven feedback only
- **Performance-focused** — no distractions
- **Minimal** — maximum clarity with minimum elements

## 📦 New Systems

### 1. Spacing System (`lib/spacingSystem.js`)
4px-based grid for consistency and premium feel:
```javascript
SPACING.xs   = '4px'    // tight
SPACING.sm   = '8px'    // compact
SPACING.md   = '16px'   // standard
SPACING.lg   = '24px'   // generous
SPACING.xl   = '32px'   // expansive
SPACING.xxl  = '48px'   // dramatic
```

Also includes:
- **MOTION** system (100–300ms controlled animations, never bouncy)
- **TYPOGRAPHY** scale (micro to h1)
- **ELEVATION** levels (contrast-based depth, no shadows)

### 2. Logo System (`components/bioneer/ui/LogoMark.jsx`)
Four brand-ready logo variations:

#### LogoMark (standalone)
```jsx
<LogoMark size={64} color={COLORS.gold} animated={false} />
```
Geometric "B" symbol, perfect for headers and icons.

#### LogoWithWordmark (logo + text)
```jsx
<LogoWithWordmark size="medium" color={COLORS.gold} animated={false} />
```
Full brand mark for hero sections and splash screens. Sizes: `small`, `medium`, `large`, `hero`.

#### LogoWatermark (low-opacity background)
```jsx
<LogoWatermark opacity={0.08} size={240} />
```
Subtle faint logo for camera overlays, workout screens. Never interferes with content.

#### AnimatedLogo / LogoWithLoadingRing
```jsx
<LogoWithLoadingRing size={128} color={COLORS.gold} />
```
Animated variants for splash screens and loading states.

### 3. Premium Components (`components/bioneer/ui/PremiumComponents.jsx`)
Redesigned UI components with premium execution:

#### PremiumCard
Clean module containers with subtle elevation:
```jsx
<PremiumCard highlight={true}>
  Content here
</PremiumCard>
```
- Smooth fade-in animation
- Optional gold highlight
- Hover effects for interactive cards

#### StatCard
Hero metric displays with color coding:
```jsx
<StatCard 
  label="Streak"
  value="7d"
  color={COLORS.correct}
  icon={Flame}
  trend={{ positive: true, text: 'Active' }}
/>
```
- Large, readable numbers
- Supporting label + trend indicator
- Color-coded performance signals

#### PrimaryButton
Large, confident action buttons:
```jsx
<PrimaryButton onClick={handleClick} icon={Play}>
  Start Workout
</PrimaryButton>
```
- Full-width, large padding
- Smooth hover/tap animations
- Gold background, no outline

#### ScoreRing
Circular progress indicators:
```jsx
<ScoreRing score={78} max={100} size={120} color={COLORS.gold} label="Form" />
```
- Animated progress circle
- Center value display
- Perfect for form scores, level progress

#### ProgressBar
Linear metric display:
```jsx
<ProgressBar value={45} max={100} color={COLORS.gold} label="XP to Level 5" />
```
- Smooth animated fill
- Optional label + percentage
- Compact, responsive

### 4. Premium Camera Overlay (`components/bioneer/live/PremiumCameraOverlay.jsx`)
Enhanced workout screen with minimal, intelligent UI:

#### SessionStatsHeader
Top bar showing essential metrics only:
```jsx
<SessionStatsHeader reps={12} formScore={85} elapsedSeconds={34} />
```
- Reps (left) — animated count-up
- Session time (center) — MM:SS format
- Form score (right) — color-coded
- Gradient fade background

#### FeedbackMessage
Single, focused coaching cue:
```jsx
<FeedbackMessage message="Depth ✓" type="success" />
```
One message at a time, quick appearance/fade. Types: `success`, `warning`, `fault`, `neutral`.

#### AlignmentGrid
Subtle compositional guides:
```jsx
<AlignmentGrid visible={true} opacity={0.08} />
```
Rule-of-thirds grid overlay at 8% opacity — professional composition.

#### ConfidenceRing
Pose tracking quality indicator:
```jsx
<ConfidenceRing confidence={0.82} />
```
Bottom-left ring showing tracking confidence with color feedback.

## 🎨 Design Principles

### Visual Hierarchy
```
Hero Action (Start Workout)
    ↓
Key Metrics (Streak, Level, Sessions)
    ↓
Recent Activity (last 3 sessions)
    ↓
Secondary Navigation (Analytics, Progress)
```

### Color Application
- **Gold** — Primary actions, achievements, highlights
- **Green** (#00e5a0) — Success, optimal performance
- **Amber** (#f59e0b) — Warning, caution zones
- **Red** (#ff4444) — Faults, errors
- **Dark** (#080808, #0c0c0c) — Surfaces, text contrast

### Spacing Examples

**Card padding:** 16px (standard), 20px (generous), 24px+ (spacious)
**Gap between cards:** 16px (compact), 24px (standard), 32px (breathing room)
**Section margins:** 24px top/bottom
**Breathing room around hero section:** 32px+ all sides

### Motion Rules
```
✓ Count-ups: 150–200ms (fast, snappy)
✓ Screen transitions: 200ms (consistent)
✓ Feedback appearance: 100ms (immediate)
✓ Easing: cubic-bezier(0.4, 0, 0.2, 1) — smooth, not bouncy
✗ Bouncy easing (avoid)
✗ Animations > 300ms (except complex sequences)
```

## 🚀 Integration Checklist

### Home Dashboard
- [x] Logo mark in header
- [x] Spacing system applied
- [x] StatCard components for metrics
- [x] PrimaryButton for "Start Workout"
- [x] PremiumCard for activity, navigation
- [x] Responsive grid layout
- [x] Smooth animations (150–200ms)

### Camera / Workout Screen
- [ ] SessionStatsHeader at top
- [ ] AlignmentGrid guides
- [ ] ConfidenceRing (bottom-left)
- [ ] Single FeedbackMessage (center)
- [ ] LogoWatermark (faint, bottom-right)
- [ ] Minimal HUD overlay
- [ ] Fast animations for rep counting

### Onboarding / Splash
- [x] LogoWithLoadingRing during init
- [x] LogoWithWordmark on ready
- [x] Progress bar (0–100%)
- [x] "Begin Session" CTA
- [x] Premium animations

### Achievements Page
- [x] XP progress with ScoreRing
- [x] Leaderboard panel
- [x] Badge grid with animations
- [x] Stats card (completion %)
- [ ] Logo watermark (optional)

### Settings / Onboarding
- [ ] Logo in header
- [ ] Spacing system
- [ ] PremiumCard modules
- [ ] SecondaryButton for toggles

## 🎬 Animation Guidelines

### Count-Up (Metrics)
```javascript
<motion.div
  key={value}
  initial={{ scale: 1.2, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: '150ms' }}
>
  {value}
</motion.div>
```
Every time value changes, scale up briefly then settle.

### Screen Enter
```javascript
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: '200ms', ease: 'easeOut' }}
>
```
Fade + slight upward movement, smooth easing.

### Button Hover
```javascript
<motion.button
  whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(201,162,39,0.2)' }}
  whileTap={{ scale: 0.98 }}
>
```
Subtle scale and shadow on hover, press feedback on tap.

## 📐 Component Usage Examples

### Home Screen (Already Refactored)
```jsx
import { LogoMark } from '@/components/bioneer/ui/LogoMark';
import { SPACING } from '@/lib/spacingSystem';
import { PremiumCard, StatCard, PrimaryButton } from '@/components/bioneer/ui/PremiumComponents';

<LogoMark size={40} color={COLORS.gold} />

<PrimaryButton onClick={startSession} icon={Play}>
  Start Workout
</PrimaryButton>

<div style={{ display: 'grid', gap: SPACING.md }}>
  <StatCard label="Streak" value="7d" color={COLORS.correct} icon={Flame} />
  <StatCard label="Level" value={5} color={COLORS.gold} icon={Trophy} />
</div>
```

### Camera Overlay (Ready for Integration)
```jsx
import { 
  PremiumCameraOverlay, 
  SessionStatsHeader, 
  FeedbackMessage,
  ConfidenceRing 
} from '@/components/bioneer/live/PremiumCameraOverlay';

<PremiumCameraOverlay showGrid={true}>
  <video ref={videoRef} />
  
  <SessionStatsHeader reps={reps} formScore={score} elapsedSeconds={time} />
  <FeedbackMessage message={feedback} type={feedbackType} />
  <ConfidenceRing confidence={trackingConfidence} />
</PremiumCameraOverlay>
```

### Splash / Loading Screen
```jsx
import { LogoWithLoadingRing, LogoWithWordmark } from '@/components/bioneer/ui/LogoMark';
import SplashScreen from '@/components/bioneer/onboarding/SplashScreen';

<SplashScreen onReady={handleReady} progress={loadProgress} />
```

## 🔍 Quality Checklist

When adding/modifying UI, verify:

- [ ] **Spacing** — Uses SPACING.* (no arbitrary px values)
- [ ] **Typography** — Consistent font sizes, weights, letter-spacing
- [ ] **Motion** — Uses MOTION.* durations, smooth easing
- [ ] **Colors** — Uses COLORS.* system (never hardcoded hex)
- [ ] **Component composition** — Built from PremiumComponents
- [ ] **Responsive** — Works on mobile (320px) and desktop (1440px)
- [ ] **Animations** — 150–250ms, never bouncy
- [ ] **Accessibility** — Proper contrast, semantic HTML, ARIA labels
- [ ] **Whitespace** — Generous breathing room, clear hierarchy
- [ ] **Logo integration** — Where appropriate (hero, headers, watermark)

## 🎯 Next Steps

1. **Integrate Premium Camera Overlay** into existing CameraView component
2. **Update Onboarding Wizard** to use SplashScreen
3. **Refactor SessionRewardScreen** to use ScoreRing, ProgressBar
4. **Add logo watermark** to analytics, progress, technique screens
5. **Polish micro-interactions** — achievement unlocks, streaks, badges
6. **Test responsive design** on all breakpoints

## 📝 File Reference

| File | Purpose | Status |
|------|---------|--------|
| `lib/spacingSystem.js` | Spacing, motion, typography scales | ✅ Created |
| `components/bioneer/ui/LogoMark.jsx` | 4 logo variations + animations | ✅ Created |
| `components/bioneer/ui/PremiumComponents.jsx` | 6 redesigned UI components | ✅ Created |
| `components/bioneer/live/PremiumCameraOverlay.jsx` | Minimal camera UI + watermark | ✅ Created |
| `components/bioneer/onboarding/SplashScreen.jsx` | Premium loading/splash screen | ✅ Created |
| `components/bioneer/dashboard/HomeDashboard` | Refactored with logo, spacing | ✅ Updated |

**Total new code:** ~1,500 lines of production-ready, documented, reusable components.