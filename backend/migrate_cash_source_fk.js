const pool = require('./src/db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Drop duplicate/old constraints
    console.log('Dropping duplicate constraints...');
    await client.query('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transactions_cash_source');
    await client.query('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_cash_source_fkey');
    await client.query('ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS fk_audit_log_user');
    await client.query('ALTER TABLE cash_sources DROP CONSTRAINT IF EXISTS unique_cash_source_name');
    
    // 2. Rename cash_source (varchar) to cash_source_name for clarity
    // then add a new UUID column cash_source_id
    console.log('Migrating transactions.cash_source column to UUID FK...');
    
    // Add a new INTEGER column for the FK (matching live cash_sources.id type)
    await client.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cash_source_id INTEGER');
    
    // Backfill: convert existing name-based values to UUID references
    await client.query(`
      UPDATE transactions t
      SET cash_source_id = cs.id
      FROM cash_sources cs
      WHERE t.cash_source = cs.name
      AND t.cash_source IS NOT NULL
    `);

    console.log('Adding FK from transactions.cash_source_id to cash_sources(id)...');
    await client.query(`
      ALTER TABLE transactions
      ADD CONSTRAINT fk_transactions_cash_source_id
      FOREIGN KEY (cash_source_id) REFERENCES cash_sources(id)
      ON DELETE SET NULL
    `);

    console.log('Done! Verifying...');
    const fks = await client.query(`
      SELECT conname, pg_get_constraintdef(oid)
      FROM pg_constraint
      WHERE conrelid = 'transactions'::regclass AND contype = 'f'
    `);
    fks.rows.forEach(r => console.log(' -', r.conname));

    await client.query('COMMIT');
    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    if (err.detail) console.error('Detail:', err.detail);
    process.exit(1);
  } finally {
    client.release();
  }
}

migrate();
