-- ============================================================
-- Migration 002 — add video_url to form_sessions + leaderboard policy
-- ============================================================

-- Add missing video_url column to form_sessions
alter table public.form_sessions
  add column if not exists video_url text;

-- Allow any authenticated user to read all profiles for leaderboard
-- (only exposes non-sensitive fields; RLS on other tables is unchanged)
do $$ begin
  drop policy if exists "Authenticated leaderboard read" on public.user_profiles;
exception when others then null;
end $$;

create policy "Authenticated leaderboard read"
  on public.user_profiles for select
  using (auth.uid() is not null);

-- Index to support the leaderboard ORDER BY xp_total query efficiently
create index if not exists idx_user_profiles_leaderboard
  on public.user_profiles(xp_total desc, level desc);
