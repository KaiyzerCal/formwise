# 🎨 Unified UI Component Library

This directory contains world-class, reusable components that form the foundation of Bioneer's design system.

## Components

### Buttons (`buttons/Button.jsx`)

5 button types covering all use cases:

```jsx
import { PrimaryButton, SecondaryButton, TertiaryButton, DangerButton, IconButton } from '@/components/ui';

// Main action
<PrimaryButton icon={Send}>Share</PrimaryButton>

// Supporting action
<SecondaryButton>Cancel</SecondaryButton>

// Minimal action
<TertiaryButton>View All</TertiaryButton>

// Destructive
<DangerButton icon={Trash2}>Delete</DangerButton>

// Icon only
<IconButton icon={X} title="Close" />
```

### Cards (`cards/Card.jsx`)

Compose cards for grouped content:

```jsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui';

<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>Actions</CardFooter>
</Card>
```

### Badge (`Badge.jsx`)

Tags and labels with semantic variants:

```jsx
import { Badge } from '@/components/ui';

<Badge variant="success">Completed</Badge>
<Badge variant="warning">Caution</Badge>
<Badge variant="error">Failed</Badge>
```

### Divider (`Divider.jsx`)

Visual separator between sections:

```jsx
import { Divider } from '@/components/ui';

<Divider />
```

### Spacer (`Spacer.jsx`)

Consistent vertical/horizontal rhythm:

```jsx
import { Spacer } from '@/components/ui';

<Spacer size="md" direction="vertical" />
```

## Single Import Point

All components are exported from `index.js`:

```jsx
import {
  PrimaryButton,
  SecondaryButton,
  TertiaryButton,
  DangerButton,
  IconButton,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Divider,
  Spacer,
} from '@/components/ui';
```

## Design Principles

1. **No variants needed** — Component structure defines hierarchy
2. **Minimal props** — Most styling is automatic
3. **Standard sizing** — 44×44px min for touch (buttons)
4. **Built-in a11y** — Focus states included
5. **Zero JavaScript logic** — Pure styling components

## Usage Patterns

### Pattern 1: Card with Actions

```jsx
<Card>
  <CardHeader>Session Details</CardHeader>
  <CardBody>Score: 85</CardBody>
  <CardFooter>
    <SecondaryButton>Cancel</SecondaryButton>
    <PrimaryButton>Save</PrimaryButton>
  </CardFooter>
</Card>
```

### Pattern 2: Stats Grid

```jsx
<div className="grid grid-cols-3 gap-md">
  <StatCard label="Score" value="85" />
  <StatCard label="Reps" value="12" />
  <StatCard label="Time" value="2:14" />
</div>
```

### Pattern 3: List with Actions

```jsx
<Card>
  <CardBody className="space-y-md">
    {items.map(item => (
      <div key={item.id} className="flex justify-between">
        <div>
          <h4>{item.name}</h4>
          <Badge variant="neutral">{item.status}</Badge>
        </div>
        <PrimaryButton size="sm">View</PrimaryButton>
      </div>
    ))}
  </CardBody>
</Card>
```

## Color Reference

All components use the COLORS design system:

```jsx
import { COLORS } from '@/components/bioneer/ui/DesignTokens';

style={{ color: COLORS.gold }}           // Primary accent
style={{ color: COLORS.textPrimary }}    // Main text
style={{ color: COLORS.textSecondary }}  // Secondary text
style={{ color: COLORS.correct }}        // Success
style={{ color: COLORS.warning }}        // Warning
style={{ color: COLORS.fault }}          // Error
```

## Spacing Reference

All components use the SPACING system:

```jsx
import { SPACING } from '@/lib/spacingSystem';

style={{ padding: SPACING.md }}          // 12px (default)
className="gap-lg"                       // 16px gap
className="space-y-xl"                   // 20px vertical spacing
```

## Accessibility Built-In

✅ **All buttons:**
- Focus visible state
- 44×44px minimum (touch-safe)
- Keyboard navigation
- Proper ARIA attributes

✅ **All cards:**
- Semantic structure
- Semantic color contrast
- No flashing or motion

## Migration Guide

Existing code continues to work. Gradually adopt the system:

**Before:**
```jsx
<button style={{ background: '#c9a227', color: 'white', padding: '12px 16px' }}>
  Click
</button>
```

**After:**
```jsx
<PrimaryButton>Click</PrimaryButton>
```

## Questions?

1. **Component API** → See `DESIGN_SYSTEM.md`
2. **Quick examples** → See `QUICK_START_DESIGN.md`
3. **Source code** → Check individual `.jsx` files

## Future Enhancements

Planned (not required):
- [ ] Storybook for component showcase
- [ ] Interactive documentation
- [ ] Visual regression testing
- [ ] Usage analytics

---

**All components are production-ready and tested for accessibility.**