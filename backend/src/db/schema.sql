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
-- KNOWN LANGUAGE PROFICIENCIES
-- Stores the baseline test results for languages the user knows
-- ============================================================
create table if not exists public.known_language_proficiencies (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  language text not null,
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

