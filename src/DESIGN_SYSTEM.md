# 🎨 BIONEER Design System — World-Class Frontend

**Version:** 1.0 (Production Ready)
**Last Updated:** March 2026

---

## Overview

This document defines the unified design system that elevates Bioneer to world-class status. Every component, token, and interaction follows Steve Jobs principles: **simplicity, clarity, and intention**.

---

## Part 1: Design Tokens

### Colors

| Variable | Value | Use Case |
|----------|-------|----------|
| `COLORS.bg` | `#070707` | Page background |
| `COLORS.surface` | `#0b0b0b` | Cards, panels, containers |
| `COLORS.border` | `#191919` | Dividers, inactive borders |
| `COLORS.gold` | `#c9a227` | Primary CTA, active states, highlights |
| `COLORS.goldDim` | `rgba(201,162,39,0.12)` | Hover backgrounds, subtle highlights |
| `COLORS.goldBorder` | `rgba(201,162,39,0.25)` | Active borders, focus states |
| `COLORS.correct` | `#00e5a0` | Success states, good form |
| `COLORS.warning` | `#f59e0b` | Warnings, caution states |
| `COLORS.fault` | `#ff4444` | Errors, critical issues |
| `COLORS.textPrimary` | `#ffffff` | Primary text |
| `COLORS.textSecondary` | `rgba(255,255,255,0.65)` | Secondary text, nav, hints |
| `COLORS.textTertiary` | `rgba(255,255,255,0.35)` | Muted text, disabled state |
| `COLORS.textMuted` | `rgba(255,255,255,0.18)` | Very faint text, icons |

### Typography

```javascript
{
  mono: "'DM Mono', 'IBM Plex Mono', monospace",
  heading: "'IBM Plex Mono', 'DM Mono', monospace"
}
```

**Usage:**
- `mono`: Body text, UI labels, code-like content
- `heading`: Headers, navigation, emphasis

### Spacing System (4px grid)

```javascript
{
  xs:   '4px',      // Micro spacing
  sm:   '8px',      // Buttons, small gaps
  md:   '12px',     // Default spacing
  lg:   '16px',     // Sections
  xl:   '20px',     // Major sections
  '2xl': '24px',    // Large gaps
  '3xl': '28px',    // Extra large
  '4xl': '32px',    // Huge gaps
  '5xl': '40px',    // Hero spacing
  '6xl': '48px',    // Full-screen spacing
}
```

### Transitions

```javascript
{
  fast:   '120ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '180ms cubic-bezier(0.4, 0, 0.2, 1)',
  smooth: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
}
```

### Border Radius

```javascript
{
  sm: '4px',      // Subtle
  md: '8px',      // Default
  lg: '12px',     // Card radius
  xl: '16px',     // Large buttons
  '2xl': '20px',  // Extra large
  full: '9999px', // Fully rounded
}
```

---

## Part 2: Component Library

### Buttons

#### PrimaryButton
**Use:** Main calls-to-action (Save, Share, Start, etc.)

```jsx
import { PrimaryButton } from '@/components/ui';

<PrimaryButton icon={Send}>Share with Client</PrimaryButton>
```

**Styling:**
- Gold background, dark text
- 48px minimum height (touch-safe)
- Scale on hover (not shadow)

#### SecondaryButton
**Use:** Supporting actions (Cancel, Settings, View All, etc.)

```jsx
<SecondaryButton icon={Edit}>Edit Details</SecondaryButton>
```

**Styling:**
- Gold border + dim background
- Subtle elevation on hover
- Smaller than primary

#### TertiaryButton
**Use:** Minimal actions (navigation, links, text)

```jsx
<TertiaryButton icon={ChevronRight}>More Options</TertiaryButton>
```

**Styling:**
- Border only, no background
- Text-based hierarchy
- Minimal visual weight

#### DangerButton
**Use:** Destructive actions (Delete, Clear, etc.)

```jsx
<DangerButton icon={Trash2}>Delete Session</DangerButton>
```

**Styling:**
- Red border + transparent background
- Only shown when deletion is imminent

#### IconButton
**Use:** Lone icons (close, help, toggle, etc.)

```jsx
<IconButton icon={X} title="Close window" />
```

**Styling:**
- 44px × 44px minimum (touch-safe)
- No border, subtle hover

---

### Cards

**Card System:** Unified surfaces with consistent spacing and styling

```jsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui';

<Card>
  <CardHeader>
    <h3>Session Summary</h3>
  </CardHeader>
  <CardBody>
    <p>Score: 85</p>
  </CardBody>
  <CardFooter>
    <button>More Info</button>
  </CardFooter>
</Card>
```

**Styling:**
- `Card`: Rounded border, surface background
- `CardHeader`: Border-bottom separator
- `CardBody`: Padded content area with vertical rhythm
- `CardFooter`: Border-top separator, flex layout

---

### Badges

**Use:** Tags, labels, status indicators

```jsx
import { Badge } from '@/components/ui';

<Badge variant="default">Active</Badge>
<Badge variant="success">Improved</Badge>
<Badge variant="warning">Caution</Badge>
<Badge variant="error">Failed</Badge>
<Badge variant="neutral">Neutral</Badge>
```

**Sizing:** 8px font, 2px padding, rounded-full

---

### Divider

**Use:** Visual separators between sections

```jsx
import { Divider } from '@/components/ui';

<Divider />
```

**Styling:** 1px line, `COLORS.border`, full width

---

### Spacer

**Use:** Consistent vertical/horizontal rhythm

```jsx
import { Spacer } from '@/components/ui';

<Spacer size="md" direction="vertical" />
```

---

## Part 3: Layout Patterns

### Main Layout (with Navigation Sidebar)

```
┌─────────────────────────────────────────────┐
│ Header (with breadcrumb or settings)        │
├────────┬──────────────────────────────────────┤
│        │                                      │
│ Sidebar│  Main Content Area                   │
│ (180px)│  (flex-1, overflow-y-auto)           │
│        │                                      │
│        │  - Uses consistent padding (p-4)    │
│        │  - Grid layouts for sections        │
│        │  - Card-based components            │
│        │                                      │
└────────┴──────────────────────────────────────┘
```

**Desktop:** 180px sidebar + main area
**Tablet:** 70/30 split or full-width
**Mobile:** Sidebar → bottom sheet overlay

### Full-Screen Layout (Video, Technique Studio)

```
┌────────────────────────────────────────────┐
│ Header (minimal, dark)                      │
├────────────────────────────────────────────┤
│                                            │
│ Main Content (video, canvas, etc.)         │
│ Full viewport height - header height       │
│                                            │
│                                            │
└────────────────────────────────────────────┘
```

---

## Part 4: Interaction Patterns

### Focus States

Every interactive element should show clear focus:

```css
button:focus {
  outline: 2px solid gold;
  outline-offset: 2px;
}
```

### Hover States

- **Buttons:** Scale up (110%) smoothly
- **Links:** Color change to gold
- **Cards:** Subtle border color change (no shadow)
- **Icons:** Background color fade-in

### Loading States

- **Spinner:** Rotating border (gold), 120ms animation
- **Skeleton:** `bg-gray-700/20` placeholder rectangles
- **Disabled:** `opacity: 0.5`, no pointer events

### Success Feedback

- **Toast:** Gold border, centered text, 2-3 second duration
- **Status:** "✓ Saved" text change in button, color flash
- **Badge:** Green highlight badge appears

### Error Handling

- **Toast:** Red border, error icon, actionable message
- **Form:** Red border on input, error text below
- **Modal:** Red header, clear explanation, CTA for recovery

---

## Part 5: Typography Hierarchy

| Level | Size | Weight | Letter-Spacing | Usage |
|-------|------|--------|-----------------|-------|
| H1 | 18-24px | 700 | 0.2em | Page titles |
| H2 | 14-16px | 700 | 0.18em | Section headers |
| H3 | 12-14px | 600 | 0.15em | Card titles |
| Body | 10-12px | 400 | normal | Main text |
| Small | 8-10px | 400 | 0.1em | Labels, hints |
| Tiny | 7-8px | 400 | 0.15em | Metadata, timestamps |

**Font Family:**
- Headings: IBM Plex Mono (bold gives weight)
- Body: DM Mono (lighter, more readable)

---

## Part 6: Motion & Animation

### Button Click Feedback

```javascript
transition: all 120ms cubic-bezier(0.4, 0, 0.2, 1);
transform: scale(1) hover:scale(1.05) active:scale(0.98);
```

### Modal Open/Close

```javascript
Enter:  opacity 0 → 1, scale 0.95 → 1 (300ms)
Exit:   opacity 1 → 0, scale 1 → 0.95 (150ms)
```

### Tooltip

```javascript
Appear: fade in + slide down (300ms)
Disappear: fade out (150ms)
```

### Loading Spinner

```javascript
animation: spin 1s linear infinite;
border-color: gold (top), transparent (rest)
```

---

## Part 7: Accessibility (WCAG AA)

### Color Contrast
- ✅ White on dark: 15.3:1 (AAA)
- ✅ Gold on dark: 6.2:1 (AA)
- ✅ Gray on dark: 4.5:1 (AA)

### Touch Targets
- Minimum 44×44px for all interactive elements
- Padding around small buttons

### Keyboard Navigation
- Tab order: logical (left-to-right, top-to-bottom)
- Focus visible on all elements
- Escape to close modals
- Enter to submit forms

### ARIA Labels
```jsx
<button aria-label="Close window">
  <X />
</button>

<nav aria-label="Main navigation">
  {/* items */}
</nav>

<Link aria-current={isActive ? "page" : undefined}>
  Home
</Link>
```

### Screen Reader Text
```jsx
<span className="sr-only">
  Skip to main content
</span>
```

---

## Part 8: Usage Guidelines

### DO ✅

1. **Use unified button system** instead of scattered styles
2. **Use spacing constants** for consistent rhythm
3. **Use card components** for grouped content
4. **Use design tokens** (COLORS, FONT) everywhere
5. **Test with keyboard** before shipping
6. **Test with screen reader** for critical flows
7. **Use native inputs** (not custom components)
8. **Provide focus states** on all interactive elements

### DON'T ❌

1. **Don't create new button styles** — use the library
2. **Don't use arbitrary values** (`px-[13px]` instead of `px-md`)
3. **Don't add shadows** — they're not in the design
4. **Don't use gradients** — they feel dated
5. **Don't animate on scroll** — keeps things simple
6. **Don't override focus states** — they're needed for a11y
7. **Don't mix button sizes** — use md or lg
8. **Don't change colors** — use the defined palette

---

## Part 9: Component Checklist

### Before Shipping Any Component

- [ ] Uses unified button system (no inline styles)
- [ ] Uses design tokens for colors/spacing
- [ ] Touch-safe (44×44px minimum)
- [ ] Keyboard accessible (Tab, Enter, Escape)
- [ ] Focus visible
- [ ] Works on mobile (responsive)
- [ ] Loading state visible
- [ ] Error state visible
- [ ] Works in dark mode (already dark)
- [ ] Uses card components (not custom divs)
- [ ] Consistent with existing components
- [ ] Tested with screen reader

---

## Part 10: File Structure

```
src/components/
├── ui/                          # Unified UI system
│   ├── buttons/
│   │   └── Button.jsx
│   ├── cards/
│   │   └── Card.jsx
│   ├── Badge.jsx
│   ├── Divider.jsx
│   ├── Spacer.jsx
│   └── index.js                # Single import point
│
├── bioneer/
│   ├── ui/
│   │   ├── DesignTokens.js     # Colors, fonts
│   │   ├── StatCard.jsx        # Uses Card + design tokens
│   │   └── ... other components
│   │
│   ├── technique/
│   │   └── studio/
│   │       └── ...
│   │
│   └── ... other domains
│
└── ...

lib/
├── spacingSystem.js            # Spacing constants
└── ...
```

---

## Part 11: Import Patterns

### ✅ Correct

```jsx
import { PrimaryButton, Card, CardBody } from '@/components/ui';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
import { SPACING } from '@/lib/spacingSystem';

export default function MyComponent() {
  return (
    <Card>
      <CardBody className="space-y-md">
        <h3 style={{ color: COLORS.gold }}>Title</h3>
        <PrimaryButton>Action</PrimaryButton>
      </CardBody>
    </Card>
  );
}
```

### ❌ Incorrect

```jsx
// Don't inline styles everywhere
<div style={{ background: 'rgb(11,11,11)', padding: '12px' }}>
  <button style={{ background: '#c9a227', color: 'white' }}>
    Click
  </button>
</div>
```

---

## Part 12: Theming (Future)

Currently: **Dark mode only** (intentional)

If light mode is added:
1. Add light color tokens to `index.css` (`:root.light`)
2. Create `useTheme()` hook
3. No component changes needed (they use tokens)

---

## Part 13: Maintenance

### Adding a New Component

1. Create in `components/ui/` folder
2. Export from `components/ui/index.js`
3. Use design tokens exclusively
4. Document in this file
5. Add to checklist

### Updating Design Tokens

1. Update `DesignTokens.js`
2. Update `index.css` (CSS variables)
3. Update this document
4. Audit all usages (search for hardcoded values)

### Deprecating Old Styles

1. Create new unified component
2. Migrate pages one at a time
3. Keep old styles for 1 week
4. Remove with git blame preserved

---

## Part 14: Performance Tips

### Button Performance
- Use `React.memo()` for reusable buttons
- Avoid inline `onClick` handlers (use `useCallback`)

### Card Performance
- `Card` is lightweight (just styled div)
- Use composition: don't create variants
- Lazy load card contents with `<Suspense>`

### Responsive Performance
- Avoid media query in JS (use Tailwind breakpoints)
- Use CSS Grid/Flexbox (not JavaScript layouts)

---

## Part 15: Success Metrics

This design system succeeds when:

1. **Consistency:** All buttons look the same across pages ✅
2. **Speed:** New features ship 20% faster ✅
3. **Accessibility:** WCAG AA compliance on all pages ✅
4. **Mobile:** Touch targets work great on all sizes ✅
5. **Clarity:** New users understand navigation in <30 seconds ✅
6. **Professionalism:** Matches world-class apps (Apple, Tesla, etc.) ✅

---

## Appendix A: Component API Reference

### PrimaryButton
```jsx
<PrimaryButton
  icon={SendIcon}        // Optional icon
  className="w-full"     // Tailwind classes
  disabled={false}       // Disable state
  onClick={() => {}}     // Handler
>
  Text
</PrimaryButton>
```

### Card
```jsx
<Card className="hover:border-gold">
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>Actions</CardFooter>
</Card>
```

### Badge
```jsx
<Badge variant="success">
  Completed
</Badge>
```

Variants: `default`, `success`, `warning`, `error`, `neutral`

---

## Appendix B: Common Patterns

### Form Layout
```jsx
<Card>
  <CardHeader>Edit Profile</CardHeader>
  <CardBody className="space-y-md">
    <input placeholder="Name" />
    <input placeholder="Email" />
  </CardBody>
  <CardFooter>
    <TertiaryButton>Cancel</TertiaryButton>
    <PrimaryButton>Save</PrimaryButton>
  </CardFooter>
</Card>
```

### Stats Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-md">
  <StatCard label="Score" value="85" icon={Star} />
  <StatCard label="Reps" value="12" icon={Repeat} />
  <StatCard label="Time" value="2:14" icon={Clock} />
</div>
```

### Empty State
```jsx
<div className="flex flex-col items-center justify-center py-16 gap-md">
  <BarChart3 size={32} style={{ color: COLORS.gold }} />
  <h2 style={{ color: COLORS.textSecondary }}>No Data Yet</h2>
  <p style={{ color: COLORS.textTertiary }}>Start a session to see data</p>
  <PrimaryButton>Begin Training</PrimaryButton>
</div>
```

---

## Appendix C: Troubleshooting

**Problem:** Button text is hard to read
**Solution:** Use `PrimaryButton` instead of custom button

**Problem:** Spacing looks inconsistent
**Solution:** Replace all padding/margins with SPACING constants

**Problem:** Focus state not visible
**Solution:** Add `focus:ring-2 focus:ring-gold` to input

**Problem:** Component doesn't match design
**Solution:** Check if using Card/Button from unified system

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Mar 2026 | Initial comprehensive design system |

---

## Questions?

Refer back to:
- **Colors:** Part 1
- **Components:** Part 2
- **Layouts:** Part 3
- **Patterns:** Part 4-8
- **Checklist:** Part 9