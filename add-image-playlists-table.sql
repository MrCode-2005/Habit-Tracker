-- =============================================
-- IMAGE PLAYLISTS TABLE (Focus Mode Background Images)
-- Run this in Supabase SQL Editor
-- =============================================

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

-- Policies for image_playlists
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

-- Add trigger for auto-updating updated_at
CREATE TRIGGER update_image_playlists_updated_at BEFORE UPDATE ON image_playlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
