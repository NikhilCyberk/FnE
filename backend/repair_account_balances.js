const pool = require('./src/db');

async function repairAccounts() {
  try {
    console.log('Repairing all account balances...');
    const result = await pool.query('SELECT id, account_name FROM accounts');
    
    for (const account of result.rows) {
      const balanceRes = await pool.query('SELECT recalculate_account_balance($1) as bal', [account.id]);
      console.log(`✓ Account "${account.account_name}" repaired. New balance: ₹${balanceRes.rows[0].bal}`);
    }
    
    console.log('✅ All account balances repaired!');
    process.exit(0);
  } catch (err) {
    console.error('Repair failed:', err.message);
    process.exit(1);
  }
}

repairAccounts();
