-- Add Gujarati, Punjabi, Marathi, and Telugu to supported_languages table
-- Run this script in Supabase SQL Editor

-- Insert Gujarati
INSERT INTO supported_languages (code, name, native_name, is_active)
VALUES ('gujarati', 'Gujarati', 'ગુજરાતી', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  native_name = EXCLUDED.native_name,
  is_active = EXCLUDED.is_active;

-- Insert Punjabi
INSERT INTO supported_languages (code, name, native_name, is_active)
VALUES ('punjabi', 'Punjabi', 'ਪੰਜਾਬੀ', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  native_name = EXCLUDED.native_name,
  is_active = EXCLUDED.is_active;

-- Insert Marathi
INSERT INTO supported_languages (code, name, native_name, is_active)
VALUES ('marathi', 'Marathi', 'मराठी', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  native_name = EXCLUDED.native_name,
  is_active = EXCLUDED.is_active;

-- Insert Telugu
INSERT INTO supported_languages (code, name, native_name, is_active)
VALUES ('telugu', 'Telugu', 'తెలుగు', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  native_name = EXCLUDED.native_name,
  is_active = EXCLUDED.is_active;

-- Verify the insertion
SELECT * FROM supported_languages 
WHERE code IN ('gujarati', 'punjabi', 'marathi', 'telugu')
ORDER BY code;

-- Optional: Update existing languages to ensure consistency
-- Make sure English, Hindi, and Tamil are also active
UPDATE supported_languages 
SET is_active = true 
WHERE code IN ('english', 'hindi', 'tamil');

-- Show all active languages
SELECT code, name, native_name, is_active 
FROM supported_languages 
WHERE is_active = true
ORDER BY code;
