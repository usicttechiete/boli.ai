-- ============================================================
-- BOLI.AI — Database Schema (run once in Supabase SQL Editor)
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  native_language text not null default 'hindi',
  target_language text not null default 'english',
  daily_goal_mins integer not null default 10,
  streak_days integer not null default 0,
  last_active_date date,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS: users can only read/write their own profile
alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, native_language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'native_language', 'hindi')
  );
  return new;
end;
$$;

-- Trigger: fire after new user is created in auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- DIALECT PROFILES
-- ============================================================
create table if not exists public.dialect_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  detected_region text,                        -- 'hindi_belt' | 'south_india' | 'bengal' | etc
  weak_phonemes jsonb default '[]'::jsonb,     -- [{phoneme: string, severity: 'low'|'med'|'high'}]
  filler_patterns jsonb default '{}'::jsonb,   -- {word: count} e.g. {"basically": 12, "um": 8}
  avg_wpm_baseline float,                      -- from onboarding sessions
  onboarding_session_ids uuid[] default '{}',  -- links to sessions table
  updated_at timestamptz not null default now()
);

alter table public.dialect_profiles enable row level security;

create policy "Users can manage own dialect profile" on public.dialect_profiles
  for all using (auth.uid() = user_id);


-- ============================================================
-- SESSIONS (single recording + analysis result)
-- ============================================================
create type if not exists session_type as enum ('practice', 'drill', 'shadow', 'onboarding');

create table if not exists public.sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type session_type not null default 'practice',
  prompt_text text,                            -- what user was asked to say (drill/shadow)
  transcript text,                             -- Sarvam STT output
  wpm float,
  accuracy_score float,                        -- 0–100, null for free practice
  filler_count integer not null default 0,
  filler_words_found text[] default '{}',
  llm_tips text[] default '{}',
  audio_url text,                              -- Supabase Storage signed URL
  duration_secs float,
  overall_score float,                         -- weighted avg
  created_at timestamptz not null default now()
);

alter table public.sessions enable row level security;

create policy "Users can manage own sessions" on public.sessions
  for all using (auth.uid() = user_id);

-- Index for fast history queries
create index if not exists sessions_user_created on public.sessions (user_id, created_at desc);
create index if not exists sessions_user_type on public.sessions (user_id, type);


-- ============================================================
-- INTERVIEW SESSIONS
-- ============================================================
create table if not exists public.interview_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category text not null default 'hr',         -- 'hr' | 'technical' | 'situational'
  questions jsonb not null default '[]'::jsonb,
  answers jsonb not null default '[]'::jsonb,
  current_question_index integer not null default 0,
  overall_score float,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.interview_sessions enable row level security;

create policy "Users can manage own interview sessions" on public.interview_sessions
  for all using (auth.uid() = user_id);

create index if not exists interview_sessions_user on public.interview_sessions (user_id, created_at desc);


-- ============================================================
-- DRILL SESSIONS
-- ============================================================
create table if not exists public.drill_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  target_phonemes text[] default '{}',
  sentences text[] not null,
  session_ids uuid[] default '{}',
  scores float[] default '{}',
  avg_score float,
  created_at timestamptz not null default now()
);

alter table public.drill_sessions enable row level security;

create policy "Users can manage own drill sessions" on public.drill_sessions
  for all using (auth.uid() = user_id);
