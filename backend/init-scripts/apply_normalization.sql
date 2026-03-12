-- ============================================================
-- DATABASE NORMALIZATION MIGRATION
-- Phases: 1NF → 2NF → 3NF
-- ============================================================

BEGIN;

-- ============================================================
-- PHASE 1: Fix 1NF Violations (Multi-valued / non-atomic columns)
-- ============================================================

-- 1a. Create transaction_tags table (from transactions.tags TEXT[])
CREATE TABLE IF NOT EXISTS transaction_tags (
    transaction_id  UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    tag             VARCHAR(50) NOT NULL,
    PRIMARY KEY (transaction_id, tag)
);

-- Migrate existing tags data
INSERT INTO transaction_tags (transaction_id, tag)
SELECT id, UNNEST(tags)
FROM transactions
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
ON CONFLICT DO NOTHING;

-- 1b. Create transaction_receipts table (from transactions.receipt_urls TEXT[])
CREATE TABLE IF NOT EXISTS transaction_receipts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id  UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migrate existing receipt_urls data
INSERT INTO transaction_receipts (transaction_id, url)
SELECT id, UNNEST(receipt_urls)
FROM transactions
WHERE receipt_urls IS NOT NULL AND array_length(receipt_urls, 1) > 0;

-- Drop old array columns (data already migrated above)
ALTER TABLE transactions DROP COLUMN IF EXISTS tags;
ALTER TABLE transactions DROP COLUMN IF EXISTS receipt_urls;

-- 1c. Add category_id FK to credit_card_transactions (replaces free-text category)
ALTER TABLE credit_card_transactions 
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- ============================================================
-- PHASE 2: Fix 2NF Violations (Redundant / derivable columns)
-- ============================================================

-- 2a. Drop the old varchar cash_source column from transactions
--     (already replaced by cash_source_id INTEGER FK)
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transactions_cash_source;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_cash_source_fkey;
ALTER TABLE transactions DROP COLUMN IF EXISTS cash_source;

-- ============================================================
-- PHASE 3: Fix 3NF Violations (Transitive dependencies)
-- ============================================================

-- 3a. Create lenders table (from loans.lender_name)
CREATE TABLE IF NOT EXISTS lenders (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migrate existing lender names
INSERT INTO lenders (name)
SELECT DISTINCT lender_name FROM loans WHERE lender_name IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- Add lender_id FK to loans
ALTER TABLE loans ADD COLUMN IF NOT EXISTS lender_id UUID REFERENCES lenders(id) ON DELETE SET NULL;

-- Backfill lender_id from existing lender_name data
UPDATE loans l
SET lender_id = le.id
FROM lenders le
WHERE l.lender_name = le.name;

-- Drop old lender_name column (data migrated to lenders table)
ALTER TABLE loans DROP COLUMN IF EXISTS lender_name;

-- 3b. Create merchants table (from transactions.merchant)
CREATE TABLE IF NOT EXISTS merchants (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migrate existing merchant names
INSERT INTO merchants (name)
SELECT DISTINCT merchant FROM transactions WHERE merchant IS NOT NULL AND merchant != ''
ON CONFLICT (name) DO NOTHING;

-- Add merchant_id FK to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL;

-- Backfill merchant_id from existing merchant data
UPDATE transactions t
SET merchant_id = m.id
FROM merchants m
WHERE t.merchant = m.name;

-- Drop old merchant column (data migrated to merchants table)
ALTER TABLE transactions DROP COLUMN IF EXISTS merchant;

-- 3b. Same for credit_card_transactions
INSERT INTO merchants (name)
SELECT DISTINCT merchant FROM credit_card_transactions WHERE merchant IS NOT NULL AND merchant != ''
ON CONFLICT (name) DO NOTHING;

ALTER TABLE credit_card_transactions ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL;

UPDATE credit_card_transactions cct
SET merchant_id = m.id
FROM merchants m
WHERE cct.merchant = m.name;

ALTER TABLE credit_card_transactions DROP COLUMN IF EXISTS merchant;

-- ============================================================
-- Add indexes for new tables and columns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transaction_tags_tx_id    ON transaction_tags(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_receipts_tx_id ON transaction_receipts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_lenders_name              ON lenders(name);
CREATE INDEX IF NOT EXISTS idx_merchants_name            ON merchants(name);
CREATE INDEX IF NOT EXISTS idx_loans_lender_id          ON loans(lender_id);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_id  ON transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_cc_trans_merchant_id     ON credit_card_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_cc_trans_category_id     ON credit_card_transactions(category_id);

COMMIT;
