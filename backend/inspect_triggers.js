const pool = require('./src/db');

async function inspectTriggers() {
  try {
    console.log('Fetching triggers for table "transactions"...');
    const result = await pool.query(`
      SELECT tgname, pg_get_triggerdef(pg_trigger.oid)
      FROM pg_trigger
      JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
      WHERE relname = 'transactions'
    `);
    
    console.log('Triggers:');
    result.rows.forEach(row => {
      console.log(`${row.tgname}: ${row.pg_get_triggerdef}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Inspection failed:', err.message);
    process.exit(1);
  }
}

inspectTriggers();
