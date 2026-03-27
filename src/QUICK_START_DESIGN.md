# 🚀 Design System Quick Start

**Use this guide to build new features that match world-class standards.**

---

## 30-Second Onboarding

### 1. Import the button system
```jsx
import { PrimaryButton, SecondaryButton, DangerButton } from '@/components/ui';
```

### 2. Import colors & spacing
```jsx
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
import { SPACING } from '@/lib/spacingSystem';
```

### 3. Import cards
```jsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui';
```

### 4. Build your component
```jsx
export default function MyFeature() {
  return (
    <div style={{ padding: SPACING.lg }}>
      <Card>
        <CardHeader>
          <h2 style={{ color: COLORS.gold }}>Feature Title</h2>
        </CardHeader>
        <CardBody className="space-y-md">
          <p style={{ color: COLORS.textSecondary }}>Description</p>
          <PrimaryButton>Action</PrimaryButton>
        </CardBody>
      </Card>
    </div>
  );
}
```

Done. ✅

---

## Component Cheatsheet

### Buttons

| When | Use | Code |
|------|-----|------|
| Main action | `PrimaryButton` | `<PrimaryButton icon={Send}>Share</PrimaryButton>` |
| Supporting action | `SecondaryButton` | `<SecondaryButton>Settings</SecondaryButton>` |
| Lightweight action | `TertiaryButton` | `<TertiaryButton>View All</TertiaryButton>` |
| Destructive | `DangerButton` | `<DangerButton icon={Trash2}>Delete</DangerButton>` |
| Icon only | `IconButton` | `<IconButton icon={X} title="Close" />` |

### Cards

| Part | Use |
|------|-----|
| `<Card>` | Wrapper, provides styling |
| `<CardHeader>` | Title area, auto border |
| `<CardBody>` | Content area, auto spacing |
| `<CardFooter>` | Actions, auto border |

### Colors

| For | Use | Example |
|-----|-----|---------|
| Text | `COLORS.textPrimary` | Default text |
| Muted text | `COLORS.textSecondary` | Nav, hints |
| Very muted | `COLORS.textTertiary` | Disabled, hints |
| Success | `COLORS.correct` | Green badges |
| Warning | `COLORS.warning` | Orange alerts |
| Error | `COLORS.fault` | Red errors |
| Accent | `COLORS.gold` | CTA, active states |

### Spacing

| Size | Pixels | Use |
|------|--------|-----|
| `xs` | 4px | Between small elements |
| `sm` | 8px | Button padding |
| `md` | 12px | **Default spacing** |
| `lg` | 16px | Section gaps |
| `xl` | 20px | Major sections |
| `2xl` | 24px | Large gaps |

### Badges

```jsx
import { Badge } from '@/components/ui';

<Badge variant="default">Active</Badge>
<Badge variant="success">Good</Badge>
<Badge variant="warning">Caution</Badge>
<Badge variant="error">Failed</Badge>
<Badge variant="neutral">Neutral</Badge>
```

---

## Real Examples

### Example 1: Session Summary Card

```jsx
import { Card, CardBody } from '@/components/ui';
import { StatCard } from '@/components/bioneer/ui/StatCard';

export default function SessionSummary() {
  return (
    <div className="grid grid-cols-3 gap-md">
      <StatCard label="Score" value="85" color={COLORS.gold} />
      <StatCard label="Reps" value="12" color={COLORS.correct} />
      <StatCard label="Time" value="2:14" color={COLORS.textSecondary} />
    </div>
  );
}
```

### Example 2: Action Card

```jsx
import { Card, CardBody, CardFooter } from '@/components/ui';
import { PrimaryButton, SecondaryButton } from '@/components/ui';

export default function ConfirmDelete() {
  return (
    <Card>
      <CardBody>
        <p style={{ color: COLORS.fault }}>Delete this session?</p>
      </CardBody>
      <CardFooter>
        <SecondaryButton>Cancel</SecondaryButton>
        <DangerButton>Delete</DangerButton>
      </CardFooter>
    </Card>
  );
}
```

### Example 3: List with Badges

```jsx
import { Badge } from '@/components/ui';

export default function SessionList() {
  return (
    <div className="space-y-md">
      {sessions.map(s => (
        <Card key={s.id} className="p-md">
          <div className="flex justify-between">
            <div>
              <h3 style={{ color: COLORS.textPrimary }}>{s.name}</h3>
              <Badge variant="success">Completed</Badge>
            </div>
            <PrimaryButton size="sm">View</PrimaryButton>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

---

## Don't Do This ❌

```jsx
// ❌ Bad: inline colors
<button style={{ background: '#c9a227', color: 'white', padding: '12px 16px' }}>
  Click
</button>

// ❌ Bad: arbitrary spacing
<div className="px-[13px] py-[7px]">
  Content
</div>

// ❌ Bad: custom card styling
<div style={{ background: '#0b0b0b', border: '1px solid #191919', padding: '16px' }}>
  Content
</div>

// ❌ Bad: no focus state
<button>Click me</button>
```

## Do This Instead ✅

```jsx
// ✅ Good: use button system
<PrimaryButton>Click</PrimaryButton>

// ✅ Good: use SPACING
<div style={{ padding: SPACING.md }}>
  Content
</div>

// ✅ Good: use Card
<Card>
  <CardBody>Content</CardBody>
</Card>

// ✅ Good: button system includes focus
<SecondaryButton>Click me</SecondaryButton>
```

---

## Responsive Design

Use Tailwind breakpoints + design system:

```jsx
export default function ResponsiveGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
      {/* Cards auto-stack on mobile */}
      {items.map(item => (
        <Card key={item.id}>
          <CardBody>{item.name}</CardBody>
        </Card>
      ))}
    </div>
  );
}
```

---

## Mobile-First Tips

1. **Touch targets:** Min 44×44px (buttons are already this)
2. **Spacing:** Use `gap-md` between elements
3. **Text:** Readable at 375px width
4. **Avoid horizontal scroll:** Let content stack

---

## Accessibility Checklist

- [ ] Buttons have visible focus state (auto with button system)
- [ ] Links have `aria-label` or visible text
- [ ] Images have `alt` text
- [ ] Form inputs have `<label>` tags
- [ ] Color not only indicator (use badges, text, icons)
- [ ] Contrast passes WCAG AA (our palette does)

---

## Common Patterns

### Loading State
```jsx
<div className="flex items-center gap-2">
  <div className="w-4 h-4 border-2 border-gray-700 border-t-gold rounded-full animate-spin" />
  <span style={{ color: COLORS.textSecondary }}>Loading...</span>
</div>
```

### Empty State
```jsx
<Card className="py-12">
  <CardBody className="text-center">
    <BarChart3 size={32} style={{ color: COLORS.gold }} />
    <h3 style={{ color: COLORS.textSecondary }} className="mt-md">No Sessions Yet</h3>
    <PrimaryButton className="mt-md">Start Training</PrimaryButton>
  </CardBody>
</Card>
```

### Error Message
```jsx
<div className="p-md rounded border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' }}>
  <p style={{ color: '#EF4444' }}>Something went wrong</p>
</div>
```

### Success Toast
```jsx
<div className="p-md rounded border" style={{ background: COLORS.goldDim, borderColor: COLORS.goldBorder }}>
  <p style={{ color: COLORS.gold }}>✓ Saved successfully</p>
</div>
```

---

## When Stuck

| Question | Answer |
|----------|--------|
| What button should I use? | Check "Buttons" table above |
| What color for text? | Use `textPrimary`, `textSecondary`, or `textTertiary` |
| How much padding? | Use `SPACING.md` (12px is default) |
| How to style a card? | Use `<Card>` component |
| How to make a badge? | Use `<Badge variant="...">` |
| What about focus state? | Button system handles it automatically |

---

## One-Minute PR Review

Ask yourself:

1. Are buttons from the button system? ✅
2. Are colors from COLORS tokens? ✅
3. Are spacing values from SPACING? ✅
4. Are cards from Card component? ✅
5. Does it work on mobile? ✅
6. Is text readable? ✅

If all ✅ → merge it!

---

## Your First Component

```jsx
import React from 'react';
import { PrimaryButton, Card, CardBody, CardHeader } from '@/components/ui';
import { COLORS } from '@/components/bioneer/ui/DesignTokens';
import { SPACING } from '@/lib/spacingSystem';

export default function MyFirstComponent() {
  return (
    <div style={{ padding: SPACING.lg }}>
      <Card>
        <CardHeader>
          <h2 style={{ color: COLORS.gold }}>Hello World</h2>
        </CardHeader>
        <CardBody>
          <p style={{ color: COLORS.textSecondary }}>
            This is a world-class component.
          </p>
          <PrimaryButton className="mt-md">
            Get Started
          </PrimaryButton>
        </CardBody>
      </Card>
    </div>
  );
}
```

Copy, customize, ship. 🚀

---

## Questions?

1. **Need a specific button?** Check `/components/ui/buttons/Button.jsx`
2. **Need a specific color?** Check `DesignTokens.js`
3. **Need spacing help?** Check `/lib/spacingSystem.js`
4. **Full documentation?** See `DESIGN_SYSTEM.md