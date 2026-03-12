const pool = require('./src/db');

async function diagnose() {
  try {
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    const testUserId = userResult.rows[0].id;
    console.log(`User ID: ${testUserId}`);

    console.log('\n--- Accounts ---');
    const accounts = await pool.query('SELECT id, account_name, balance, credit_limit, minimum_balance FROM accounts WHERE user_id = $1', [testUserId]);
    accounts.rows.forEach(r => console.log(JSON.stringify(r)));

    console.log('\n--- Credit Cards ---');
    const cards = await pool.query('SELECT id, account_id, card_name, current_balance, credit_limit FROM credit_cards WHERE user_id = $1', [testUserId]);
    cards.rows.forEach(r => console.log(JSON.stringify(r)));

    process.exit(0);
  } catch (err) {
    console.error('Diagnosis failed:', err.message);
    process.exit(1);
  }
}

diagnose();
