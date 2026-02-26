# Learning Progress 'from' Column - Backend Update ✅

## Database Schema Change

You've added a `from` column to the `learning_progress` table to track which source language (L1) the user is learning from.

### New Schema
```sql
learning_progress (
  user_id TEXT,
  language TEXT,
  from TEXT,  -- NEW COLUMN
  words INTEGER,
  sentences INTEGER,
  level INTEGER,
  last_active_at TIMESTAMP,
  PRIMARY KEY (user_id, language, from)  -- Composite key
)
```

### Benefits
- Users can learn the same target language from different source languages
- Example: Learn Tamil from English AND Learn Tamil from Hindi (separate progress)
- Better tracking of learning paths
- More accurate progress reporting

## Backend Updates

### 1. `/api/learning/start` Endpoint ✅
**Changes**:
- Now saves `from` column when creating new learning progress
- Checks for existing progress with same language AND source language
- Allows multiple learning paths for same target language

**Before**:
```typescript
// Only checked: user_id + language
.eq('language', language.toLowerCase())
```

**After**:
```typescript
// Now checks: user_id + language + from
.eq('language', language.toLowerCase())
.eq('from', sourceLanguage.toLowerCase())
```

### 2. `/api/learning/practice` Endpoint ✅
**Changes**:
- Now filters by source language when updating progress
- Updates correct learning path based on language pair
- Prevents mixing progress from different source languages

**Request Body**:
```typescript
{
  language: string,        // Target language (L2)
  sourceLanguage: string,  // Source language (L1) - NEW
  wordsPracticed: number,
  sentencesPracticed: number
}
```

### 3. `/api/learning/progress/:language` Endpoint
**No changes needed** - Returns all progress for a language (useful for overview)

## Files Modified

### Backend
1. `backend/src/routes/learning.ts`
   - Updated `POST /api/learning/start` to save `from` column
   - Updated `POST /api/learning/practice` to filter by `from` column
   - Added `sourceLanguage` to request body types

2. `backend/src/db/add-from-column.sql` (NEW)
   - SQL migration to add `from` column
   - Updates primary key to composite key
   - Adds indexes for performance
   - Sets default value for existing records

## Migration Steps

If you haven't run the migration yet, execute this SQL in Supabase:

```sql
-- 1. Add column
ALTER TABLE learning_progress 
ADD COLUMN IF NOT EXISTS "from" TEXT;

-- 2. Set default for existing records
UPDATE learning_progress 
SET "from" = 'english' 
WHERE "from" IS NULL;

-- 3. Make it required
ALTER TABLE learning_progress 
ALTER COLUMN "from" SET NOT NULL;

-- 4. Update primary key
ALTER TABLE learning_progress 
DROP CONSTRAINT IF EXISTS learning_progress_pkey;

ALTER TABLE learning_progress 
ADD CONSTRAINT learning_progress_pkey 
PRIMARY KEY (user_id, language, "from");

-- 5. Add indexes
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_language 
ON learning_progress(user_id, language);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user_from 
ON learning_progress(user_id, "from");
```

## Testing

### Test Case 1: New Learning Path
1. User selects Tamil as target language
2. User selects English as source language
3. Start learning
4. **Verify**: Database has record with `language='tamil'` and `from='english'`

### Test Case 2: Multiple Learning Paths
1. User learns Tamil from English (completes some words)
2. User goes back and learns Tamil from Hindi
3. **Verify**: Two separate records in database:
   - `(user_id, 'tamil', 'english')` with progress
   - `(user_id, 'tamil', 'hindi')` with separate progress

### Test Case 3: Practice Updates
1. User practices Tamil from English
2. Complete 5 words
3. **Verify**: Only the English→Tamil progress is updated
4. **Verify**: Hindi→Tamil progress (if exists) is unchanged

## API Examples

### Start Learning
```bash
POST /api/learning/start
{
  "language": "tamil",
  "sourceLanguage": "english"
}

Response:
{
  "success": true,
  "data": {
    "user_id": "xxx",
    "language": "tamil",
    "from": "english",
    "words": 0,
    "sentences": 0,
    "level": 0
  }
}
```

### Update Practice
```bash
POST /api/learning/practice
{
  "language": "tamil",
  "sourceLanguage": "english",
  "wordsPracticed": 5,
  "sentencesPracticed": 1
}

Response:
{
  "success": true,
  "data": {
    "user_id": "xxx",
    "language": "tamil",
    "from": "english",
    "words": 5,
    "sentences": 1,
    "level": 2
  }
}
```

## Database Queries

### Get all learning paths for a user
```sql
SELECT language, "from", words, sentences, level 
FROM learning_progress 
WHERE user_id = 'xxx'
ORDER BY last_active_at DESC;
```

### Get specific learning path
```sql
SELECT * FROM learning_progress 
WHERE user_id = 'xxx' 
  AND language = 'tamil' 
  AND "from" = 'english';
```

### Get all languages user is learning
```sql
SELECT DISTINCT language 
FROM learning_progress 
WHERE user_id = 'xxx';
```

### Get all source languages user is using
```sql
SELECT DISTINCT "from" 
FROM learning_progress 
WHERE user_id = 'xxx';
```

## Notes

- Column name is `"from"` (with quotes) because `from` is a SQL reserved keyword
- Default source language is 'english' for existing records
- Primary key is now composite: `(user_id, language, from)`
- This allows same user to learn same language from different sources
- Each learning path has independent progress tracking

## Next Steps

1. ✅ Backend updated to use `from` column
2. ✅ Frontend already passes `sourceLanguage` parameter
3. ✅ SQL migration script created
4. [ ] Run migration in Supabase
5. [ ] Test with different language pairs
6. [ ] Update account page to show all learning paths
7. [ ] Add UI to switch between learning paths
