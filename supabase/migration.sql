-- ============================================================
-- Formwise — Supabase Migration
-- Run this entire script in:
--   Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── form_sessions ─────────────────────────────────────────────────────────────
create table if not exists public.form_sessions (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  exercise_id          text not null,
  category             text check (category in ('strength','sports','athletic','rotational','locomotion')) default 'strength',
  duration_seconds     numeric default 0,
  session_status       text check (session_status in ('complete','partial','low_confidence')) default 'complete',
  started_at           timestamptz default now(),
  form_score_overall   numeric default 0,
  movement_score       numeric default 0,
  form_score_peak      numeric default 0,
  form_score_lowest    numeric default 0,
  average_form_score   numeric default 0,
  highest_form_score   numeric default 0,
  lowest_form_score    numeric default 0,
  mastery_avg          numeric default 0,
  tracking_confidence  numeric default 0,
  reps_detected        numeric default 0,
  rep_count            numeric default 0,
  movement_id          text,
  movement_name        text,
  alerts               jsonb default '[]',
  phases               jsonb default '{}',
  form_timeline        jsonb default '[]',
  top_faults           jsonb default '[]',
  risk_flags           jsonb default '[]',
  coaching_events      jsonb default '[]',
  rep_summaries        jsonb default '[]',
  body_side_bias       text check (body_side_bias in ('balanced','left','right')) default 'balanced',
  coaching_intensity   text check (coaching_intensity in ('minimal','moderate','detailed')) default 'moderate',
  coaching_enabled     boolean default true,
  coaching_notes       jsonb default '[]',
  coach_flagged        boolean default false,
  movement_profile_id  text,
  learning             jsonb,
  is_deleted           boolean default false,
  deleted_at           timestamptz,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- ── user_profiles ─────────────────────────────────────────────────────────────
create table if not exists public.user_profiles (
  id                           uuid primary key default uuid_generate_v4(),
  user_id                      uuid not null unique references auth.users(id) on delete cascade,
  email                        text,
  role                         text check (role in ('user','coach','admin')) default 'user',
  total_sessions               integer default 0,
  current_streak               integer default 0,
  longest_streak               integer default 0,
  last_session_date            timestamptz,
  xp_total                     integer default 0,
  level                        integer default 1,
  push_notifications_enabled   boolean default true,
  preferred_notification_time  text,
  goal                         text check (goal in ('strength','aesthetics','confidence','health')),
  experience_level             text check (experience_level in ('beginner','intermediate','advanced')),
  created_at                   timestamptz default now(),
  updated_at                   timestamptz default now()
);

-- ── workout_plans ─────────────────────────────────────────────────────────────
create table if not exists public.workout_plans (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  name                     text not null,
  goal                     text check (goal in ('strength','aesthetics','confidence','health')) not null,
  difficulty               text check (difficulty in ('beginner','intermediate','advanced')) not null,
  exercises                jsonb not null default '[]',
  frequency_per_week       integer not null,
  duration_weeks           integer not null,
  total_planned_sessions   integer not null,
  completed_sessions       integer default 0,
  started_at               timestamptz,
  status                   text check (status in ('active','completed','paused')) default 'active',
  generated_from_analysis  boolean default true,
  performance_notes        text,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

-- ── exercise_fault_history ────────────────────────────────────────────────────
create table if not exists public.exercise_fault_history (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  exercise_id        text not null,
  fault_id           text not null,
  fault_name         text not null,
  first_occurrence   timestamptz default now(),
  last_occurrence    timestamptz default now(),
  total_occurrences  integer default 1,
  is_resolved        boolean default false,
  improvement_date   timestamptz,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now(),
  unique(user_id, exercise_id, fault_id)
);

-- ── exercise_tracking ─────────────────────────────────────────────────────────
create table if not exists public.exercise_tracking (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  workout_plan_id  uuid references public.workout_plans(id) on delete cascade,
  exercise_id      text not null,
  exercise_name    text not null,
  weight           numeric not null,
  reps             integer not null,
  sets             integer not null,
  logged_date      timestamptz not null,
  notes            text,
  created_at       timestamptz default now()
);

-- ── user_achievements ─────────────────────────────────────────────────────────
create table if not exists public.user_achievements (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  achievement_id  text not null,
  title           text not null,
  earned_at       timestamptz default now(),
  created_at      timestamptz default now(),
  unique(user_id, achievement_id)
);

-- ── reference_videos ─────────────────────────────────────────────────────────
create table if not exists public.reference_videos (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  exercise_id    text,
  title          text,
  file_url       text,
  storage_path   text,
  processed      boolean default false,
  skeleton_data  jsonb,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ── updated_at triggers ───────────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger form_sessions_updated_at          before update on public.form_sessions          for each row execute procedure public.handle_updated_at();
create trigger user_profiles_updated_at          before update on public.user_profiles          for each row execute procedure public.handle_updated_at();
create trigger workout_plans_updated_at          before update on public.workout_plans          for each row execute procedure public.handle_updated_at();
create trigger exercise_fault_history_updated_at before update on public.exercise_fault_history for each row execute procedure public.handle_updated_at();
create trigger reference_videos_updated_at       before update on public.reference_videos       for each row execute procedure public.handle_updated_at();

-- ── Auto-create profile on signup ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do update set email = excluded.email;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.form_sessions          enable row level security;
alter table public.user_profiles          enable row level security;
alter table public.workout_plans          enable row level security;
alter table public.exercise_fault_history enable row level security;
alter table public.exercise_tracking      enable row level security;
alter table public.user_achievements      enable row level security;
alter table public.reference_videos       enable row level security;

-- Drop existing policies to allow re-running safely
do $$ begin
  drop policy if exists "Users manage own sessions"         on public.form_sessions;
  drop policy if exists "Coaches read all sessions"         on public.form_sessions;
  drop policy if exists "Public session share"              on public.form_sessions;
  drop policy if exists "Users manage own profile"          on public.user_profiles;
  drop policy if exists "Coaches read all profiles"         on public.user_profiles;
  drop policy if exists "Users manage own workout plans"    on public.workout_plans;
  drop policy if exists "Users manage own fault history"    on public.exercise_fault_history;
  drop policy if exists "Users manage own exercise tracking"on public.exercise_tracking;
  drop policy if exists "Users manage own achievements"     on public.user_achievements;
  drop policy if exists "Users manage own reference videos" on public.reference_videos;
exception when others then null;
end $$;

-- form_sessions
create policy "Users manage own sessions"
  on public.form_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Coaches read all sessions"
  on public.form_sessions for select
  using (exists (select 1 from public.user_profiles where user_id = auth.uid() and role in ('coach','admin')));
create policy "Public session share"
  on public.form_sessions for select using (is_deleted = false);

-- user_profiles
create policy "Users manage own profile"
  on public.user_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Coaches read all profiles"
  on public.user_profiles for select
  using (exists (select 1 from public.user_profiles up where up.user_id = auth.uid() and up.role in ('coach','admin')));

-- other tables
create policy "Users manage own workout plans"     on public.workout_plans          for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own fault history"     on public.exercise_fault_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own exercise tracking" on public.exercise_tracking      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own achievements"      on public.user_achievements      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own reference videos"  on public.reference_videos       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists idx_form_sessions_user_started  on public.form_sessions(user_id, started_at desc);
create index if not exists idx_form_sessions_is_deleted    on public.form_sessions(is_deleted);
create index if not exists idx_form_sessions_exercise      on public.form_sessions(exercise_id);
create index if not exists idx_user_profiles_user_id       on public.user_profiles(user_id);
create index if not exists idx_user_profiles_xp            on public.user_profiles(xp_total desc);
create index if not exists idx_workout_plans_user_id       on public.workout_plans(user_id, started_at desc);
create index if not exists idx_fault_history_user_exercise on public.exercise_fault_history(user_id, exercise_id);
create index if not exists idx_exercise_tracking_user_plan on public.exercise_tracking(user_id, workout_plan_id);
create index if not exists idx_achievements_user_id        on public.user_achievements(user_id);
create index if not exists idx_reference_videos_user_id    on public.reference_videos(user_id);
