-- Migration Script to add EMI tracking columns
ALTER TABLE loans ADD COLUMN IF NOT EXISTS next_emi_due_date DATE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS penalty_history JSONB DEFAULT '[]'::jsonb;
