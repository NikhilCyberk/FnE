-- -- Users table
-- CREATE TABLE IF NOT EXISTS users (
--     id SERIAL PRIMARY KEY,
--     email VARCHAR(255) UNIQUE NOT NULL,
--     password_hash VARCHAR(255) NOT NULL,
--     first_name VARCHAR(100),
--     last_name VARCHAR(100),
--     phone VARCHAR(20),
--     timezone VARCHAR(50),
--     currency VARCHAR(10),
--     is_active BOOLEAN DEFAULT TRUE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Accounts table
-- CREATE TABLE IF NOT EXISTS accounts (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
--     account_name VARCHAR(100) NOT NULL,
--     account_type VARCHAR(50) NOT NULL,
--     account_number VARCHAR(50),
--     bank_name VARCHAR(100),
--     balance NUMERIC(14,2) DEFAULT 0,
--     currency VARCHAR(10) DEFAULT 'INR',
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Categories table
-- CREATE TABLE IF NOT EXISTS categories (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
--     name VARCHAR(100) NOT NULL,
--     type VARCHAR(50) NOT NULL,
--     parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
--     color VARCHAR(20),
--     icon VARCHAR(100),
--     is_system BOOLEAN DEFAULT FALSE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Budgets table
-- CREATE TABLE IF NOT EXISTS budgets (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
--     name VARCHAR(100) NOT NULL,
--     period VARCHAR(20) NOT NULL,
--     start_date DATE NOT NULL,
--     end_date DATE NOT NULL,
--     total_amount NUMERIC(14,2) NOT NULL,
--     status VARCHAR(20) DEFAULT 'active',
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Budget Categories table
-- CREATE TABLE IF NOT EXISTS budget_categories (
--     id SERIAL PRIMARY KEY,
--     budget_id INTEGER REFERENCES budgets(id) ON DELETE CASCADE,
--     category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
--     allocated_amount NUMERIC(14,2) NOT NULL
-- );

-- -- Transactions table
-- CREATE TABLE IF NOT EXISTS transactions (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
--     account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
--     category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
--     amount NUMERIC(14,2) NOT NULL,
--     type VARCHAR(20) NOT NULL,
--     description TEXT,
--     merchant VARCHAR(100),
--     transaction_date DATE NOT NULL,
--     tags TEXT,
--     receipt_url VARCHAR(255),
--     is_recurring BOOLEAN DEFAULT FALSE,
--     recurring_rule JSONB,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Credit Cards table
-- CREATE TABLE IF NOT EXISTS credit_cards (
--     id SERIAL PRIMARY KEY,
--     user_id TEXT NOT NULL, -- stores user email
--     card_name VARCHAR(100),
--     card_number VARCHAR(32),
--     credit_limit NUMERIC(14,2),
--     available_credit_limit NUMERIC(14,2),
--     available_cash_limit NUMERIC(14,2),
--     total_payment_due NUMERIC(14,2),
--     min_payment_due NUMERIC(14,2),
--     statement_period VARCHAR(50),
--     payment_due_date DATE,
--     statement_gen_date DATE,
--     address TEXT,
--     issuer VARCHAR(100),
--     status VARCHAR(20) DEFAULT 'Active',
--     statement_period_start DATE,
--     statement_period_end DATE,
--     bill_paid BOOLEAN DEFAULT FALSE,
--     bill_paid_on TIMESTAMP,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Credit Card Transactions table
-- CREATE TABLE IF NOT EXISTS credit_card_transactions (
--     id SERIAL PRIMARY KEY,
--     card_id INTEGER REFERENCES credit_cards(id) ON DELETE CASCADE,
--     date DATE NOT NULL,
--     details TEXT,
--     name VARCHAR(100),
--     category VARCHAR(100),
--     amount NUMERIC(14,2) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Card Name Options table
-- CREATE TABLE IF NOT EXISTS card_name_options (
--     id SERIAL PRIMARY KEY,
--     bank_name VARCHAR(100) NOT NULL,
--     card_name VARCHAR(100) NOT NULL
-- ); 






-- Enable UUID extension for better ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table with enhanced security and profile management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferred_currency VARCHAR(3) DEFAULT 'INR',
    locale VARCHAR(10) DEFAULT 'en-IN',
    avatar_url VARCHAR(500),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    last_login TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT check_currency_code CHECK (preferred_currency ~ '^[A-Z]{3}$')
);

-- Financial institutions/banks
CREATE TABLE IF NOT EXISTS financial_institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) UNIQUE, -- IFSC/SWIFT code
    country VARCHAR(2) DEFAULT 'IN', -- ISO country code
    logo_url VARCHAR(500),
    website VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Account types lookup
CREATE TABLE IF NOT EXISTS account_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(20) NOT NULL CHECK (category IN ('asset', 'liability', 'equity')),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Insert default account types
INSERT INTO account_types (name, category, description) VALUES
('Savings Account', 'asset', 'Standard savings account'),
('Checking Account', 'asset', 'Current/checking account'),
('Credit Card', 'liability', 'Credit card account'),
('Investment Account', 'asset', 'Investment/trading account'),
('Loan Account', 'liability', 'Personal/home/auto loan'),
('Cash', 'asset', 'Physical cash'),
('Digital Wallet', 'asset', 'Digital payment wallet')
ON CONFLICT (name) DO NOTHING;

-- Enhanced accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES financial_institutions(id),
    account_type_id UUID NOT NULL REFERENCES account_types(id),
    account_name VARCHAR(100) NOT NULL,
    account_number_encrypted TEXT, -- Encrypted account number
    account_number_masked VARCHAR(20), -- Masked for display (****1234)
    routing_number VARCHAR(20),
    balance DECIMAL(15,2) DEFAULT 0.00,
    available_balance DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'INR',
    interest_rate DECIMAL(5,4),
    credit_limit DECIMAL(15,2),
    minimum_balance DECIMAL(15,2),
    account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'closed', 'frozen')),
    is_primary BOOLEAN DEFAULT FALSE,
    sync_enabled BOOLEAN DEFAULT FALSE, -- For bank sync
    last_synced TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_currency_code CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT check_credit_limit CHECK (credit_limit IS NULL OR credit_limit > 0),
    CONSTRAINT check_balance_credit CHECK (
        (credit_limit IS NULL AND balance >= COALESCE(minimum_balance, 0)) OR
        (credit_limit IS NOT NULL AND balance >= -credit_limit)
    )
);

-- Category groups for better organization
CREATE TABLE IF NOT EXISTS category_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(100),
    color VARCHAR(7), -- Hex color code
    sort_order INTEGER DEFAULT 0,
    is_system BOOLEAN DEFAULT FALSE
);

-- Enhanced categories with hierarchical structure
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES category_groups(id),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(7),
    keywords TEXT[], -- For auto-categorization
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_category UNIQUE(user_id, name, type),
    CONSTRAINT check_color_format CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Enhanced transactions with better tracking
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    transfer_account_id UUID REFERENCES accounts(id), -- For transfers
    amount DECIMAL(15,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
    description TEXT,
    merchant VARCHAR(100),
    location VARCHAR(255),
    transaction_date DATE NOT NULL,
    posted_date DATE,
    reference_number VARCHAR(100),
    check_number VARCHAR(50),
    tags TEXT[],
    notes TEXT,
    receipt_urls TEXT[],
    
    -- Recurring transaction fields
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_rule JSONB,
    parent_transaction_id UUID REFERENCES transactions(id),
    
    -- Bank sync fields
    external_id VARCHAR(255), -- Bank's transaction ID
    bank_description TEXT,
    bank_category VARCHAR(100),
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_amount_not_zero CHECK (amount != 0),
    CONSTRAINT check_transfer_account CHECK (
        (type = 'transfer' AND transfer_account_id IS NOT NULL AND transfer_account_id != account_id) OR
        (type != 'transfer' AND transfer_account_id IS NULL)
    )
);

-- Budget periods lookup
CREATE TABLE IF NOT EXISTS budget_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    months INTEGER NOT NULL,
    description TEXT
);

INSERT INTO budget_periods (name, months, description) VALUES
('Weekly', 0, 'Weekly budget period'),
('Monthly', 1, 'Monthly budget period'),
('Quarterly', 3, 'Quarterly budget period'),
('Yearly', 12, 'Annual budget period')
ON CONFLICT (name) DO NOTHING;

-- Enhanced budgets
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    period_id UUID NOT NULL REFERENCES budget_periods(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    rollover_unused BOOLEAN DEFAULT FALSE,
    alert_threshold DECIMAL(5,2) DEFAULT 0.80, -- Alert at 80%
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_total_amount CHECK (total_amount > 0),
    CONSTRAINT check_date_range CHECK (end_date > start_date),
    CONSTRAINT check_alert_threshold CHECK (alert_threshold > 0 AND alert_threshold <= 1)
);

-- Budget category allocations
CREATE TABLE IF NOT EXISTS budget_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    allocated_amount DECIMAL(15,2) NOT NULL,
    spent_amount DECIMAL(15,2) DEFAULT 0.00,
    rollover_amount DECIMAL(15,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_budget_category UNIQUE(budget_id, category_id),
    CONSTRAINT check_allocated_amount CHECK (allocated_amount >= 0)
);

-- Enhanced credit cards as separate entity
CREATE TABLE IF NOT EXISTS credit_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id), -- Link to account if managed there
    institution_id UUID REFERENCES financial_institutions(id),
    card_name VARCHAR(100) NOT NULL,
    card_number_encrypted TEXT,
    card_number_last_four VARCHAR(4),
    card_type VARCHAR(20) CHECK (card_type IN ('visa', 'mastercard', 'amex', 'discover', 'rupay')),
    credit_limit DECIMAL(15,2),
    available_credit DECIMAL(15,2),
    cash_advance_limit DECIMAL(15,2),
    current_balance DECIMAL(15,2) DEFAULT 0.00,
    minimum_payment DECIMAL(15,2) DEFAULT 0.00,
    
    -- Statement details
    statement_date DATE,
    payment_due_date DATE,
    statement_balance DECIMAL(15,2),
    last_payment_amount DECIMAL(15,2),
    last_payment_date DATE,
    
    -- Interest and fees
    apr DECIMAL(5,4),
    annual_fee DECIMAL(10,2),
    late_fee DECIMAL(10,2),
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed', 'frozen')),
    expiry_date DATE,
    billing_address JSONB,
    rewards_program VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_credit_limit CHECK (credit_limit > 0),
    CONSTRAINT check_available_credit CHECK (available_credit >= 0 AND available_credit <= credit_limit)
);

-- Credit card transactions (separate from regular transactions)
CREATE TABLE IF NOT EXISTS credit_card_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    posted_date DATE,
    description TEXT NOT NULL,
    merchant VARCHAR(100),
    category VARCHAR(100),
    amount DECIMAL(15,2) NOT NULL,
    transaction_type VARCHAR(20) DEFAULT 'purchase' CHECK (
        transaction_type IN ('purchase', 'payment', 'refund', 'fee', 'interest', 'cash_advance')
    ),
    reference_number VARCHAR(100),
    rewards_earned DECIMAL(10,2),
    foreign_transaction BOOLEAN DEFAULT FALSE,
    
    -- Statement period
    statement_date DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_amount_not_zero CHECK (amount != 0)
);

-- Goals and savings targets
CREATE TABLE IF NOT EXISTS financial_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id), -- Target account
    name VARCHAR(100) NOT NULL,
    description TEXT,
    goal_type VARCHAR(20) NOT NULL CHECK (goal_type IN ('savings', 'debt_payoff', 'investment', 'emergency_fund')),
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0.00,
    target_date DATE,
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    auto_contribute BOOLEAN DEFAULT FALSE,
    contribution_amount DECIMAL(15,2),
    contribution_frequency VARCHAR(20) CHECK (contribution_frequency IN ('weekly', 'monthly', 'quarterly')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_target_amount CHECK (target_amount > 0),
    CONSTRAINT check_current_amount CHECK (current_amount >= 0)
);

-- Recurring transactions/scheduled payments
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE,
    next_date DATE NOT NULL,
    last_processed DATE,
    auto_process BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_amount_not_zero CHECK (amount != 0)
);

-- User preferences and settings
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_preference UNIQUE(user_id, preference_key)
);

-- Audit log for sensitive operations
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- INDEXES for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_verification ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_active ON accounts(user_id, account_status) WHERE account_status = 'active';
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_active ON categories(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_card_id ON credit_card_transactions(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_date ON credit_card_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_active ON budgets(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON financial_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_user_id ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_next_date ON recurring_transactions(next_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);

-- GIN indexes for JSON and array columns
CREATE INDEX IF NOT EXISTS idx_transactions_tags ON transactions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_categories_keywords ON categories USING GIN(keywords);

-- TRIGGERS for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_institutions_updated_at BEFORE UPDATE ON financial_institutions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_categories_updated_at BEFORE UPDATE ON budget_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credit_cards_updated_at BEFORE UPDATE ON credit_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credit_card_transactions_updated_at BEFORE UPDATE ON credit_card_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_goals_updated_at BEFORE UPDATE ON financial_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_transactions_updated_at BEFORE UPDATE ON recurring_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SECURITY: Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (customize based on your auth system)
-- Note: You'll need to set up proper authentication context first
-- CREATE POLICY user_own_data ON users FOR ALL USING (id = current_setting('app.current_user_id', true)::UUID);
-- CREATE POLICY user_accounts ON accounts FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);
-- CREATE POLICY user_categories ON categories FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);
-- CREATE POLICY user_transactions ON transactions FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);
-- CREATE POLICY user_budgets ON budgets FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);
-- CREATE POLICY user_credit_cards ON credit_cards FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);
-- CREATE POLICY user_goals ON financial_goals FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);
-- CREATE POLICY user_recurring ON recurring_transactions FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);
-- CREATE POLICY user_preferences_policy ON user_preferences FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);
-- CREATE POLICY user_notifications ON notifications FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- VIEWS for common queries
CREATE VIEW user_account_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    COUNT(a.id) as total_accounts,
    SUM(CASE WHEN at.category = 'asset' THEN a.balance ELSE 0 END) as total_assets,
    SUM(CASE WHEN at.category = 'liability' THEN ABS(a.balance) ELSE 0 END) as total_liabilities,
    SUM(CASE WHEN at.category = 'asset' THEN a.balance ELSE -a.balance END) as net_worth
FROM users u
LEFT JOIN accounts a ON u.id = a.user_id AND a.account_status = 'active'
LEFT JOIN account_types at ON a.account_type_id = at.id
GROUP BY u.id, u.email, u.first_name, u.last_name;

CREATE VIEW monthly_spending_by_category AS
SELECT 
    t.user_id,
    DATE_TRUNC('month', t.transaction_date) as month,
    c.name as category_name,
    SUM(t.amount) as total_spent
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.type = 'expense'
GROUP BY t.user_id, DATE_TRUNC('month', t.transaction_date), c.name;

-- FUNCTIONS for common operations
CREATE OR REPLACE FUNCTION calculate_account_balance(account_uuid UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    balance DECIMAL(15,2);
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN type = 'income' THEN amount
            WHEN type = 'expense' THEN -amount
            WHEN type = 'transfer' AND account_id = account_uuid THEN -amount
            WHEN type = 'transfer' AND transfer_account_id = account_uuid THEN amount
            ELSE 0
        END
    ), 0) INTO balance
    FROM transactions
    WHERE (account_id = account_uuid OR transfer_account_id = account_uuid)
    AND status = 'completed';
    
    RETURN balance;
END;
$$ LANGUAGE plpgsql;

-- Sample data insertion for testing (optional)
-- INSERT INTO financial_institutions (name, code, country) VALUES
-- ('State Bank of India', 'SBIN0000001', 'IN'),
-- ('HDFC Bank', 'HDFC0000001', 'IN'),
-- ('ICICI Bank', 'ICIC0000001', 'IN');

-- COMMENTS for documentation
COMMENT ON TABLE users IS 'Core user accounts with enhanced security features';
COMMENT ON TABLE accounts IS 'User financial accounts with encryption and comprehensive metadata';
COMMENT ON TABLE transactions IS 'All financial transactions with enhanced categorization and tracking';
COMMENT ON TABLE budgets IS 'User budgets with flexible periods and alerting';
COMMENT ON TABLE credit_cards IS 'Dedicated credit card management with detailed tracking';
COMMENT ON TABLE financial_goals IS 'User financial goals and savings targets';
COMMENT ON TABLE audit_log IS 'Comprehensive audit trail for sensitive operations';
COMMENT ON FUNCTION calculate_account_balance(UUID) IS 'Calculates real-time account balance from transactions';