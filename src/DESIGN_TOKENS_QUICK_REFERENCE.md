# Bioneer Design Tokens — Quick Reference

## 🎨 Colors (Use COLORS.*)

```javascript
import { COLORS } from '@/components/bioneer/ui/DesignTokens';

COLORS.bg              // #080808 - Primary background
COLORS.surface         // #0c0c0c - Card/module surface
COLORS.gold            // #c9a227 - Primary accent
COLORS.correct         // #00e5a0 - Success
COLORS.warning         // #f59e0b - Caution
COLORS.fault           // #ff4444 - Error
COLORS.textPrimary     // #ffffff - Primary text
COLORS.textSecondary   // rgba(255,255,255,0.6) - Secondary text
COLORS.textTertiary    // rgba(255,255,255,0.3) - Tertiary text
COLORS.border          // #1a1a1a - Border color
```

## 📐 Spacing (Use SPACING.*)

```javascript
import { SPACING } from '@/lib/spacingSystem';

SPACING.xs             // 4px   - Tight spacing
SPACING.sm             // 8px   - Compact
SPACING.md             // 16px  - Standard (DEFAULT FOR CARDS)
SPACING.lg             // 24px  - Generous
SPACING.xl             // 32px  - Expansive
SPACING.xxl            // 48px  - Dramatic

// Shortcuts
SPACING.padStandard    // 16px  - Card padding
SPACING.padGenerous    // 20px  - Spacious padding
SPACING.gapStandard    // 16px  - Flex/grid gap
SPACING.radiusStandard // 8px   - Border radius
```

## ⏱️ Motion (Use MOTION.*)

```javascript
import { MOTION } from '@/lib/spacingSystem';

MOTION.instant         // 100ms - Quick feedback
MOTION.fast            // 150ms - Count-ups, snappy
MOTION.standard        // 200ms - Screen changes
MOTION.smooth          // 300ms - Complex animations

// Easing (cubic-bezier, smooth & controlled)
MOTION.easeInOut       // 'cubic-bezier(0.4, 0, 0.2, 1)'
MOTION.easeOut         // For entrances
MOTION.easeIn          // For exits
MOTION.linear          // For progress bars
```

## 🔤 Fonts (Use FONT.*)

```javascript
import { FONT } from '@/components/bioneer/ui/DesignTokens';

FONT.mono              // DM Mono, IBM Plex Mono - PRIMARY (numbers, UI)
FONT.heading           // IBM Plex Mono - Brand wordmark

// Always use: fontFamily: FONT.mono
// Never use: hardcoded 'Helvetica', 'Arial', etc.
```

---

## 🧩 Component Quick Usage

### StatCard (Metrics)
```jsx
import { StatCard } from '@/components/bioneer/ui/PremiumComponents';
import { Flame } from 'lucide-react';

<StatCard
  label="Streak"
  value="7d"
  color={COLORS.correct}
  icon={Flame}
  trend={{ positive: true, text: 'Active' }}
/>
```

### PrimaryButton (Hero Actions)
```jsx
import { PrimaryButton } from '@/components/bioneer/ui/PremiumComponents';
import { Play } from 'lucide-react';

<PrimaryButton onClick={handleStart} icon={Play}>
  Start Workout
</PrimaryButton>
```

### PremiumCard (Containers)
```jsx
import { PremiumCard } from '@/components/bioneer/ui/PremiumComponents';

<PremiumCard highlight={true}>
  Your content
</PremiumCard>
```

### ScoreRing (Circular Metrics)
```jsx
import { ScoreRing } from '@/components/bioneer/ui/PremiumComponents';

<ScoreRing score={78} max={100} size={120} color={COLORS.gold} label="Form" />
```

### Logo Variations
```jsx
import { 
  LogoMark, 
  LogoWithWordmark, 
  LogoWatermark,
  AnimatedLogo,
  LogoWithLoadingRing 
} from '@/components/bioneer/ui/LogoMark';

// Standalone icon
<LogoMark size={40} color={COLORS.gold} />

// Full branding (header, splash)
<LogoWithWordmark size="medium" color={COLORS.gold} />

// Faint background (camera, analytics)
<LogoWatermark opacity={0.08} size={240} />

// Animated (loading screens)
<LogoWithLoadingRing size={128} color={COLORS.gold} />
```

### Camera Overlay (Workout Screen)
```jsx
import { 
  PremiumCameraOverlay,
  SessionStatsHeader,
  FeedbackMessage,
  AlignmentGrid,
  ConfidenceRing
} from '@/components/bioneer/live/PremiumCameraOverlay';

<PremiumCameraOverlay showGrid={true}>
  <video ref={videoRef} />
  <SessionStatsHeader reps={12} formScore={85} elapsedSeconds={34} />
  <FeedbackMessage message="Depth ✓" type="success" />
  <ConfidenceRing confidence={0.82} />
</PremiumCameraOverlay>
```

---

## 📏 Common Layout Patterns

### Hero Section (Top of page)
```jsx
// Padding: xl all sides
// Gap between logo & button: lg
// Button full width, large padding
style={{
  padding: SPACING.xl,
  display: 'flex',
  flexDirection: 'column',
  gap: SPACING.lg,
}}
```

### Card Grid (Responsive)
```jsx
// 3 columns on desktop, 1 on mobile
style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: SPACING.md,
}}
```

### Flex Row (Metrics)
```jsx
// Align items, space-between, gap for breathing room
style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: SPACING.md,
}}
```

---

## 🎬 Animation Patterns

### Count-Up (Metrics Change)
```jsx
<motion.div
  key={value}
  initial={{ scale: 1.2, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: MOTION.instant }}
>
  {value}
</motion.div>
```

### Screen Enter
```jsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: MOTION.standard, ease: MOTION.easeOut }}
>
```

### Button Hover
```jsx
<motion.button
  whileHover={{ scale: 1.02, boxShadow: `0 8px 24px rgba(201,162,39,0.2)` }}
  whileTap={{ scale: 0.98 }}
>
```

### Progress Fill
```jsx
<motion.div
  initial={{ width: 0 }}
  animate={{ width: `${percent}%` }}
  transition={{ duration: MOTION.smooth, ease: 'easeOut' }}
/>
```

---

## ❌ Anti-Patterns (Avoid)

```javascript
// ❌ Hardcoded colors
background: '#c9a227'  → USE: COLORS.gold

// ❌ Arbitrary spacing
padding: '15px'        → USE: SPACING.md (16px)
gap: '20px'           → USE: SPACING.md or SPACING.lg

// ❌ Hardcoded fonts
fontFamily: 'Helvetica' → USE: FONT.mono

// ❌ Slow animations
transition: '800ms'    → USE: MOTION.fast (150ms) or MOTION.standard (200ms)

// ❌ Bouncy easing
cubic-bezier(0.68, -0.55, 0.27, 1.55)  → AVOID: Use MOTION.easeOut

// ❌ Shadow-based depth
boxShadow: '0 10px 20px rgba(0,0,0,0.3)' → USE: Contrast (elevation system)
```

---

## 🚀 Quick Component Checklist

When creating new UI:

- [ ] Spacing from `SPACING.*`
- [ ] Colors from `COLORS.*`
- [ ] Motion durations from `MOTION.*`
- [ ] Fonts from `FONT.*`
- [ ] Components from PremiumComponents
- [ ] Logo where appropriate (header, splash, watermark)
- [ ] Animations smooth and controlled (150–250ms)
- [ ] Whitespace generous (optical center, breathing room)
- [ ] Responsive grid (mobile-first)
- [ ] Accessible (contrast, semantic HTML, ARIA)

---

## 📂 Import Cheat Sheet

```javascript
// Design tokens
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
import { SPACING, MOTION } from '@/lib/spacingSystem';

// Premium components
import { 
  PremiumCard, 
  StatCard, 
  PrimaryButton,
  ScoreRing,
  ProgressBar 
} from '@/components/bioneer/ui/PremiumComponents';

// Logo variations
import {
  LogoMark,
  LogoWithWordmark,
  LogoWatermark,
  AnimatedLogo,
  LogoWithLoadingRing
} from '@/components/bioneer/ui/LogoMark';

// Camera overlay
import {
  PremiumCameraOverlay,
  SessionStatsHeader,
  FeedbackMessage,
  AlignmentGrid,
  ConfidenceRing
} from '@/components/bioneer/live/PremiumCameraOverlay';

// Splash screen
import SplashScreen from '@/components/bioneer/onboarding/SplashScreen';

// Motion
import { motion, AnimatePresence } from 'framer-motion';
```

**That's it!** Everything you need for premium Bioneer UI.