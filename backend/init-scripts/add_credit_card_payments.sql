-- Credit Card Payments table
CREATE TABLE IF NOT EXISTS credit_card_payments (
    id SERIAL PRIMARY KEY,
    credit_card_id INTEGER REFERENCES credit_cards(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- stores user email
    payment_amount NUMERIC(14,2) NOT NULL,
    payment_method VARCHAR(50), -- 'bank_transfer', 'check', 'online', 'auto'
    payment_date DATE NOT NULL,
    notes TEXT,
    is_minimum_payment BOOLEAN DEFAULT FALSE,
    transaction_reference VARCHAR(100), -- bank reference number
    status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled Credit Card Payments table
CREATE TABLE IF NOT EXISTS scheduled_credit_card_payments (
    id SERIAL PRIMARY KEY,
    credit_card_id INTEGER REFERENCES credit_cards(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- stores user email
    payment_amount NUMERIC(14,2) NOT NULL,
    payment_method VARCHAR(50),
    schedule_type VARCHAR(20) NOT NULL, -- 'monthly', 'biweekly', 'weekly'
    next_payment_date DATE NOT NULL,
    auto_pay_minimum BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_payment_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credit_card_payments_card_id ON credit_card_payments(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_payments_user_id ON credit_card_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_payments_date ON credit_card_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_card_id ON scheduled_credit_card_payments(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_user_id ON scheduled_credit_card_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_next_date ON scheduled_credit_card_payments(next_payment_date);

-- Add comments for documentation
COMMENT ON TABLE credit_card_payments IS 'Records of payments made towards credit card balances';
COMMENT ON COLUMN credit_card_payments.is_minimum_payment IS 'Indicates if payment was minimum required amount';
COMMENT ON COLUMN credit_card_payments.payment_method IS 'Method used to make the payment';
COMMENT ON TABLE scheduled_credit_card_payments IS 'Automated payment schedules for credit cards';
COMMENT ON COLUMN scheduled_credit_card_payments.schedule_type IS 'Frequency of scheduled payments';
COMMENT ON COLUMN scheduled_credit_card_payments.auto_pay_minimum IS 'If true, pays minimum due instead of full amount';

-- Function to calculate next payment date based on schedule
CREATE OR REPLACE FUNCTION calculate_next_payment_date(
    current_date DATE,
    schedule_type VARCHAR(20)
) RETURNS DATE AS $$
BEGIN
    CASE schedule_type
        WHEN 'weekly' THEN
            RETURN current_date + INTERVAL '7 days';
        WHEN 'biweekly' THEN
            RETURN current_date + INTERVAL '14 days';
        WHEN 'monthly' THEN
            RETURN current_date + INTERVAL '1 month';
        ELSE
            RETURN current_date + INTERVAL '1 month';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update next payment date after payment
CREATE OR REPLACE FUNCTION update_scheduled_payment_next_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE scheduled_credit_card_payments 
        SET next_payment_date = calculate_next_payment_date(NEW.payment_date, schedule_type),
            last_payment_date = NEW.payment_date
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_scheduled_payment_next_date ON credit_card_payments;
CREATE TRIGGER trigger_update_scheduled_payment_next_date
    AFTER INSERT ON credit_card_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_payment_next_date();
