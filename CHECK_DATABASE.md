# Check if Languages are Being Added to Database

## Step 1: Check if learning_progress table is fixed

Go to **Supabase Dashboard** → **SQL Editor** → Run this:

```sql
-- Check table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'learning_progress'
ORDER BY ordinal_position;
```

You should see these columns:
- id (uuid)
- user_id (uuid)
- language (text)
- words (integer)
- sentences (integer)
- level (integer)
- last_active_at (timestamp with time zone)
- created_at (timestamp with time zone)

If you DON'T see `words` and `sentences` columns, run the fix SQL from `backend/src/db/fix-learning-progress.sql`

## Step 2: Check if known_language_proficiencies table exists

```sql
-- Check if table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'known_language_proficiencies'
ORDER BY ordinal_position;
```

You should see:
- id
- user_id
- language
- transcript
- pace_wpm
- accent_feedback
- dialect_inferred
- fluency_score
- audio_url
- created_at

## Step 3: Check if any languages have been added

```sql
-- Check known languages
SELECT 
    id,
    user_id,
    language,
    fluency_score,
    pace_wpm,
    created_at
FROM public.known_language_proficiencies
ORDER BY created_at DESC
LIMIT 10;
```

## Step 4: Test the language submission

1. Open your app
2. Go to "Add Language" (the + button)
3. Select a language (e.g., Hindi)
4. Record yourself reading the paragraph
5. Submit the recording

## Step 5: Check backend logs

After submitting, check if you see this in backend logs:
```
POST /api/test/analyze
```

If you see status 200, the language was saved successfully!

## Step 6: Verify in database

Run this again:
```sql
SELECT * FROM public.known_language_proficiencies 
ORDER BY created_at DESC LIMIT 1;
```

You should see your newly added language!

## Common Issues:

### Issue 1: "sentences column does not exist"
**Fix**: Run `backend/src/db/fix-learning-progress.sql` in Supabase SQL Editor

### Issue 2: No POST request to /api/test/analyze
**Fix**: The test page might be using dummy data. Check `frontend/app/test/[language].tsx` line 200-250

### Issue 3: Languages not showing on home screen
**Fix**: 
1. Pull down to refresh the home screen
2. Check if `/api/test/known-languages` returns data in backend logs
3. Verify RLS policies allow reading your own data

## Quick Test Query

Run this to see EVERYTHING:
```sql
-- See all your data
SELECT 
    'known_languages' as table_name,
    language,
    fluency_score,
    created_at
FROM public.known_language_proficiencies
WHERE user_id = auth.uid()

UNION ALL

SELECT 
    'learning_progress' as table_name,
    language,
    level::float as fluency_score,
    created_at
FROM public.learning_progress
WHERE user_id = auth.uid()

ORDER BY created_at DESC;
```
