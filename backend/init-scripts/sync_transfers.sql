-- Link existing credit cards to accounts based on name matching
-- And ensure the trigger function for future sync is created

-- 1. Helper to link existing cards
DO $$
DECLARE
    cc_record RECORD;
    acc_id UUID;
BEGIN
    FOR cc_record IN SELECT id, card_name, user_id FROM credit_cards WHERE account_id IS NULL LOOP
        SELECT id INTO acc_id 
        FROM accounts 
        WHERE user_id = cc_record.user_id 
        AND (account_name = 'Credit Card - ' || cc_record.card_name OR account_name = cc_record.card_name)
        LIMIT 1;

        IF acc_id IS NOT NULL THEN
            UPDATE credit_cards SET account_id = acc_id WHERE id = cc_record.id;
            RAISE NOTICE 'Linked credit card % to account %', cc_record.card_name, acc_id;
        END IF;
    END LOOP;
END $$;

-- 2. Enhance get_or_create_credit_card_account to update credit_cards table
-- This ensures that when an account is created for a card, the card knows about it.
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
    SELECT * INTO card_info
    FROM credit_cards
    WHERE id = credit_card_id;
    
    IF card_info.id IS NULL THEN
        RAISE EXCEPTION 'Credit card not found';
    END IF;

    -- Return existing if already linked
    IF card_info.account_id IS NOT NULL THEN
        return card_info.account_id;
    END IF;
    
    -- Check if credit card account already exists by name
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
            '****' || COALESCE(card_info.card_number_last_four, 'XXXX'),
            COALESCE(card_info.current_balance, 0) * -1,
            card_info.available_credit,
            'INR',
            'active',
            false
        ) RETURNING id INTO credit_card_account_id;
    END IF;

    -- Update the credit card record with the account_id linkage
    UPDATE credit_cards SET account_id = credit_card_account_id, updated_at = CURRENT_TIMESTAMP WHERE id = credit_card_id;
    
    RETURN credit_card_account_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger function to sync general "Transfer" to "Credit Card Payment"
CREATE OR REPLACE FUNCTION sync_transfer_to_credit_card_payment()
RETURNS TRIGGER AS $$
DECLARE
    card_id UUID;
    existing_cct UUID;
BEGIN
    -- Check if target account is a credit card account
    SELECT id INTO card_id FROM credit_cards WHERE account_id = NEW.transfer_account_id;
    
    IF card_id IS NOT NULL THEN
        -- Check if it's already linked (avoid infinite loop if created from payment service)
        SELECT id INTO existing_cct FROM credit_card_transactions WHERE main_transaction_id = NEW.id;
        
        IF existing_cct IS NULL THEN
            -- Insert into credit_card_transactions as a payment
            INSERT INTO credit_card_transactions (
                credit_card_id, 
                transaction_date, 
                posted_date, 
                description,
                amount, 
                transaction_type, 
                is_payment, 
                main_transaction_id
            ) VALUES (
                card_id,
                NEW.transaction_date,
                COALESCE(NEW.posted_date, NEW.transaction_date),
                'Transfer Payment - ' || COALESCE(NEW.description, 'Credit Card Payment'),
                NEW.amount,
                'payment',
                true,
                NEW.id
            );
            
            -- Note: trigger_update_credit_card_balance on credit_card_transactions 
            -- will handle updating credit_cards.current_balance/available_credit.
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Apply the sync trigger
DROP TRIGGER IF EXISTS trigger_sync_transfer_to_credit_card_payment ON transactions;
CREATE TRIGGER trigger_sync_transfer_to_credit_card_payment
    AFTER INSERT OR UPDATE ON transactions
    FOR EACH ROW
    WHEN (NEW.type = 'transfer' AND NEW.status = 'completed')
    EXECUTE FUNCTION sync_transfer_to_credit_card_payment();

-- Add comments
COMMENT ON FUNCTION sync_transfer_to_credit_card_payment() IS 'Syncs general transfer transactions to credit card payments when the target is a credit card account';
