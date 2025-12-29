-- =============================================
-- COMPLETION HISTORY TABLES
-- Run this in Supabase SQL Editor to add history sync
-- =============================================

-- =============================================
-- TASK COMPLETION HISTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS task_completion_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    task_id TEXT NOT NULL,
    title TEXT NOT NULL,
    date_key TEXT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE task_completion_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own task history" ON task_completion_history;
DROP POLICY IF EXISTS "Users can insert own task history" ON task_completion_history;
DROP POLICY IF EXISTS "Users can delete own task history" ON task_completion_history;

-- Policies for task_completion_history
CREATE POLICY "Users can view own task history"
    ON task_completion_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task history"
    ON task_completion_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own task history"
    ON task_completion_history FOR DELETE
    USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_task_history_user ON task_completion_history(user_id);
CREATE INDEX IF NOT EXISTS idx_task_history_date ON task_completion_history(date_key);

-- =============================================
-- HABIT COMPLETION HISTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS habit_completion_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    habit_id TEXT NOT NULL,
    name TEXT NOT NULL,
    date_key TEXT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE habit_completion_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own habit history" ON habit_completion_history;
DROP POLICY IF EXISTS "Users can insert own habit history" ON habit_completion_history;
DROP POLICY IF EXISTS "Users can delete own habit history" ON habit_completion_history;

-- Policies for habit_completion_history
CREATE POLICY "Users can view own habit history"
    ON habit_completion_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit history"
    ON habit_completion_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit history"
    ON habit_completion_history FOR DELETE
    USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_habit_history_user ON habit_completion_history(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_history_date ON habit_completion_history(date_key);

-- =============================================
-- GOAL COMPLETION HISTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS goal_completion_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    goal_id TEXT NOT NULL,
    title TEXT NOT NULL,
    date_key TEXT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE goal_completion_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own goal history" ON goal_completion_history;
DROP POLICY IF EXISTS "Users can insert own goal history" ON goal_completion_history;
DROP POLICY IF EXISTS "Users can delete own goal history" ON goal_completion_history;

-- Policies for goal_completion_history
CREATE POLICY "Users can view own goal history"
    ON goal_completion_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goal history"
    ON goal_completion_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal history"
    ON goal_completion_history FOR DELETE
    USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_goal_history_user ON goal_completion_history(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_history_date ON goal_completion_history(date_key);
