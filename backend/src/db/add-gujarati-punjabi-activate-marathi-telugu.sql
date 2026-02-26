-- Add Gujarati and Punjabi to supported_languages table
-- Activate Marathi and Telugu (move from coming_soon to active)

-- Step 1: Insert Gujarati if it doesn't exist
INSERT INTO supported_languages (language, native_name, is_active, created_at)
VALUES ('gujarati', 'ગુજરાતી', true, NOW())
ON CONFLICT (language) DO UPDATE 
SET is_active = true, native_name = 'ગુજરાતી';

-- Step 2: Insert Punjabi if it doesn't exist
INSERT INTO supported_languages (language, native_name, is_active, created_at)
VALUES ('punjabi', 'ਪੰਜਾਬੀ', true, NOW())
ON CONFLICT (language) DO UPDATE 
SET is_active = true, native_name = 'ਪੰਜਾਬੀ';

-- Step 3: Activate Marathi (set is_active to true)
UPDATE supported_languages 
SET is_active = true, native_name = 'मराठी'
WHERE language = 'marathi';

-- Step 4: Activate Telugu (set is_active to true)
UPDATE supported_languages 
SET is_active = true, native_name = 'తెలుగు'
WHERE language = 'telugu';

-- Step 5: Verify all active languages
SELECT language, native_name, is_active, created_at 
FROM supported_languages 
WHERE is_active = true
ORDER BY language;

-- Expected result: Should show all active languages:
-- english, gujarati, hindi, marathi, punjabi, tamil, telugu

-- Step 6: Check if any languages need to be inserted (if they don't exist)
-- Insert Marathi if it doesn't exist
INSERT INTO supported_languages (language, native_name, is_active, created_at)