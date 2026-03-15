const pool = require('./src/db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Creating contacts table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(255),
        notes TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_contact UNIQUE(user_id, name)
      )
    `);

    console.log('Altering transactions table...');
    await client.query(`
      ALTER TABLE transactions
      ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS debt_type VARCHAR(20) CHECK (debt_type IN ('borrowed', 'lent', 'repayment')),
      ADD COLUMN IF NOT EXISTS due_date DATE,
      ADD COLUMN IF NOT EXISTS debt_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (debt_status IN ('pending', 'partially_paid', 'settled')),
      ADD COLUMN IF NOT EXISTS debt_group_id UUID;
    `);

    await client.query('COMMIT');
    console.log('Migration P2P Debt Phase 1 completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
