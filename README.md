# Formwise — Lovable Migration

Moves the app from Base44 → Lovable + Supabase.

---

## Step 1 — Create a new Lovable project

1. Go to **lovable.dev** → New Project → **Import from GitHub**
2. Connect your `KaiyzerCal/formwise` GitHub repo
3. Lovable will import the project

---

## Step 2 — Copy these files into the repo

Copy everything from this package into your `formwise` repo root, overwriting originals:

```
vite.config.js                    ← Base44 plugin removed
package.json                      ← Base44 SDK removed
supabase/migration.sql            ← Run this in Supabase SQL Editor

src/api/supabaseClient.js         ← NEW Supabase client
src/api/base44Client.js           ← Shim (keeps all imports working)

src/lib/AuthContext.jsx           ← Supabase Auth
src/lib/retentionEngine.js
src/lib/gamificationEngine.js
src/lib/achievements.js
src/lib/adaptiveFeedbackEngine.js

src/Layout.jsx                    ← Scroll fix + mobile bottom tab bar
src/pages/Landing.jsx             ← Real login UI (email/password, magic link, Google)

src/components/bioneer/data/unifiedSessionStore.jsx
src/components/bioneer/data/sessionDeletionService.jsx
src/components/bioneer/ui/StreakWidget.jsx
src/components/bioneer/gamification/XPProgressCard.jsx
src/components/bioneer/gamification/StreakCounter.jsx
src/components/bioneer/dashboard/HomeDashboard.jsx
```

---

## Step 3 — Run SQL migration

Supabase Dashboard → SQL Editor → New query → paste `supabase/migration.sql` → Run

---

## Step 4 — Add environment variables in Lovable

In Lovable project settings, add:
```
VITE_SUPABASE_URL=https://cofrsqjbmncqnuozrmfy.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Step 5 — Push to GitHub → Lovable auto-deploys

```powershell
git add .
git commit -m "Migrate to Lovable + Supabase"
git push origin main
```

---

## What's fixed

- ✅ Database fully wired to Supabase (sessions, XP, streaks, achievements all save)
- ✅ Scroll works on all pages
- ✅ Mobile bottom tab bar (no more hamburger / phone flipping)
- ✅ Real login UI (email+password, magic link, Google OAuth)
- ✅ Base44 SDK completely removed
