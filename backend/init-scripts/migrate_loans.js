require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function run() {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS loans (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          lender_name VARCHAR(100) NOT NULL,
          loan_type VARCHAR(50) DEFAULT 'Personal',
          loan_amount NUMERIC(15, 2) NOT NULL,
          interest_rate NUMERIC(5, 2) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          emi_amount NUMERIC(15, 2) NOT NULL,
          remaining_balance NUMERIC(15, 2) NOT NULL,
          status VARCHAR(20) DEFAULT 'Active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Ignore the trigger if it exists already, but create the index
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_loans_updated_at') THEN
          CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END $$;
      
      CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
    `);
        console.log("Loans table created successfully");
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
