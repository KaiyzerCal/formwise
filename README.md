# Formwise

Camera-based movement coaching. MediaPipe pose landmarks drive live form
feedback, rep counting and per-joint fault detection across ~50 exercises,
with voice cues during the set and a biomechanics report after it.

## Stack

- **React + Vite** (JavaScript, not TypeScript)
- **Base44** — backend, auth, hosted functions, and the build plugin
- **MediaPipe** — pose estimation, loaded from CDN at runtime
- **Vitest** — unit tests over the pose maths and rep state machine

```bash
npm install
npm run dev      # vite dev server
npm test         # vitest
npm run lint     # eslint
npm run build    # production build
```

## Backend: this app runs on Base44

Worth stating plainly, because a previous version of this file claimed
otherwise: **the app is entirely backed by Base44.** There is no Supabase
client anywhere in `src/`. Auth, data and server functions all go through the
Base44 SDK.

The client is constructed in exactly one place — `src/api/base44Client.js` —
and every consumer imports `base44` from there.

### What the app depends on

The full Base44 surface in use, so the cost of ever moving is estimable
rather than guessed at:

| Namespace | Used for |
|---|---|
| `base44.entities` | `FormSession`, `UserProfile`, `WorkoutPlan`, `ExerciseFaultHistory`, `UserAchievement`, `ReferenceVideo`, `ExerciseTracking`, `User` |
| `base44.auth` | `isAuthenticated`, `me`, `logout`, `redirectToLogin` |
| `base44.functions` | `invoke('geminiCoach', …)` |
| `base44.integrations` | `Core` |
| `base44.users` | `inviteUser` |
| `base44.agents`, `base44.analytics` | present in the SDK surface |

Two of these are more entangled than the rest:

- **Auth is a hosted redirect flow.** `redirectToLogin()` hands off to Base44;
  there is no local session or credential handling in this repo. Replacing it
  means writing auth, not swapping a library.
- **Runtime identity comes from the platform.** `src/lib/app-params.js` reads
  `app_id` and `access_token` from URL parameters (falling back to
  localStorage), which Base44 injects when it launches the app. That is why
  there is no `.env` here and never needed to be — and why a build served from
  anywhere else has no way to bootstrap itself.

### Build-time coupling (resolved)

`vite.config.js` now declares the `@/` → `src/` alias itself. It used to rely
on `@base44/vite-plugin` injecting it, which meant the ~300 files importing
via `@/` all depended on the plugin loading successfully. The production build
now completes with the plugin disabled, so module resolution is no longer
platform-dependent. The plugin still provides HMR, navigation and analytics
notifiers and the visual-edit agent.

## Tests

```bash
npm test
```

Covers the two purest and most regression-prone units: the pose geometry in
`src/components/bioneer/compare/poseUtils.jsx` and the rep-detection state
machine in `src/components/bioneer/repCounter.jsx`. Both suites were
mutation-checked — deliberately broken source is confirmed to fail them.

Two behaviours are pinned by tests as documentation rather than endorsement:
`angleBetween` ignores the z axis (it is a 2D projection, not a true 3D joint
angle), and `repCounter.reset()` re-enters calibration and discards thresholds
learned during the current session.

## `supabase/`

Prepared for a migration that has not happened. See `supabase/README.md`.
Nothing in the application reads from it.
