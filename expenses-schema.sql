-- Expense & Financial Habit Tracking Schema for Supabase
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/plgwxcegcnowqxoggujk/sql

-- =============================================
-- EXPENSES TABLE (Active expenses)
-- =============================================
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('food_outing', 'food_online', 'clothing', 'transportation', 'essentials')),
    subcategory TEXT,
    expense_date DATE NOT NULL,
    note TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policies for expenses
CREATE POLICY "Users can view own expenses"
    ON expenses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
    ON expenses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
    ON expenses FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
    ON expenses FOR DELETE
    USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses(user_id);
CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON expenses(category);
CREATE INDEX IF NOT EXISTS expenses_is_deleted_idx ON expenses(is_deleted);

-- =============================================
-- EDUCATION FEES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS education_fees (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
    tuition_fee DECIMAL(10,2) DEFAULT 0,
    hostel_fee DECIMAL(10,2) DEFAULT 0,
    tuition_paid BOOLEAN DEFAULT FALSE,
    hostel_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, semester)
);

-- Enable RLS
ALTER TABLE education_fees ENABLE ROW LEVEL SECURITY;

-- Policies for education_fees
CREATE POLICY "Users can view own education_fees"
    ON education_fees FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own education_fees"
    ON education_fees FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own education_fees"
    ON education_fees FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own education_fees"
    ON education_fees FOR DELETE
    USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS education_fees_user_id_idx ON education_fees(user_id);
CREATE INDEX IF NOT EXISTS education_fees_semester_idx ON education_fees(semester);

-- =============================================
-- TRIGGERS FOR AUTO-UPDATING updated_at
-- =============================================
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_education_fees_updated_at BEFORE UPDATE ON education_fees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
