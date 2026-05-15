-- ============================================================
-- Migration 003 — movement_profiles table
-- Moves exercise definitions from hardcoded JS to the database,
-- making them editable without a code deploy.
-- ============================================================

create table if not exists public.movement_profiles (
  id                   text primary key,
  name                 text not null,
  category             text not null check (category in ('strength','calisthenics','athletic','rotational','locomotion','rehab')),
  movement_type        text,
  primary_joints       jsonb not null default '[]',
  phases               jsonb not null default '[]',
  joint_ranges         jsonb not null default '{}',
  faults               jsonb not null default '[]',
  rep_logic            jsonb,
  primary_angle_key    text,
  secondary_angle_key  text,
  lockout_angle        numeric,
  min_rep_ms           integer,
  visibility_joints    jsonb default '[]',
  phase_map            jsonb default '{}',
  thresholds           jsonb default '{}',
  cue_map              jsonb default '{}',
  fault_rules          jsonb default '[]',
  is_builtin           boolean default true,
  created_by           uuid references auth.users(id) on delete set null,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

create trigger movement_profiles_updated_at
  before update on public.movement_profiles
  for each row execute procedure public.handle_updated_at();

-- RLS: anyone can read built-in profiles; users can manage their own custom ones
alter table public.movement_profiles enable row level security;

create policy "Public read built-in profiles"
  on public.movement_profiles for select
  using (is_builtin = true or auth.uid() = created_by);

create policy "Users manage own custom profiles"
  on public.movement_profiles for all
  using (auth.uid() = created_by and is_builtin = false)
  with check (auth.uid() = created_by and is_builtin = false);

create index if not exists idx_movement_profiles_category
  on public.movement_profiles(category);

-- ── Seed with existing built-in profiles ─────────────────────────────────────
insert into public.movement_profiles
  (id, name, category, movement_type, primary_joints, phases, joint_ranges, faults, rep_logic)
values
  ('squat', 'Barbell Squat', 'strength', 'strength',
   '["hip","knee","ankle"]',
   '["start","eccentric","bottom","concentric","lockout"]',
   '{"knee":{"ideal":[70,110],"warning":[60,120],"danger":[50,130]},"hip":{"ideal":[60,120],"warning":[50,130],"danger":[40,140]},"ankle":{"ideal":[80,110],"warning":[70,120],"danger":[60,130]}}',
   '["knee_valgus","forward_torso","hip_shift","insufficient_depth","heel_lift"]',
   '{"startAngle":170,"bottomAngle":70}'),

  ('benchpress', 'Bench Press', 'strength', 'strength',
   '["shoulder","elbow","wrist"]',
   '["start","descent","bottom","ascent","lockout"]',
   '{"elbow":{"ideal":[75,95],"warning":[70,100],"danger":[60,110]},"shoulder":{"ideal":[40,80],"warning":[30,90],"danger":[20,100]},"wrist":{"ideal":[165,180],"warning":[155,180],"danger":[145,180]}}',
   '["uneven_arm_path","excessive_arch","wrist_deviation","elbow_flare","bar_path_deviation"]',
   '{"startAngle":180,"bottomAngle":75}'),

  ('deadlift', 'Deadlift', 'strength', 'strength',
   '["hip","knee","spine"]',
   '["setup","pull","mid_pull","lockout"]',
   '{"hip":{"ideal":[35,55],"warning":[25,65],"danger":[15,75]},"knee":{"ideal":[30,50],"warning":[20,60],"danger":[10,70]},"spine":{"ideal":[0,15],"warning":[0,25],"danger":[0,40]}}',
   '["spine_rounding","bar_drift","hip_squat_pattern","poor_start","soft_lockout"]',
   '{"startAngle":90,"bottomAngle":35}'),

  ('overhead_press', 'Overhead Press', 'strength', 'strength',
   '["shoulder","elbow","core"]',
   '["start","press","lockout"]',
   '{"elbow":{"ideal":[80,100],"warning":[70,110],"danger":[60,120]},"shoulder":{"ideal":[150,180],"warning":[140,180],"danger":[130,180]}}',
   '["forward_lean","elbow_flare","wrist_deviation","hip_thrust"]',
   '{"startAngle":80,"lockoutAngle":175}'),

  ('pull_up', 'Pull-Up', 'calisthenics', 'calisthenics',
   '["shoulder","elbow","core"]',
   '["hang","pull","top","lower"]',
   '{"elbow":{"ideal":[130,170],"warning":[120,180],"danger":[110,180]},"shoulder":{"ideal":[30,70],"warning":[20,80],"danger":[10,90]}}',
   '["kipping","insufficient_height","head_forward","shrugging"]',
   '{"startAngle":170,"bottomAngle":60}'),

  ('romanian_deadlift', 'Romanian Deadlift', 'strength', 'strength',
   '["hip","knee","spine"]',
   '["start","hinge","bottom","return"]',
   '{"hip":{"ideal":[50,80],"warning":[40,90],"danger":[30,100]},"knee":{"ideal":[150,175],"warning":[140,180],"danger":[130,180]},"spine":{"ideal":[0,15],"warning":[0,25],"danger":[0,35]}}',
   '["spine_rounding","knee_bend_excess","shoulder_drop","bar_drift"]',
   '{"startAngle":175,"bottomAngle":55}'),

  ('lunge', 'Lunge', 'strength', 'strength',
   '["hip","knee","ankle"]',
   '["start","step","descent","ascent"]',
   '{"knee":{"ideal":[85,95],"warning":[80,105],"danger":[70,115]},"hip":{"ideal":[80,100],"warning":[70,110],"danger":[60,120]}}',
   '["knee_past_toe","trunk_lean","hip_drop","valgus_knee"]',
   '{"startAngle":175,"bottomAngle":85}'),

  ('plank', 'Plank', 'calisthenics', 'isometric',
   '["core","shoulder","hip"]',
   '["hold"]',
   '{"hip":{"ideal":[175,185],"warning":[165,195],"danger":[155,205]},"shoulder":{"ideal":[85,95],"warning":[80,100],"danger":[75,105]}}',
   '["hip_sag","hip_pike","head_drop","elbow_drift"]',
   '{"holdDuration":"duration_based"}')

on conflict (id) do update set
  name        = excluded.name,
  joint_ranges = excluded.joint_ranges,
  faults      = excluded.faults,
  rep_logic   = excluded.rep_logic,
  updated_at  = now();
