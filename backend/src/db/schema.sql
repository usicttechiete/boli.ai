-- ============================================================
-- BOLI.AI — Database Schema (run once in Supabase SQL Editor)
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- SUPPORTED LANGUAGES (Source of Truth)
-- ============================================================
create table if not exists public.supported_languages (
  code text primary key, -- e.g., 'hindi', 'english'
  name text not null,
  native_name text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Seed initial languages
insert into public.supported_languages (code, name, native_name) values
('hindi', 'Hindi', 'हिन्दी'),
('english', 'English', 'English'),
('marathi', 'Marathi', 'मराठी'),
('tamil', 'Tamil', 'தமிழ்'),
('telugu', 'Telugu', 'తెలుగు'),
('bengali', 'Bengali', 'বাংলা')
on conflict (code) do nothing;

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  native_language text not null default 'hindi' references public.supported_languages(code) on update cascade,
  target_language text not null default 'english' references public.supported_languages(code) on update cascade,
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
-- KNOWN LANGUAGE PROFICIENCIES
-- Stores the baseline test results for languages the user knows
-- ============================================================
create table if not exists public.known_language_proficiencies (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  language text not null references public.supported_languages(code) on update cascade,
  transcript text,
  pace_wpm float,
  accent_feedback text,
  dialect_inferred text,
  fluency_score float,
  audio_url text,
  created_at timestamptz not null default now()
);

alter table public.known_language_proficiencies enable row level security;

create policy "Users can manage own proficiencies" on public.known_language_proficiencies
  for all using (auth.uid() = user_id);


-- ============================================================
-- LEARNING PROGRESS
-- Stores current learning statistics for target languages
-- ============================================================
create table if not exists public.learning_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  language text not null references public.supported_languages(code) on update cascade,
  words integer default 0,
  sentences integer default 0,
  level integer default 0 check (level >= 0 and level <= 100),
  last_active_at timestamptz default now(),
  created_at timestamptz not null default now(),
  unique(user_id, language)
);

alter table public.learning_progress enable row level security;

drop policy if exists "Users can manage own learning progress" on public.learning_progress;
create policy "Users can manage own learning progress" on public.learning_progress 
  for all using (auth.uid() = user_id);

-- ============================================================
-- OPTIMIZATIONS
-- ============================================================
create index if not exists idx_profiles_native_lang on public.profiles(native_language);
create index if not exists idx_profiles_target_lang on public.profiles(target_language);
create index if not exists idx_proficiencies_lang on public.known_language_proficiencies(language);
create index if not exists idx_learning_progress_lang on public.learning_progress(language);
