-- Update balance function to sync both balance and available_balance

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
    
    -- Update both balance and available_balance to keep them in sync
    UPDATE accounts 
    SET balance = calculated_balance,
        available_balance = calculated_balance,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = account_uuid;
    
    RETURN calculated_balance;
END;
$$ LANGUAGE plpgsql;
