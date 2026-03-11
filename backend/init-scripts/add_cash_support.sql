-- Add cash support to the FnE application
-- This script adds cash account type, cash sources table, and transaction modifications

-- Add cash account type to account_types table
INSERT INTO account_types (name, category, description, is_active) 
VALUES ('Cash', 'asset', 'Physical cash on hand', true)
ON CONFLICT (name) DO NOTHING;

-- Create cash sources table
CREATE TABLE IF NOT EXISTS cash_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default cash sources
INSERT INTO cash_sources (name, description) VALUES
    ('atm_withdrawal', 'Cash withdrawn from ATM'),
    ('bank_transfer', 'Cash received from bank transfer'),
    ('salary_cash', 'Salary received in cash'),
    ('gift', 'Cash received as gift'),
    ('business_income', 'Cash income from business activities'),
    ('refund', 'Cash refund received'),
    ('loan_received', 'Cash received from loan'),
    ('investment_return', 'Cash from investment returns'),
    ('sale_proceeds', 'Cash from selling items'),
    ('other', 'Other cash sources')
ON CONFLICT (name) DO NOTHING;

-- Add cash-related fields to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS cash_source VARCHAR(50) REFERENCES cash_sources(name),
ADD COLUMN IF NOT EXISTS source_description TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_cash_source ON transactions(cash_source);

-- Add constraint to ensure cash_source is only set when account is cash type
-- This will be enforced at the application level for now due to complexity

-- Create a function to get or create cash account for a user
CREATE OR REPLACE FUNCTION get_or_create_cash_account(user_id_param INTEGER)
RETURNS UUID AS $$
DECLARE
    cash_account_id UUID;
    cash_account_type_id UUID;
BEGIN
    -- Get the cash account type ID
    SELECT id INTO cash_account_type_id 
    FROM account_types 
    WHERE name = 'Cash' AND is_active = true;
    
    IF cash_account_type_id IS NULL THEN
        RAISE EXCEPTION 'Cash account type not found';
    END IF;
    
    -- Check if user already has a cash account
    SELECT a.id INTO cash_account_id
    FROM accounts a
    JOIN account_types at ON a.account_type_id = at.id
    WHERE a.user_id = user_id_param 
    AND at.name = 'Cash' 
    AND a.account_status = 'active'
    LIMIT 1;
    
    -- If no cash account exists, create one
    IF cash_account_id IS NULL THEN
        INSERT INTO accounts (
            user_id, 
            account_type_id, 
            account_name, 
            balance, 
            available_balance,
            currency, 
            account_status,
            is_primary
        ) VALUES (
            user_id_param,
            cash_account_type_id,
            'Cash on Hand',
            0,
            0,
            'INR',
            'active',
            false
        ) RETURNING id INTO cash_account_id;
    END IF;
    
    RETURN cash_account_id;
END;
$$ LANGUAGE plpgsql;

-- Add comment to document the new functionality
COMMENT ON COLUMN transactions.cash_source IS 'Source of cash when transaction involves cash account';
COMMENT ON COLUMN transactions.source_description IS 'Additional description for cash source';
COMMENT ON FUNCTION get_or_create_cash_account(INTEGER) IS 'Gets existing cash account or creates new one for user';
