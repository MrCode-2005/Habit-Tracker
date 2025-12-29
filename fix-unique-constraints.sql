-- =============================================
-- FIX: Add UNIQUE constraints for upsert to work
-- Run this in Supabase SQL Editor
-- =============================================

-- First, delete any duplicates in the tables

-- Delete duplicate task history entries (keep the first one)
DELETE FROM task_completion_history a
USING task_completion_history b
WHERE a.id > b.id 
  AND a.user_id = b.user_id 
  AND a.task_id = b.task_id 
  AND a.date_key = b.date_key;

-- Delete duplicate habit history entries (keep the first one)
DELETE FROM habit_completion_history a
USING habit_completion_history b
WHERE a.id > b.id 
  AND a.user_id = b.user_id 
  AND a.habit_id = b.habit_id 
  AND a.date_key = b.date_key;

-- Delete duplicate goal history entries (keep the first one)
DELETE FROM goal_completion_history a
USING goal_completion_history b
WHERE a.id > b.id 
  AND a.user_id = b.user_id 
  AND a.goal_id = b.goal_id 
  AND a.date_key = b.date_key;

-- Now add UNIQUE constraints

-- Task history unique constraint
ALTER TABLE task_completion_history
DROP CONSTRAINT IF EXISTS task_history_unique;

ALTER TABLE task_completion_history
ADD CONSTRAINT task_history_unique 
UNIQUE (user_id, task_id, date_key);

-- Habit history unique constraint
ALTER TABLE habit_completion_history
DROP CONSTRAINT IF EXISTS habit_history_unique;

ALTER TABLE habit_completion_history
ADD CONSTRAINT habit_history_unique 
UNIQUE (user_id, habit_id, date_key);

-- Goal history unique constraint
ALTER TABLE goal_completion_history
DROP CONSTRAINT IF EXISTS goal_history_unique;

ALTER TABLE goal_completion_history
ADD CONSTRAINT goal_history_unique 
UNIQUE (user_id, goal_id, date_key);

-- Verify the constraints were created
SELECT conname, conrelid::regclass AS table_name
FROM pg_constraint 
WHERE conname LIKE '%_history_unique';
