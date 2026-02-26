-- ============================================================
-- BOLI.AI — Additional Database Setup
-- Run this AFTER running the main schema.sql file
-- This is OPTIONAL - adds vocabulary database and analytics
-- ============================================================

-- IMPORTANT: Make sure you've run backend/src/db/schema.sql first!
-- That file creates the core tables: profiles, known_language_proficiencies, learning_progress

-- ============================================================
-- WORDS DATABASE (Optional - for production)
-- Store vocabulary for each language
-- ============================================================
create table if not exists public.vocabulary (
  id uuid default uuid_generate_v4() primary key,
  language text not null references public.supported_languages(code) on update cascade,
  word text not null,
  translation text not null,
  phonetics text,
  description text,
  difficulty_level integer default 1 check (difficulty_level >= 1 and difficulty_level <= 5),
  category text, -- e.g., 'greetings', 'food', 'numbers'
  is_active boolean default true,
  created_at timestamptz not null default now()
);

alter table public.vocabulary enable row level security;

-- Everyone can read vocabulary
create policy "Anyone can view vocabulary" on public.vocabulary
  for select using (is_active = true);

-- Index for faster lookups
create index if not exists idx_vocabulary_language on public.vocabulary(language);
create index if not exists idx_vocabulary_difficulty on public.vocabulary(difficulty_level);
create index if not exists idx_vocabulary_category on public.vocabulary(category);

-- ============================================================
-- SENTENCES DATABASE (Optional - for production)
-- Store practice sentences
-- ============================================================
create table if not exists public.sentences (
  id uuid default uuid_generate_v4() primary key,
  language text not null references public.supported_languages(code) on update cascade,
  sentence text not null,
  translation text not null,
  phonetics text,
  difficulty_level integer default 1 check (difficulty_level >= 1 and difficulty_level <= 5),
  category text,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

alter table public.sentences enable row level security;

create policy "Anyone can view sentences" on public.sentences
  for select using (is_active = true);

create index if not exists idx_sentences_language on public.sentences(language);
create index if not exists idx_sentences_difficulty on public.sentences(difficulty_level);

-- ============================================================
-- PRACTICE HISTORY (Track individual practice sessions)
-- ============================================================
create table if not exists public.practice_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  language text not null references public.supported_languages(code) on update cascade,
  type text not null check (type in ('word', 'sentence')),
  content text not null,
  accuracy float,
  audio_url text,
  feedback text,
  passed boolean default false,
  created_at timestamptz not null default now()
);

alter table public.practice_history enable row level security;

create policy "Users can manage own practice history" on public.practice_history
  for all using (auth.uid() = user_id);

create index if not exists idx_practice_history_user on public.practice_history(user_id);
create index if not exists idx_practice_history_language on public.practice_history(language);
create index if not exists idx_practice_history_created on public.practice_history(created_at desc);

-- ============================================================
-- SEED VOCABULARY (Sample data for English)
-- ============================================================
insert into public.vocabulary (language, word, translation, phonetics, description, difficulty_level, category) values
('english', 'Hello', 'नमस्ते', 'Namaste', 'Common greeting', 1, 'greetings'),
('english', 'Thank you', 'धन्यवाद', 'Dhanyavaad', 'Show gratitude', 1, 'greetings'),
('english', 'Yes', 'हाँ', 'Haan', 'Affirmative', 1, 'basics'),
('english', 'No', 'नहीं', 'Nahin', 'Negative', 1, 'basics'),
('english', 'Water', 'पानी', 'Paani', 'Essential liquid', 1, 'food'),
('english', 'Food', 'खाना', 'Khaana', 'Meal', 1, 'food'),
('english', 'Friend', 'दोस्त', 'Dost', 'Companion', 1, 'relationships'),
('english', 'Family', 'परिवार', 'Parivaar', 'Relatives', 1, 'relationships'),
('english', 'Good morning', 'सुप्रभात', 'Suprabhat', 'Morning greeting', 2, 'greetings'),
('english', 'Good night', 'शुभ रात्रि', 'Shubh Raatri', 'Night greeting', 2, 'greetings')
on conflict do nothing;

-- ============================================================
-- SEED VOCABULARY (Sample data for Hindi)
-- ============================================================
insert into public.vocabulary (language, word, translation, phonetics, description, difficulty_level, category) values
('hindi', 'नमस्ते', 'Hello', 'Namaste', 'Common greeting', 1, 'greetings'),
('hindi', 'धन्यवाद', 'Thank you', 'Dhanyavaad', 'Show gratitude', 1, 'greetings'),
('hindi', 'हाँ', 'Yes', 'Haan', 'Affirmative', 1, 'basics'),
('hindi', 'नहीं', 'No', 'Nahin', 'Negative', 1, 'basics'),
('hindi', 'पानी', 'Water', 'Paani', 'Essential liquid', 1, 'food'),
('hindi', 'खाना', 'Food', 'Khaana', 'Meal', 1, 'food'),
('hindi', 'दोस्त', 'Friend', 'Dost', 'Companion', 1, 'relationships'),
('hindi', 'परिवार', 'Family', 'Parivaar', 'Relatives', 1, 'relationships')
on conflict do nothing;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to get random words for practice
create or replace function public.get_practice_words(
  p_language text,
  p_difficulty integer default 1,
  p_count integer default 5
)
returns table (
  word text,
  translation text,
  phonetics text,
  description text
)
language plpgsql
security definer
as $$
begin
  return query
  select v.word, v.translation, v.phonetics, v.description
  from public.vocabulary v
  where v.language = p_language
    and v.difficulty_level <= p_difficulty
    and v.is_active = true
  order by random()
  limit p_count;
end;
$$;

-- Function to update learning streak
create or replace function public.update_learning_streak(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_last_active date;
  v_current_streak integer;
begin
  select last_active_date, streak_days
  into v_last_active, v_current_streak
  from public.profiles
  where id = p_user_id;

  if v_last_active is null or v_last_active < current_date - interval '1 day' then
    -- Reset streak if more than 1 day gap
    update public.profiles
    set streak_days = 1, last_active_date = current_date
    where id = p_user_id;
  elsif v_last_active = current_date - interval '1 day' then
    -- Increment streak if practiced yesterday
    update public.profiles
    set streak_days = v_current_streak + 1, last_active_date = current_date
    where id = p_user_id;
  elsif v_last_active = current_date then
    -- Already practiced today, do nothing
    null;
  end if;
end;
$$;

-- ============================================================
-- ANALYTICS VIEWS (Optional - for dashboard)
-- ============================================================

-- View: User learning summary
create or replace view public.user_learning_summary as
select
  p.id as user_id,
  p.name,
  p.streak_days,
  count(distinct klp.language) as known_languages_count,
  count(distinct lp.language) as learning_languages_count,
  coalesce(sum(lp.words::integer), 0) as total_words_practiced,
  coalesce(sum(lp.sentences::integer), 0) as total_sentences_practiced
from public.profiles p
left join public.known_language_proficiencies klp on klp.user_id = p.id
left join public.learning_progress lp on lp.user_id = p.id
group by p.id, p.name, p.streak_days;

-- Grant access to authenticated users for their own summary
grant select on public.user_learning_summary to authenticated;
