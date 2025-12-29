-- =============================================
-- FOCUS SESSIONS TABLE (Cross-Browser Timer Sync)
-- Run this in Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS focus_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    task_id TEXT NOT NULL,
    task_title TEXT NOT NULL,
    subtask_index INTEGER DEFAULT -1,  -- -1 means no subtask
    subtask_title TEXT DEFAULT NULL,
    total_seconds INTEGER NOT NULL,
    remaining_seconds INTEGER NOT NULL,
    is_break_mode BOOLEAN DEFAULT FALSE,
    break_duration INTEGER DEFAULT 5,
    is_paused BOOLEAN DEFAULT TRUE,
    tree_stage INTEGER DEFAULT 0,
    tree_progress REAL DEFAULT 0,
    view_mode TEXT DEFAULT 'timer',
    paused_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view own focus_sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can insert own focus_sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can update own focus_sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can delete own focus_sessions" ON focus_sessions;

-- Create policies
CREATE POLICY "Users can view own focus_sessions"
    ON focus_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own focus_sessions"
    ON focus_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own focus_sessions"
    ON focus_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own focus_sessions"
    ON focus_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS focus_sessions_user_id_idx ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS focus_sessions_task_id_idx ON focus_sessions(task_id);

-- Add trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_focus_sessions_updated_at ON focus_sessions;
CREATE TRIGGER update_focus_sessions_updated_at BEFORE UPDATE ON focus_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
