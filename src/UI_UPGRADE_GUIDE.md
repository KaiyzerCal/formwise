# Bioneer UI Upgrade — Premium Design System

## Overview

The Bioneer app has been elevated to a **premium, performance-driven** visual system. The design prioritizes precision, intelligent information hierarchy, and minimal aesthetic while maintaining the established gold/dark color palette.

---

## Design Philosophy

### Core Principles
- **Precise**: Every pixel intentional, no excess ornamentation
- **Intelligent**: Data-forward, clear visual hierarchy
- **Performance-driven**: Feel of a professional training system
- **Minimal**: Elegant simplicity, maximum clarity
- **Focused**: Distraction-free, laser-focused on metrics

### Avoid
- Playful or casual aesthetics
- Soft or rounded-heavy design
- Decorative elements
- Cluttered layouts
- Unnecessary animations

---

## Color Palette (Unchanged)

The gold/dark theme is preserved with refined contrast ratios:

```javascript
bg: '#070707'              // Pure black background
surface: '#0b0b0b'         // Slightly lifted surface
gold: '#c9a227'            // Primary accent (unchanged)
correct: '#00e5a0'         // Success state
warning: '#f59e0b'         // Warning state
fault: '#ff4444'           // Error state
textPrimary: '#ffffff'     // Main text
textSecondary: 'rgba(...0.65)'  // Secondary text
textTertiary: 'rgba(...0.35)'   // Tertiary text
textMuted: 'rgba(...0.18)'      // Muted text
```

---

## Typography System

### Font Stack
- **Heading**: IBM Plex Mono (bold)
- **Body**: DM Mono (regular, semibold)
- **All-caps**: Semibold weight with precise letter-spacing

### Type Scale

| Role | Size | Weight | Tracking | Usage |
|------|------|--------|----------|-------|
| Headline | 28px | Bold | 0.15em | Page titles |
| Subhead | 24px | Bold | 0.12em | Section titles |
| Label Large | 12px | Semibold | 0.1em | Card labels |
| Label Medium | 10px | Semibold | 0.1em | Button text |
| Label Small | 9px | Semibold | 0.08em | Secondary labels |
| Label Tiny | 8px | Semibold | 0.08em | Metadata |
| Body | 14px | Regular | Normal | Supporting text |

### Line Height
- Labels: 1.2
- Body text: 1.5
- Headings: 1.1

---

## Spacing System (4px Scale)

```javascript
xs: '4px'      // Tight grouping
sm: '8px'      // Element grouping
md: '12px'     // Component grouping
lg: '16px'     // Section grouping
xl: '20px'     // Container spacing
2xl: '24px'    // Large sections
3xl: '28px'    // Major divisions
4xl: '32px'    // Page sections
5xl: '40px'    // Major spacing
6xl: '48px'    // Huge spacing
```

### Application
- **Card padding**: 5px (20px)
- **Button padding**: 2.5px vertical, 6px horizontal (10-12 point height)
- **Section spacing**: 6px between groups
- **Page padding**: 6px sides, 5px top/bottom

---

## Component Refinements

### PremiumCard
```javascript
// Minimal shadow for depth
boxShadow: '0 2px 4px rgba(0,0,0,0.1)'

// Hover effect: subtle lift
whileHover={{ y: -1, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}

// Rounded corners: lg (12px)
borderRadius: 'lg'
```

### Buttons

**Primary Button**
- Height: 40px (py-2.5)
- Padding: 6px horizontal
- Rounded: lg (12px)
- Shadow: `0 4px 12px rgba(201,162,39,0.25)`
- Font: Semibold, 14px, letter-spacing 0.08em
- Hover: y-1 lift, no scale

**Secondary Button**
- Border: 1px solid goldBorder
- Hover: goldDim background
- No shadow

### StatCard
- Padding: 5px (20px)
- Icon: 16px, stroke-width 1.5
- Value: 32px (4xl) bold
- Label: 9px semibold, 0.12em tracking
- Spacing: 4px between elements

### Progress Bar
- Height: 6px (h-1.5)
- Border: 1px solid rgba(white, 0.05)
- Rounded: full
- Animation: 0.7s easeOut

### Badge
- Padding: 2.5px x 2.5px
- Font: 7px semibold, 0.08em tracking
- Border: 1px solid (color)15
- Background: (color)15
- Rounded: md (8px)

---

## Motion & Transitions

### Timing
- **Fast**: 120ms (quick feedback)
- **Normal**: 180ms (standard interactions)
- **Smooth**: 250ms (page transitions)

### Easing
- All: `cubic-bezier(0.4, 0, 0.2, 1)` (material deceleration)

### Micro-interactions
- **Button hover**: y-1 lift
- **Button tap**: y-0 (return to baseline)
- **Card hover**: y-1 lift + shadow depth
- **Card tap**: scale 0.995
- **Input focus**: border color shift

### Page Transitions
- Entrance: opacity 0 → 1, y -20 → 0
- Duration: 300-400ms
- Stagger children: 50ms per item

---

## Layout System

### Container Widths
- **Sidebar**: 200px
- **Main content**: flex-1
- **Max content width**: 4xl (56rem)
- **Section grid**: 1-3 columns responsive

### Spacing
- **Page padding**: 1.5rem (24px) on desktop, 1rem (16px) on mobile
- **Section gap**: 1.5rem (24px)
- **Item gap**: 0.75rem (12px)
- **Card padding**: 1.25rem (20px)

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

## Refinement Checklist

When building new components, ensure:

- [ ] Typography: Correct size, weight, and tracking
- [ ] Spacing: Follows 4px scale, no arbitrary values
- [ ] Color: Uses COLORS token (no hex literals)
- [ ] Motion: Uses TRANSITIONS timing
- [ ] Shadows: Uses SHADOWS token for depth
- [ ] Alignment: Pixel-perfect alignment
- [ ] Accessibility: Color contrast ≥ 4.5:1
- [ ] Mobile: Responsive layout tested
- [ ] Performance: No unnecessary renders

---

## Examples

### Example: Section Header
```jsx
<h2 className="text-[8px] font-semibold tracking-[0.1em] uppercase mb-4"
  style={{ color: COLORS.gold }}>
  Section Title
</h2>
```

### Example: Data Row
```jsx
<div className="flex items-center justify-between">
  <p className="text-[8px] font-semibold" style={{ color: COLORS.textTertiary }}>
    Label
  </p>
  <p className="text-lg font-bold" style={{ color: COLORS.gold }}>
    Value
  </p>
</div>
```

### Example: Button Group
```jsx
<div className="flex gap-3">
  <PrimaryButton onClick={onSave}>Save</PrimaryButton>
  <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
</div>
```

---

## Migration Guide

### Old → New

| Element | Old | New |
|---------|-----|-----|
| Card padding | p-6 | p-5 |
| Button height | py-3 | py-2.5 |
| Section spacing | space-y-8 | space-y-6 |
| Title size | text-3xl | text-2xl |
| Label size | text-[10px] | text-[8px] |
| Rounded corners | rounded-2xl | rounded-lg |
| Button hover | scale 1.05 | y -1 |

---

## Performance Notes

The refined design system reduces visual clutter and improves focus:
- Smaller font sizes reduce cognitive load
- Tighter spacing creates density without compression
- Subtle shadows add depth without distraction
- Minimal motion maintains performance

Target metrics:
- **Lighthouse**: 95+ performance
- **Animation**: 60 FPS
- **Load time**: < 2s

---

## Brand Evolution

This upgrade maintains Bioneer's established brand while elevating it to **professional training system** standards. The design now communicates:
- **Expertise**: Precise, intelligent design
- **Performance**: Data-driven interface
- **Elite**: Premium visual execution
- **Focused**: Distraction-free experience

The gold/dark palette remains iconic and distinctive while the refined typography and spacing create a world-class fitness training platform aesthetic.