-- =============================================
-- MIGRATION: Fix Playlists Table RLS Policies
-- Run this in Supabase SQL Editor to fix the error
-- https://supabase.com/dashboard/project/plgwxcegcnowqxoggujk/sql
-- =============================================

-- Step 1: Add tracks column if it doesn't exist
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS tracks JSONB DEFAULT '[]';

-- Step 2: Make url column optional (it may have NOT NULL constraint)
ALTER TABLE playlists ALTER COLUMN url DROP NOT NULL;
ALTER TABLE playlists ALTER COLUMN url SET DEFAULT '';

-- Step 3: Drop and recreate RLS policies to ensure they work
DROP POLICY IF EXISTS "Users can view own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can insert own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can update own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can delete own playlists" ON playlists;

-- Step 4: Make sure RLS is enabled
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Step 5: Create fresh policies
CREATE POLICY "Users can view own playlists"
    ON playlists FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own playlists"
    ON playlists FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playlists"
    ON playlists FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own playlists"
    ON playlists FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- Also fix video_playlists table while we're at it
-- =============================================

-- Drop and recreate RLS policies for video_playlists
DROP POLICY IF EXISTS "Users can view own video_playlists" ON video_playlists;
DROP POLICY IF EXISTS "Users can insert own video_playlists" ON video_playlists;
DROP POLICY IF EXISTS "Users can update own video_playlists" ON video_playlists;
DROP POLICY IF EXISTS "Users can delete own video_playlists" ON video_playlists;

ALTER TABLE video_playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video_playlists"
    ON video_playlists FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video_playlists"
    ON video_playlists FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video_playlists"
    ON video_playlists FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own video_playlists"
    ON video_playlists FOR DELETE
    USING (auth.uid() = user_id);

-- Done! The error should be fixed now.
SELECT 'Migration completed successfully!' as status;
