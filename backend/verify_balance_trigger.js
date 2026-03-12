const pool = require('./src/db');

async function verifyFix() {
  try {
    // 1. Get an account to test with
    const accountRes = await pool.query('SELECT id, account_name, balance FROM accounts LIMIT 1');
    if (accountRes.rows.length === 0) {
      console.log('No accounts found to test with.');
      process.exit(0);
    }
    const account = accountRes.rows[0];
    const initialBalance = parseFloat(account.balance);
    console.log(`Testing with account: ${account.account_name} (ID: ${account.id})`);
    console.log(`Initial balance: ₹${initialBalance}`);

    // 2. Get a user_id for the transaction
    const userRes = await pool.query('SELECT id FROM users LIMIT 1');
    const userId = userRes.rows[0].id;

    // 3. Insert a test transaction
    const testAmount = 500;
    console.log(`Adding test expense of ₹${testAmount}...`);
    const insertRes = await pool.query(`
      INSERT INTO transactions (user_id, account_id, amount, type, transaction_date, description, status)
      VALUES ($1, $2, $3, 'expense', CURRENT_DATE, 'Verify Trigger Fix', 'completed')
      RETURNING id
    `, [userId, account.id, testAmount]);
    const txId = insertRes.rows[0].id;

    // 4. Check if balance updated
    const updatedAccountRes = await pool.query('SELECT balance FROM accounts WHERE id = $1', [account.id]);
    const newBalance = parseFloat(updatedAccountRes.rows[0].balance);
    console.log(`Updated balance: ₹${newBalance}`);

    if (Math.abs(newBalance - (initialBalance - testAmount)) < 0.01) {
      console.log('✅ Success! Balance updated correctly.');
    } else {
      console.log('❌ Failure! Balance did NOT update correctly.');
      console.log(`Expected: ₹${initialBalance - testAmount}, Actual: ₹${newBalance}`);
    }

    // 5. Cleanup: Delete the test transaction
    console.log('Cleaning up test transaction...');
    await pool.query('DELETE FROM transactions WHERE id = $1', [txId]);

    // 6. Verify balance restored
    const finalAccountRes = await pool.query('SELECT balance FROM accounts WHERE id = $1', [account.id]);
    const finalBalance = parseFloat(finalAccountRes.rows[0].balance);
    console.log(`Final balance after cleanup: ₹${finalBalance}`);
    
    if (Math.abs(finalBalance - initialBalance) < 0.01) {
      console.log('✅ Success! Balance restored correctly after deletion.');
    } else {
      console.log('❌ Failure! Balance was not restored.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Verification failed:', err.message);
    process.exit(1);
  }
}

verifyFix();
