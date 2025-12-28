-- =============================================
-- COMPLETE FIX: All Tables RLS Policies
-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/plgwxcegcnowqxoggujk/sql
-- =============================================

-- =============================================
-- FIX PLAYLISTS TABLE
-- =============================================
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS tracks JSONB DEFAULT '[]';
ALTER TABLE playlists ALTER COLUMN url DROP NOT NULL;
ALTER TABLE playlists ALTER COLUMN url SET DEFAULT '';

DROP POLICY IF EXISTS "Users can view own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can insert own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can update own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can delete own playlists" ON playlists;

ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own playlists"
    ON playlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own playlists"
    ON playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own playlists"
    ON playlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own playlists"
    ON playlists FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- FIX VIDEO_PLAYLISTS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view own video_playlists" ON video_playlists;
DROP POLICY IF EXISTS "Users can insert own video_playlists" ON video_playlists;
DROP POLICY IF EXISTS "Users can update own video_playlists" ON video_playlists;
DROP POLICY IF EXISTS "Users can delete own video_playlists" ON video_playlists;

ALTER TABLE video_playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video_playlists"
    ON video_playlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own video_playlists"
    ON video_playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own video_playlists"
    ON video_playlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own video_playlists"
    ON video_playlists FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- FIX CALENDAR_EVENTS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view own calendar_events" ON calendar_events;
DROP POLICY IF EXISTS "Users can insert own calendar_events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update own calendar_events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete own calendar_events" ON calendar_events;

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar_events"
    ON calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own calendar_events"
    ON calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calendar_events"
    ON calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own calendar_events"
    ON calendar_events FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- FIX TASKS TABLE (just in case)
-- =============================================
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
    ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks"
    ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks"
    ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks"
    ON tasks FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- FIX HABITS TABLE (just in case)
-- =============================================
DROP POLICY IF EXISTS "Users can view own habits" ON habits;
DROP POLICY IF EXISTS "Users can insert own habits" ON habits;
DROP POLICY IF EXISTS "Users can update own habits" ON habits;
DROP POLICY IF EXISTS "Users can delete own habits" ON habits;

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habits"
    ON habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits"
    ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits"
    ON habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits"
    ON habits FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- FIX GOALS TABLE (just in case)
-- =============================================
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
    ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals"
    ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals"
    ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals"
    ON goals FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- FIX EVENTS TABLE (just in case)
-- =============================================
DROP POLICY IF EXISTS "Users can view own events" ON events;
DROP POLICY IF EXISTS "Users can insert own events" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
    ON events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events"
    ON events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events"
    ON events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events"
    ON events FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- DONE!
-- =============================================
SELECT 'All RLS policies have been fixed!' as status;
