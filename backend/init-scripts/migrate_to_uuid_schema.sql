-- Migration script to transition from old schema to new UUID-based schema
-- This script should be run after the new schema.sql has been applied

-- Step 1: Create a backup of existing data
-- (This should be done manually before running this script)

-- Step 2: Insert default financial institutions
INSERT INTO financial_institutions (name, code, country) VALUES
('State Bank of India', 'SBIN0000001', 'IN'),
('HDFC Bank', 'HDFC0000001', 'IN'),
('ICICI Bank', 'ICIC0000001', 'IN'),
('Axis Bank', 'UTIB0000001', 'IN'),
('Kotak Mahindra Bank', 'KKBK0000001', 'IN'),
('Punjab National Bank', 'PUNB0000001', 'IN'),
('Bank of Baroda', 'BARB0000001', 'IN'),
('Canara Bank', 'CNRB0000001', 'IN'),
('Union Bank of India', 'UBIN0000001', 'IN'),
('Bank of India', 'BKID0000001', 'IN')
ON CONFLICT (name) DO NOTHING;

-- Step 3: Insert default category groups
INSERT INTO category_groups (name, icon, color, sort_order, is_system) VALUES
('Food & Dining', 'restaurant', '#FF6B6B', 1, true),
('Transportation', 'directions_car', '#4ECDC4', 2, true),
('Shopping', 'shopping_cart', '#45B7D1', 3, true),
('Entertainment', 'movie', '#96CEB4', 4, true),
('Healthcare', 'local_hospital', '#FFEAA7', 5, true),
('Utilities', 'home', '#DDA0DD', 6, true),
('Education', 'school', '#98D8C8', 7, true),
('Travel', 'flight', '#F7DC6F', 8, true),
('Salary', 'work', '#82E0AA', 9, true),
('Investment', 'trending_up', '#85C1E9', 10, true),
('Other Income', 'attach_money', '#F8C471', 11, true),
('Other Expenses', 'more_horiz', '#BB8FCE', 12, true)
ON CONFLICT (name) DO NOTHING;

-- Step 4: Insert default categories
-- Income categories
INSERT INTO categories (user_id, group_id, name, type, description, icon, color, keywords, is_system, is_active, sort_order) VALUES
-- Income categories
(NULL, (SELECT id FROM category_groups WHERE name = 'Salary'), 'Salary', 'income', 'Regular employment salary', 'work', '#82E0AA', ARRAY['salary', 'wage', 'pay'], true, true, 1),
(NULL, (SELECT id FROM category_groups WHERE name = 'Investment'), 'Investment Income', 'income', 'Income from investments', 'trending_up', '#85C1E9', ARRAY['dividend', 'interest', 'capital gains'], true, true, 2),
(NULL, (SELECT id FROM category_groups WHERE name = 'Other Income'), 'Freelance', 'income', 'Freelance or contract work', 'computer', '#F8C471', ARRAY['freelance', 'contract', 'consulting'], true, true, 3),
(NULL, (SELECT id FROM category_groups WHERE name = 'Other Income'), 'Business Income', 'income', 'Business or entrepreneurial income', 'business', '#F8C471', ARRAY['business', 'entrepreneur', 'startup'], true, true, 4),
(NULL, (SELECT id FROM category_groups WHERE name = 'Other Income'), 'Gifts', 'income', 'Gifts and donations received', 'card_giftcard', '#F8C471', ARRAY['gift', 'donation', 'present'], true, true, 5),

-- Expense categories
(NULL, (SELECT id FROM category_groups WHERE name = 'Food & Dining'), 'Groceries', 'expense', 'Food and household items', 'shopping_basket', '#FF6B6B', ARRAY['grocery', 'food', 'supermarket'], true, true, 1),
(NULL, (SELECT id FROM category_groups WHERE name = 'Food & Dining'), 'Restaurants', 'expense', 'Dining out and takeout', 'restaurant', '#FF6B6B', ARRAY['restaurant', 'dining', 'takeout', 'food delivery'], true, true, 2),
(NULL, (SELECT id FROM category_groups WHERE name = 'Food & Dining'), 'Coffee & Snacks', 'expense', 'Coffee shops and snacks', 'local_cafe', '#FF6B6B', ARRAY['coffee', 'snack', 'cafe'], true, true, 3),

(NULL, (SELECT id FROM category_groups WHERE name = 'Transportation'), 'Fuel', 'expense', 'Gas and fuel expenses', 'local_gas_station', '#4ECDC4', ARRAY['fuel', 'gas', 'petrol', 'diesel'], true, true, 1),
(NULL, (SELECT id FROM category_groups WHERE name = 'Transportation'), 'Public Transport', 'expense', 'Bus, train, metro fares', 'directions_bus', '#4ECDC4', ARRAY['bus', 'train', 'metro', 'public transport'], true, true, 2),
(NULL, (SELECT id FROM category_groups WHERE name = 'Transportation'), 'Ride Sharing', 'expense', 'Uber, Ola, and other ride services', 'local_taxi', '#4ECDC4', ARRAY['uber', 'ola', 'taxi', 'ride sharing'], true, true, 3),
(NULL, (SELECT id FROM category_groups WHERE name = 'Transportation'), 'Parking', 'expense', 'Parking fees and charges', 'local_parking', '#4ECDC4', ARRAY['parking', 'parking fee'], true, true, 4),

(NULL, (SELECT id FROM category_groups WHERE name = 'Shopping'), 'Clothing', 'expense', 'Clothes and accessories', 'checkroom', '#45B7D1', ARRAY['clothing', 'clothes', 'shirt', 'pants', 'dress'], true, true, 1),
(NULL, (SELECT id FROM category_groups WHERE name = 'Shopping'), 'Electronics', 'expense', 'Electronics and gadgets', 'devices', '#45B7D1', ARRAY['electronics', 'phone', 'laptop', 'gadget'], true, true, 2),
(NULL, (SELECT id FROM category_groups WHERE name = 'Shopping'), 'Home & Garden', 'expense', 'Home improvement and garden supplies', 'home', '#45B7D1', ARRAY['home', 'garden', 'furniture', 'decoration'], true, true, 3),

(NULL, (SELECT id FROM category_groups WHERE name = 'Entertainment'), 'Movies & Shows', 'expense', 'Movies, concerts, and shows', 'movie', '#96CEB4', ARRAY['movie', 'concert', 'show', 'entertainment'], true, true, 1),
(NULL, (SELECT id FROM category_groups WHERE name = 'Entertainment'), 'Gaming', 'expense', 'Video games and gaming expenses', 'sports_esports', '#96CEB4', ARRAY['game', 'gaming', 'video game'], true, true, 2),
(NULL, (SELECT id FROM category_groups WHERE name = 'Entertainment'), 'Books & Media', 'expense', 'Books, magazines, and digital media', 'book', '#96CEB4', ARRAY['book', 'magazine', 'media'], true, true, 3),

(NULL, (SELECT id FROM category_groups WHERE name = 'Healthcare'), 'Medical', 'expense', 'Medical expenses and healthcare', 'local_hospital', '#FFEAA7', ARRAY['medical', 'healthcare', 'doctor', 'hospital'], true, true, 1),
(NULL, (SELECT id FROM category_groups WHERE name = 'Healthcare'), 'Pharmacy', 'expense', 'Medicines and pharmacy expenses', 'local_pharmacy', '#FFEAA7', ARRAY['pharmacy', 'medicine', 'drug'], true, true, 2),
(NULL, (SELECT id FROM category_groups WHERE name = 'Healthcare'), 'Fitness', 'expense', 'Gym memberships and fitness expenses', 'fitness_center', '#FFEAA7', ARRAY['gym', 'fitness', 'workout'], true, true, 3),

(NULL, (SELECT id FROM category_groups WHERE name = 'Utilities'), 'Electricity', 'expense', 'Electricity bills', 'electric_bolt', '#DDA0DD', ARRAY['electricity', 'power', 'electric'], true, true, 1),
(NULL, (SELECT id FROM category_groups WHERE name = 'Utilities'), 'Water', 'expense', 'Water bills', 'water_drop', '#DDA0DD', ARRAY['water', 'water bill'], true, true, 2),
(NULL, (SELECT id FROM category_groups WHERE name = 'Utilities'), 'Internet', 'expense', 'Internet and broadband bills', 'wifi', '#DDA0DD', ARRAY['internet', 'wifi', 'broadband'], true, true, 3),
(NULL, (SELECT id FROM category_groups WHERE name = 'Utilities'), 'Mobile', 'expense', 'Mobile phone bills', 'phone_android', '#DDA0DD', ARRAY['mobile', 'phone', 'cellular'], true, true, 4),

(NULL, (SELECT id FROM category_groups WHERE name = 'Education'), 'Tuition', 'expense', 'School and college tuition fees', 'school', '#98D8C8', ARRAY['tuition', 'school', 'college', 'education'], true, true, 1),
(NULL, (SELECT id FROM category_groups WHERE name = 'Education'), 'Books & Supplies', 'expense', 'Educational books and supplies', 'menu_book', '#98D8C8', ARRAY['book', 'supply', 'stationery'], true, true, 2),

(NULL, (SELECT id FROM category_groups WHERE name = 'Travel'), 'Airfare', 'expense', 'Airplane tickets', 'flight', '#F7DC6F', ARRAY['airfare', 'flight', 'airplane'], true, true, 1),
(NULL, (SELECT id FROM category_groups WHERE name = 'Travel'), 'Accommodation', 'expense', 'Hotel and accommodation expenses', 'hotel', '#F7DC6F', ARRAY['hotel', 'accommodation', 'lodging'], true, true, 2),
(NULL, (SELECT id FROM category_groups WHERE name = 'Travel'), 'Transportation', 'expense', 'Local transportation while traveling', 'directions_car', '#F7DC6F', ARRAY['transport', 'travel transport'], true, true, 3),

-- Transfer category
(NULL, NULL, 'Transfer', 'transfer', 'Money transfers between accounts', 'swap_horiz', '#9B59B6', ARRAY['transfer'], true, true, 1)
ON CONFLICT (name, type) DO NOTHING;

-- Step 5: Create a function to help with data migration (if needed)
CREATE OR REPLACE FUNCTION migrate_old_data()
RETURNS void AS $$
BEGIN
    -- This function can be used to migrate data from old schema if needed
    -- Currently, it's a placeholder for future migration needs
    
    RAISE NOTICE 'Migration function created. Use this to migrate data from old schema if needed.';
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create indexes for better performance (if not already created)
CREATE INDEX IF NOT EXISTS idx_transactions_user_date_type ON transactions(user_id, transaction_date, type);
CREATE INDEX IF NOT EXISTS idx_transactions_category_type ON transactions(category_id, type);
CREATE INDEX IF NOT EXISTS idx_accounts_user_type ON accounts(user_id, account_type_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_type_active ON categories(user_id, type, is_active);

-- Step 7: Create a view for common financial summaries
CREATE OR REPLACE VIEW user_financial_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    COUNT(DISTINCT a.id) as total_accounts,
    SUM(CASE WHEN at.category = 'asset' THEN a.balance ELSE 0 END) as total_assets,
    SUM(CASE WHEN at.category = 'liability' THEN ABS(a.balance) ELSE 0 END) as total_liabilities,
    SUM(CASE WHEN at.category = 'asset' THEN a.balance ELSE -a.balance END) as net_worth,
    COUNT(t.id) as total_transactions,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expenses
FROM users u
LEFT JOIN accounts a ON u.id = a.user_id AND a.account_status = 'active'
LEFT JOIN account_types at ON a.account_type_id = at.id
LEFT JOIN transactions t ON u.id = t.user_id AND t.status = 'completed'
GROUP BY u.id, u.email, u.first_name, u.last_name;

-- Step 8: Create a function to calculate account balance from transactions
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

-- Step 9: Create a trigger to automatically update account balance on transaction changes
CREATE OR REPLACE FUNCTION update_account_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Update source account balance
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM recalculate_account_balance(NEW.account_id);
        IF NEW.transfer_account_id IS NOT NULL THEN
            PERFORM recalculate_account_balance(NEW.transfer_account_id);
        END IF;
    END IF;
    
    -- Update source account balance on delete
    IF TG_OP = 'DELETE' THEN
        PERFORM recalculate_account_balance(OLD.account_id);
        IF OLD.transfer_account_id IS NOT NULL THEN
            PERFORM recalculate_account_balance(OLD.transfer_account_id);
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transactions table
DROP TRIGGER IF EXISTS trigger_update_account_balance ON transactions;
CREATE TRIGGER trigger_update_account_balance
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_account_balance_on_transaction();

-- Step 10: Create a function to get monthly spending by category
CREATE OR REPLACE FUNCTION get_monthly_spending_by_category(
    user_uuid UUID,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    category_name VARCHAR(100),
    category_color VARCHAR(7),
    total_amount DECIMAL(15,2),
    transaction_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.name as category_name,
        c.color as category_color,
        SUM(t.amount) as total_amount,
        COUNT(t.id) as transaction_count
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = user_uuid 
    AND t.type = 'expense'
    AND t.status = 'completed'
    AND (start_date IS NULL OR t.transaction_date >= start_date)
    AND (end_date IS NULL OR t.transaction_date <= end_date)
    GROUP BY c.id, c.name, c.color
    ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create a function to get account balance history
CREATE OR REPLACE FUNCTION get_account_balance_history(
    account_uuid UUID,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    date DATE,
    balance DECIMAL(15,2),
    change_amount DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.transaction_date as date,
        SUM(
            CASE 
                WHEN t.type = 'income' THEN t.amount
                WHEN t.type = 'expense' THEN -t.amount
                WHEN t.type = 'transfer' AND t.account_id = account_uuid THEN -t.amount
                WHEN t.type = 'transfer' AND t.transfer_account_id = account_uuid THEN t.amount
                ELSE 0
            END
        ) OVER (ORDER BY t.transaction_date) as balance,
        CASE 
            WHEN t.type = 'income' THEN t.amount
            WHEN t.type = 'expense' THEN -t.amount
            WHEN t.type = 'transfer' AND t.account_id = account_uuid THEN -t.amount
            WHEN t.type = 'transfer' AND t.transfer_account_id = account_uuid THEN t.amount
            ELSE 0
        END as change_amount
    FROM transactions t
    WHERE (t.account_id = account_uuid OR t.transfer_account_id = account_uuid)
    AND t.status = 'completed'
    AND (start_date IS NULL OR t.transaction_date >= start_date)
    AND (end_date IS NULL OR t.transaction_date <= end_date)
    ORDER BY t.transaction_date;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Add comments for documentation
COMMENT ON FUNCTION migrate_old_data() IS 'Function to help migrate data from old schema to new UUID-based schema';
COMMENT ON FUNCTION recalculate_account_balance(UUID) IS 'Recalculates and updates account balance from transactions';
COMMENT ON FUNCTION get_monthly_spending_by_category(UUID, DATE, DATE) IS 'Returns monthly spending breakdown by category for a user';
COMMENT ON FUNCTION get_account_balance_history(UUID, DATE, DATE) IS 'Returns account balance history over time';

-- Step 13: Create a summary of what was done
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Added default financial institutions: %', (SELECT COUNT(*) FROM financial_institutions);
    RAISE NOTICE 'Added default category groups: %', (SELECT COUNT(*) FROM category_groups);
    RAISE NOTICE 'Added default categories: %', (SELECT COUNT(*) FROM categories WHERE is_system = true);
    RAISE NOTICE 'Created performance indexes and helper functions';
    RAISE NOTICE 'Created triggers for automatic balance updates';
END $$; 