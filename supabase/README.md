# Not in use

Nothing in this directory is wired to the application. It is preparation for a
Base44 → Supabase migration that was planned but never carried out.

Kept because it represents real design work — the schema, the RLS policies and
a port of the `geminiCoach` function are the head start for that migration if
it ever happens — and deleting it would leave no trace that it had been
considered.

## Current state

| File | Status |
|---|---|
| `migration.sql` | Never applied |
| `migrations/002_video_url_leaderboard.sql` | Never applied |
| `migrations/003_movement_profiles.sql` | Never applied |
| `functions/geminiCoach/index.ts` | Port of a function that currently runs on Base44 |

`geminiCoach` is worth calling out: the app invokes it today via
`base44.functions.invoke('geminiCoach', …)` from
`src/components/bioneer/ai/GeminiCoach.jsx`. The copy here is the Supabase
version of that same function, written ahead of a move. The Base44 one is the
one actually serving traffic.

## If you pick this up again

`@supabase/supabase-js` was removed from `package.json`. It had been declared
and installed with zero imports anywhere in `src/`, which made the repo read
as though it were already running on Supabase — the root README asserted
"Database fully wired to Supabase" and "Base44 SDK completely removed" while
both were false. Reinstall it when the migration is actually underway, not
before.

The Base44 surface that would need replacing is inventoried in the root
README, along with the two genuinely hard parts: auth is a hosted redirect
flow with no local session handling, and runtime identity (`app_id`,
`access_token`) is injected by the platform at launch rather than configured.
