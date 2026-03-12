-- Restore missing balance update logic

-- 1. Function to recalculate and update a single account's balance
CREATE OR REPLACE FUNCTION recalculate_account_balance(account_uuid UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    calculated_balance DECIMAL(15,2);
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN type = 'income' THEN amount
            WHEN type = 'expense' THEN -amount
            WHEN type = 'transfer' AND account_id = account_uuid THEN -amount
            WHEN type = 'transfer' AND transfer_account_id = account_uuid THEN amount
            ELSE 0
        END
    ), 0) INTO calculated_balance
    FROM transactions
    WHERE (account_id = account_uuid OR transfer_account_id = account_uuid)
    AND status = 'completed';
    
    -- Update the account balance
    UPDATE accounts 
    SET balance = calculated_balance, 
        updated_at = CURRENT_TIMESTAMP
    WHERE id = account_uuid;
    
    RETURN calculated_balance;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger function to call recalculation on transaction changes
CREATE OR REPLACE FUNCTION update_account_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Update source account balance
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.account_id IS NOT NULL THEN
            PERFORM recalculate_account_balance(NEW.account_id);
        END IF;
        IF NEW.transfer_account_id IS NOT NULL THEN
            PERFORM recalculate_account_balance(NEW.transfer_account_id);
        END IF;
        
        -- If account_id changed in an UPDATE, also update the OLD account
        IF TG_OP = 'UPDATE' AND OLD.account_id IS NOT NULL AND OLD.account_id != NEW.account_id THEN
            PERFORM recalculate_account_balance(OLD.account_id);
        END IF;
    END IF;
    
    -- Update source account balance on delete
    IF TG_OP = 'DELETE' THEN
        IF OLD.account_id IS NOT NULL THEN
            PERFORM recalculate_account_balance(OLD.account_id);
        END IF;
        IF OLD.transfer_account_id IS NOT NULL THEN
            PERFORM recalculate_account_balance(OLD.transfer_account_id);
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger for transactions table
DROP TRIGGER IF EXISTS trigger_update_account_balance ON transactions;
CREATE TRIGGER trigger_update_account_balance
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_account_balance_on_transaction();
