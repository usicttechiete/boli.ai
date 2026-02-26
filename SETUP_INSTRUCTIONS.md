# BOLI.AI - Database Setup Instructions

## Step 1: Run Main Schema (REQUIRED)

Go to your Supabase project → SQL Editor → New Query

Copy and paste the entire contents of `backend/src/db/schema.sql` and run it.

This will create:
- `supported_languages` table with seed data
- `profiles` table with auto-creation trigger
- `known_language_proficiencies` table
- `learning_progress` table
- All necessary indexes and RLS policies

## Step 2: Run Additional Setup (OPTIONAL)

If you want vocabulary database and analytics views, run `backend/src/db/additional-setup.sql`

This adds:
- `vocabulary` table with sample words
- `sentences` table
- `practice_history` table
- Helper functions
- Analytics views

## Step 3: Verify Tables

Run this query to verify all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

You should see:
- known_language_proficiencies
- learning_progress
- profiles
- supported_languages
- (and optionally: vocabulary, sentences, practice_history)

## Step 4: Start Backend

```bash
cd backend
npm run dev
```

## Step 5: Start Frontend

```bash
cd frontend
npx expo start
```

## Troubleshooting

### Error: "column lp.words does not exist"
- You haven't run the main schema.sql yet
- Go to Supabase SQL Editor and run `backend/src/db/schema.sql` first

### Error: "relation does not exist"
- Same as above - run the main schema first

### Backend Error: "learningRoutes is not defined"
- Already fixed - the import is now added to server.ts

### Frontend Error: "expo-audio not found"
- Already fixed - expo-audio is now installed
