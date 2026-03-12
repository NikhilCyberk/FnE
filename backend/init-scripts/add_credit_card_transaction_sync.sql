-- Trigger function to automatically delete linked main transactions
CREATE OR REPLACE FUNCTION delete_linked_main_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.main_transaction_id IS NOT NULL THEN
        DELETE FROM transactions WHERE id = OLD.main_transaction_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically delete main transactions
DROP TRIGGER IF EXISTS trigger_delete_linked_main_transaction ON credit_card_transactions;
CREATE TRIGGER trigger_delete_linked_main_transaction
    AFTER DELETE ON credit_card_transactions
    FOR EACH ROW
    EXECUTE FUNCTION delete_linked_main_transaction();

-- Trigger function to automatically update linked main transactions
CREATE OR REPLACE FUNCTION update_linked_main_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.main_transaction_id IS NOT NULL THEN
        UPDATE transactions SET
            amount = NEW.amount,
            description = NEW.description,
            merchant = NEW.merchant,
            transaction_date = NEW.transaction_date,
            posted_date = NEW.posted_date,
            reference_number = NEW.reference_number,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.main_transaction_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update main transactions
DROP TRIGGER IF EXISTS trigger_update_linked_main_transaction ON credit_card_transactions;
CREATE TRIGGER trigger_update_linked_main_transaction
    AFTER UPDATE ON credit_card_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_linked_main_transaction();
