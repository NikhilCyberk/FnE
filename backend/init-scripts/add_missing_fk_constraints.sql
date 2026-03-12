-- Add missing foreign key constraints to ensure proper table connectivity

-- 1. Link transactions to cash_sources
-- First, ensure cash_sources(name) is unique so it can be targeted by a foreign key
ALTER TABLE cash_sources ADD CONSTRAINT unique_cash_source_name UNIQUE (name);

-- Ensure all existing cash_source values are valid or null
UPDATE transactions SET cash_source = NULL WHERE cash_source NOT IN (SELECT name FROM cash_sources);

ALTER TABLE transactions 
ADD CONSTRAINT fk_transactions_cash_source 
FOREIGN KEY (cash_source) REFERENCES cash_sources(name) 
ON DELETE SET NULL;

-- 2. Link audit_log to users
-- Note: audit_log records might belong to a user that was deleted, 
-- but we should still try to link them where possible.
UPDATE audit_log SET user_id = NULL WHERE user_id NOT IN (SELECT id FROM users);

ALTER TABLE audit_log 
ADD CONSTRAINT fk_audit_log_user 
FOREIGN KEY (user_id) REFERENCES users(id) 
ON DELETE SET NULL;

-- 3. Link transactions.id specifically for any tool that might need explicit check
-- (Transactions table already has PK, but let's ensure it's referenced everywhere)

-- 4. Check for any other missing links identified in audit
-- record_id in audit_log is polymorphic (can point to any table), 
-- so we CANNOT add a hard FK constraint there.
