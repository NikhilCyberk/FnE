-- Migration to create credit_card_statements table
CREATE TABLE IF NOT EXISTS credit_card_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
    statement_date DATE NOT NULL,
    statement_period_start DATE,
    statement_period_end DATE,
    total_amount_due DECIMAL(15,2) NOT NULL,
    minimum_amount_due DECIMAL(15,2) NOT NULL,
    payment_due_date DATE NOT NULL,
    available_credit DECIMAL(15,2),
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cc_statements_card_id ON credit_card_statements(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_cc_statements_date ON credit_card_statements(statement_date);

-- Trigger for updated_at (assuming update_updated_at_column exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cc_statements_updated_at') THEN
        CREATE TRIGGER update_cc_statements_updated_at BEFORE UPDATE ON credit_card_statements 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
