-- =========================================
-- Add Missing Profile Fields Migration
-- =========================================
-- This adds fields that the app expects but were missing from the schema

-- Add name fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add email (could also come from auth.users.email)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add notification preferences
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS daily_reminder BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS streak_alerts BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS weekly_summary BOOLEAN DEFAULT FALSE;

-- Verify the changes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND table_schema = 'public'
ORDER BY ordinal_position;
