const pool = require('./src/db');

async function checkFunctions() {
  try {
    const functionsToCheck = ['recalculate_account_balance', 'update_account_balance_on_transaction'];
    console.log('Checking for balance update functions...');
    
    for (const func of functionsToCheck) {
      const result = await pool.query(`
        SELECT proname, pg_get_functiondef(p.oid) as definition
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = $1
      `, [func]);
      
      if (result.rows.length > 0) {
        console.log(`✓ Function "${func}" exists.`);
      } else {
        console.log(`✗ Function "${func}" NOT found.`);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err.message);
    process.exit(1);
  }
}

checkFunctions();
