-- ============================================================
-- Update Supported Languages Table
-- Run this in Supabase SQL Editor
-- ============================================================

-- First, let's see what we have
SELECT * FROM public.supported_languages ORDER BY code;

-- ============================================================
-- CLEAN UP DUPLICATES
-- Keep only the full language names, remove short codes
-- ============================================================

-- Delete duplicate short codes (keep the full names)
DELETE FROM public.supported_languages 
WHERE code IN ('bn', 'en', 'hi', 'mr', 'ta');

-- ============================================================
-- ADD MISSING LANGUAGES
-- ============================================================

-- Add Punjabi
INSERT INTO public.supported_languages (code, name, native_name, is_active) 
VALUES ('punjabi', 'Punjabi', 'ਪੰਜਾਬੀ', true)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, 
    native_name = EXCLUDED.native_name, 
    is_active = EXCLUDED.is_active;

-- Add Gujarati
INSERT INTO public.supported_languages (code, name, native_name, is_active) 
VALUES ('gujarati', 'Gujarati', 'ગુજરાતી', true)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, 
    native_name = EXCLUDED.native_name, 
    is_active = EXCLUDED.is_active;

-- Add Kannada (for future)
INSERT INTO public.supported_languages (code, name, native_name, is_active) 
VALUES ('kannada', 'Kannada', 'ಕನ್ನಡ', true)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, 
    native_name = EXCLUDED.native_name, 
    is_active = EXCLUDED.is_active;

-- Add Odia (for future)
INSERT INTO public.supported_languages (code, name, native_name, is_active) 
VALUES ('odia', 'Odia', 'ଓଡ଼ିଆ', true)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, 
    native_name = EXCLUDED.native_name, 
    is_active = EXCLUDED.is_active;

-- Add Malayalam (for future)
INSERT INTO public.supported_languages (code, name, native_name, is_active) 
VALUES ('malayalam', 'Malayalam', 'മലയാളം', true)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, 
    native_name = EXCLUDED.native_name, 
    is_active = EXCLUDED.is_active;

-- ============================================================
-- STANDARDIZE EXISTING LANGUAGES
-- Make sure all use full names as codes
-- ============================================================

-- Update English (if using 'en')
UPDATE public.supported_languages 
SET code = 'english', name = 'English', native_name = 'English'
WHERE code = 'en' OR name = 'English';

-- Update Hindi (if using 'hi')
UPDATE public.supported_languages 
SET code = 'hindi', name = 'Hindi', native_name = 'हिन्दी'
WHERE code = 'hi' OR name = 'Hindi';

-- Update Bengali (if using 'bn')
UPDATE public.supported_languages 
SET code = 'bengali', name = 'Bengali', native_name = 'বাংলা'
WHERE code = 'bn' OR name = 'Bengali';

-- Update Marathi (if using 'mr')
UPDATE public.supported_languages 
SET code = 'marathi', name = 'Marathi', native_name = 'मराठी'
WHERE code = 'mr' OR name = 'Marathi';

-- Update Tamil (if using 'ta')
UPDATE public.supported_languages 
SET code = 'tamil', name = 'Tamil', native_name = 'தமிழ்'
WHERE code = 'ta' OR name = 'Tamil';

-- Update Telugu
UPDATE public.supported_languages 
SET code = 'telugu', name = 'Telugu', native_name = 'తెలుగు'
WHERE name = 'Telugu';

-- ============================================================
-- VERIFY FINAL STATE
-- ============================================================
SELECT code, name, native_name, is_active 
FROM public.supported_languages 
ORDER BY name;

-- Expected result:
-- bengali  | Bengali   | বাংলা      | true
-- english  | English   | English    | true
-- gujarati | Gujarati  | ગુજરાતી    | true
-- hindi    | Hindi     | हिन्दी     | true
-- kannada  | Kannada   | ಕನ್ನಡ      | true
-- malayalam| Malayalam | മലയാളം     | true
-- marathi  | Marathi   | मराठी      | true
-- odia     | Odia      | ଓଡ଼ିଆ       | true
-- punjabi  | Punjabi   | ਪੰਜਾਬੀ     | true
-- tamil    | Tamil     | தமிழ்      | true
-- telugu   | Telugu    | తెలుగు     | true
