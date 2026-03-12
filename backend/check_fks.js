const pool = require('./src/db');

async function checkForeignKeys() {
  const tables = ['transactions', 'audit_log', 'cash_sources', 'credit_cards'];
  try {
    for (const table of tables) {
      console.log(`\n--- Constraints for ${table} ---`);
      try {
        const result = await pool.query(`
          SELECT conname, pg_get_constraintdef(c.oid)
          FROM pg_constraint c
          JOIN pg_namespace n ON n.oid = c.connamespace
          WHERE conrelid = '${table}'::regclass
        `);
        if (result.rows.length === 0) console.log('No constraints found.');
        result.rows.forEach(row => console.log(`${row.conname}: ${row.pg_get_constraintdef}`));
      } catch (e) {
        console.log(`Error checking ${table}: ${e.message}`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err.message);
    process.exit(1);
  }
}

checkForeignKeys();
