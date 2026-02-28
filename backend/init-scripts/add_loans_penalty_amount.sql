-- Migration Script to add penalty_amount tracking per loan
ALTER TABLE loans ADD COLUMN IF NOT EXISTS penalty_amount NUMERIC(15, 2) DEFAULT 0.00;
