-- Enhance credit card transaction system to integrate with main transactions
-- This script creates the linking between credit card transactions and main transactions

-- Add credit card account type to account_types table
INSERT INTO account_types (name, category, description, is_active) 
VALUES ('Credit Card', 'liability', 'Credit card account', true)
ON CONFLICT (name) DO NOTHING;

-- Add linking field to credit_card_transactions table
ALTER TABLE credit_card_transactions 
ADD COLUMN IF NOT EXISTS main_transaction_id UUID REFERENCES transactions(id),
ADD COLUMN IF NOT EXISTS is_payment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'credit_card';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_main_transaction 
ON credit_card_transactions(main_transaction_id);

-- Create index for payment transactions
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_is_payment 
ON credit_card_transactions(is_payment);

-- Create trigger function to automatically create linked main transactions
CREATE OR REPLACE FUNCTION create_linked_main_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create main transaction if main_transaction_id is null
    IF NEW.main_transaction_id IS NULL THEN
        INSERT INTO transactions (
            user_id, account_id, category_id, amount, type, status,
            description, merchant, transaction_date, posted_date,
            reference_number, tags, notes, is_recurring
        ) VALUES (
            -- Get user_id from credit card
            (SELECT user_id FROM credit_cards WHERE id = NEW.credit_card_id),
            -- Create or get credit card account
            (SELECT get_or_create_credit_card_account(NEW.credit_card_id)),
            NULL, -- category_id - can be set later
            NEW.amount,
            CASE WHEN NEW.is_payment = true THEN 'expense' ELSE 'expense' END, -- Credit card purchases are expenses from cash flow perspective
            'completed',
            NEW.description,
            NEW.merchant,
            NEW.transaction_date,
            NEW.posted_date,
            NEW.reference_number,
            ARRAY[]::text[], -- tags
            NULL, -- notes
            false -- is_recurring
        ) RETURNING id INTO NEW.main_transaction_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create main transactions
DROP TRIGGER IF EXISTS trigger_create_linked_main_transaction ON credit_card_transactions;
CREATE TRIGGER trigger_create_linked_main_transaction
    BEFORE INSERT ON credit_card_transactions
    FOR EACH ROW
    EXECUTE FUNCTION create_linked_main_transaction();

-- Function to get or create credit card account
CREATE OR REPLACE FUNCTION get_or_create_credit_card_account(credit_card_id UUID)
RETURNS UUID AS $$
DECLARE
    credit_card_account_id UUID;
    credit_card_account_type_id UUID;
    card_info RECORD;
BEGIN
    -- Get the credit card account type ID
    SELECT id INTO credit_card_account_type_id 
    FROM account_types 
    WHERE name = 'Credit Card' AND is_active = true;
    
    IF credit_card_account_type_id IS NULL THEN
        RAISE EXCEPTION 'Credit card account type not found';
    END IF;
    
    -- Get credit card info
    SELECT cc.*, u.id as user_id INTO card_info
    FROM credit_cards cc
    JOIN users u ON cc.user_id = u.id
    WHERE cc.id = credit_card_id;
    
    IF card_info.id IS NULL THEN
        RAISE EXCEPTION 'Credit card not found';
    END IF;
    
    -- Check if credit card account already exists
    SELECT a.id INTO credit_card_account_id
    FROM accounts a
    WHERE a.account_type_id = credit_card_account_type_id 
    AND a.user_id = card_info.user_id
    AND a.account_name = 'Credit Card - ' || card_info.card_name
    LIMIT 1;
    
    -- If no credit card account exists, create one
    IF credit_card_account_id IS NULL THEN
        INSERT INTO accounts (
            user_id, 
            account_type_id, 
            account_name, 
            account_number_masked,
            balance, 
            available_balance,
            currency, 
            account_status,
            is_primary
        ) VALUES (
            card_info.user_id,
            credit_card_account_type_id,
            'Credit Card - ' || card_info.card_name,
            '****' || card_info.card_number_last_four,
            card_info.current_balance * -1, -- Credit card balance is negative from asset perspective
            card_info.available_credit,
            'INR',
            'active',
            false
        ) RETURNING id INTO credit_card_account_id;
    END IF;
    
    RETURN credit_card_account_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update credit card balance when transaction is added
CREATE OR REPLACE FUNCTION update_credit_card_balance()
RETURNS TRIGGER AS $$
DECLARE
    card_info RECORD;
BEGIN
    -- Get credit card info
    SELECT * INTO card_info
    FROM credit_cards
    WHERE id = NEW.credit_card_id;
    
    -- Update credit card balance based on transaction type
    IF NEW.is_payment = true THEN
        -- Payment reduces the balance
        UPDATE credit_cards 
        SET current_balance = COALESCE(current_balance, 0) - NEW.amount,
            available_credit = COALESCE(available_credit, 0) + NEW.amount,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.credit_card_id;
    ELSE
        -- Purchase increases the balance
        UPDATE credit_cards 
        SET current_balance = COALESCE(current_balance, 0) + NEW.amount,
            available_credit = COALESCE(available_credit, 0) - NEW.amount,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.credit_card_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update credit card balances
DROP TRIGGER IF EXISTS trigger_update_credit_card_balance ON credit_card_transactions;
CREATE TRIGGER trigger_update_credit_card_balance
    AFTER INSERT ON credit_card_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_credit_card_balance();

-- Add comment to document the new functionality
COMMENT ON COLUMN credit_card_transactions.main_transaction_id IS 'Links to main transactions table for unified reporting';
COMMENT ON COLUMN credit_card_transactions.is_payment IS 'Indicates if this is a payment transaction (reduces balance)';
COMMENT ON COLUMN credit_card_transactions.payment_method IS 'Payment method used for this transaction';
COMMENT ON FUNCTION create_linked_main_transaction() IS 'Automatically creates main transaction for credit card transactions';
COMMENT ON FUNCTION get_or_create_credit_card_account(UUID) IS 'Gets or creates credit card account for linking';
COMMENT ON FUNCTION update_credit_card_balance() IS 'Automatically updates credit card balance when transaction is added';
