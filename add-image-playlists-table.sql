-- =============================================
-- IMAGE PLAYLISTS TABLE - Safe Migration
-- Run this in Supabase SQL Editor
-- This version handles the case where some parts already exist
-- =============================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS image_playlists (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    images JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE image_playlists ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view own image_playlists" ON image_playlists;
DROP POLICY IF EXISTS "Users can insert own image_playlists" ON image_playlists;
DROP POLICY IF EXISTS "Users can update own image_playlists" ON image_playlists;
DROP POLICY IF EXISTS "Users can delete own image_playlists" ON image_playlists;

-- Create policies fresh
CREATE POLICY "Users can view own image_playlists"
    ON image_playlists FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own image_playlists"
    ON image_playlists FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own image_playlists"
    ON image_playlists FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own image_playlists"
    ON image_playlists FOR DELETE
    USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS image_playlists_user_id_idx ON image_playlists(user_id);
