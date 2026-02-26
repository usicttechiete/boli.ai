-- Add 'from' column to learning_progress table
-- This column stores the source language (L1) that the user is learning from

-- Add the column if it doesn't exist
ALTER TABLE learning_progress 
ADD COLUMN IF NOT EXISTS "from" TEXT;

-- Update existing records to set 'from' to 'english' as default
UPDATE learning_progress 
SET "from" = 'english' 
WHERE "from" IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE learning_progress 
ALTER COLUMN "from" SET NOT NULL;

-- Update the primary key to include 'from' column
-- This allows users to learn the same language from different source languages
-- For example: Learning Tamil from English AND Learning Tamil from Hindi

-- First, drop the existing primary key
ALTER TABLE learning_progress 
DROP CONSTRAINT IF EXISTS learning_progress_pkey;

-- Create new composite primary key
ALTER TABLE learning_progress 
ADD CONSTRAINT learning_progress_pkey 
PRIMARY KEY (user_id, language, "from");

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_language 
ON learning_progress(user_id, language);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user_from 
ON learning_progress(user_id, "from");

-- Add comment to explain the column
COMMENT ON COLUMN learning_progress."from" IS 'Source language (L1) that the user is learning from';

-- Example queries:
-- Get all learning progress for a user learning Tamil from English:
-- SELECT * FROM learning_progress WHERE user_id = 'xxx' AND language = 'tamil' AND "from" = 'english';

-- Get all languages a user is learning:
-- SELECT DISTINCT language FROM learning_progress WHERE user_id = 'xxx';

-- Get all source languages a user is using:
-- SELECT DISTINCT "from" FROM learning_progress WHERE user_id = 'xxx';
