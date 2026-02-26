-- ============================================================
-- Fix Existing User Data After Language Code Changes
-- Run this AFTER running update-languages.sql
-- ============================================================

-- This updates any existing records that use short codes (en, hi, etc.)
-- to use the full language names (english, hindi, etc.)

-- ============================================================
-- FIX known_language_proficiencies
-- ============================================================

-- Update English
UPDATE public.known_language_proficiencies 
SET language = 'english' 
WHERE language IN ('en', 'EN', 'En');

-- Update Hindi  
UPDATE public.known_language_proficiencies 
SET language = 'hindi' 
WHERE language IN ('hi', 'HI', 'Hi');

-- Update Bengali
UPDATE public.known_language_proficiencies 
SET language = 'bengali' 
WHERE language IN ('bn', 'BN', 'Bn');

-- Update Tamil
UPDATE public.known_language_proficiencies 
SET language = 'tamil' 
WHERE language IN ('ta', 'TA', 'Ta');

-- Update Telugu
UPDATE public.known_language_proficiencies 
SET language = 'telugu' 
WHERE language IN ('te', 'TE', 'Te');

-- Update Marathi
UPDATE public.known_language_proficiencies 
SET language = 'marathi' 
WHERE language IN ('mr', 'MR', 'Mr');

-- Update Punjabi
UPDATE public.known_language_proficiencies 
SET language = 'punjabi' 
WHERE language IN ('pa', 'PA', 'Pa');

-- Update Gujarati
UPDATE public.known_language_proficiencies 
SET language = 'gujarati' 
WHERE language IN ('gu', 'GU', 'Gu');

-- ============================================================
-- FIX learning_progress
-- ============================================================

-- Update English
UPDATE public.learning_progress 
SET language = 'english' 
WHERE language IN ('en', 'EN', 'En');

-- Update Hindi
UPDATE public.learning_progress 
SET language = 'hindi' 
WHERE language IN ('hi', 'HI', 'Hi');

-- Update Bengali
UPDATE public.learning_progress 
SET language = 'bengali' 
WHERE language IN ('bn', 'BN', 'Bn');

-- Update Tamil
UPDATE public.learning_progress 
SET language = 'tamil' 
WHERE language IN ('ta', 'TA', 'Ta');

-- Update Telugu
UPDATE public.learning_progress 
SET language = 'telugu' 
WHERE language IN ('te', 'TE', 'Te');

-- Update Marathi
UPDATE public.learning_progress 
SET language = 'marathi' 
WHERE language IN ('mr', 'MR', 'Mr');

-- Update Punjabi
UPDATE public.learning_progress 
SET language = 'punjabi' 
WHERE language IN ('pa', 'PA', 'Pa');

-- Update Gujarati
UPDATE public.learning_progress 
SET language = 'gujarati' 
WHERE language IN ('gu', 'GU', 'Gu');

-- ============================================================
-- FIX profiles (native_language and target_language)
-- ============================================================

-- Update native_language
UPDATE public.profiles 
SET native_language = 'english' 
WHERE native_language IN ('en', 'EN', 'En');

UPDATE public.profiles 
SET native_language = 'hindi' 
WHERE native_language IN ('hi', 'HI', 'Hi');

-- Update target_language
UPDATE public.profiles 
SET target_language = 'english' 
WHERE target_language IN ('en', 'EN', 'En');

UPDATE public.profiles 
SET target_language = 'hindi' 
WHERE target_language IN ('hi', 'HI', 'Hi');

-- ============================================================
-- VERIFY CHANGES
-- ============================================================

-- Check known_language_proficiencies
SELECT DISTINCT language, COUNT(*) as count
FROM public.known_language_proficiencies
GROUP BY language
ORDER BY language;

-- Check learning_progress
SELECT DISTINCT language, COUNT(*) as count
FROM public.learning_progress
GROUP BY language
ORDER BY language;

-- Check profiles
SELECT DISTINCT native_language, COUNT(*) as count
FROM public.profiles
GROUP BY native_language
ORDER BY native_language;

SELECT DISTINCT target_language, COUNT(*) as count
FROM public.profiles
GROUP BY target_language
ORDER BY target_language;
