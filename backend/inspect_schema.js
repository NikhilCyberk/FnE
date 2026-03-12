const pool = require('./src/db');

async function inspectSchema() {
  try {
    console.log('Fetching constraints for table "accounts"...');
    const result = await pool.query(`
      SELECT conname, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE conrelid = 'accounts'::regclass
    `);
    
    console.log('Constraints:');
    result.rows.forEach(row => {
      console.log(`${row.conname}: ${row.pg_get_constraintdef}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Inspection failed:', err.message);
    process.exit(1);
  }
}

inspectSchema();
