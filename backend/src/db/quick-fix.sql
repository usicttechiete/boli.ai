-- ============================================================
-- QUICK FIX - Run this in Supabase SQL Editor NOW
-- This will check and create any missing tables
-- ============================================================

-- Check if learning_progress exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'learning_progress') THEN
        -- Create learning_progress table
        CREATE TABLE public.learning_progress (
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

        -- Enable RLS
        ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;

        -- Create policy
        CREATE POLICY "Users can manage own learning progress" ON public.learning_progress 
          FOR ALL USING (auth.uid() = user_id);

        -- Create indexes
        CREATE INDEX idx_learning_progress_lang ON public.learning_progress(language);

        RAISE NOTICE 'Created learning_progress table';
    ELSE
        RAISE NOTICE 'learning_progress table already exists';
    END IF;
END $$;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'learning_progress'
ORDER BY ordinal_position;
