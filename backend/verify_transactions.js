const pool = require('./src/db');

async function verifyFix() {
  const testEmail = `test_${Date.now()}@example.com`;
  let userId;
  let creditCardId;
  let ccTransactionId;
  let mainTransactionId;

  try {
    // 1. Create a FRESH test user
    console.log(`Creating fresh test user: ${testEmail}`);
    const userInsert = await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name)
        VALUES ($1, 'hashed', 'Test', 'User')
        RETURNING id
    `, [testEmail]);
    userId = userInsert.rows[0].id;
    console.log(`User ID: ${userId}`);

    // 2. Create a NEW credit card for this user with clear limits
    console.log('Creating new credit card for test user...');
    const cardInsert = await pool.query(`
      INSERT INTO credit_cards (user_id, card_name, card_type, card_number_last_four, current_balance, available_credit, credit_limit, status)
      VALUES ($1, 'Verify Card', 'visa', '8888', 0, 10000, 10000, 'active')
      RETURNING id
    `, [userId]);
    creditCardId = cardInsert.rows[0].id;
    console.log(`Credit Card ID: ${creditCardId}`);

    // 3. The account should be created by the first transaction, but let's pre-emptively fix any that might be created
    // Actually, get_or_create_credit_card_account is called by the trigger.
    // Let's create the account manually first to ensure it has the credit limit.
    console.log('Pre-creating account with credit limit...');
    const accountTypeIdResult = await pool.query("SELECT id FROM account_types WHERE name = 'Credit Card'");
    const accountTypeId = accountTypeIdResult.rows[0].id;

    await pool.query(`
        INSERT INTO accounts (user_id, account_type_id, account_name, balance, credit_limit, account_status)
        VALUES ($1, $2, $3, 0, 10000, 'active')
    `, [userId, accountTypeId, 'Credit Card - Verify Card']);

    // 4. Create a credit card transaction
    console.log('Creating credit card transaction...');
    const txResult = await pool.query(`
      INSERT INTO credit_card_transactions (credit_card_id, transaction_date, description, amount, transaction_type)
      VALUES ($1, CURRENT_DATE, 'Test Trigger Sync', 100.50, 'purchase')
      RETURNING id, main_transaction_id
    `, [creditCardId]);
    
    ccTransactionId = txResult.rows[0].id;
    mainTransactionId = txResult.rows[0].main_transaction_id;
    
    console.log(`CC Transaction ID: ${ccTransactionId}`);
    console.log(`Linked Main Transaction ID: ${mainTransactionId}`);

    if (!mainTransactionId) {
        throw new Error('Main transaction was not created by trigger!');
    }

    // 5. Verify main transaction exists
    const mainCheck = await pool.query('SELECT id, amount, description FROM transactions WHERE id = $1', [mainTransactionId]);
    if (mainCheck.rows.length === 0) {
        throw new Error('Main transaction not found in transactions table!');
    }
    console.log('Verified: Main transaction exists.');

    // 6. Update CC transaction and verify main transaction updates
    console.log('Updating CC transaction description...');
    await pool.query('UPDATE credit_card_transactions SET description = $1 WHERE id = $2', ['Updated Description', ccTransactionId]);
    
    const mainUpdateCheck = await pool.query('SELECT description FROM transactions WHERE id = $1', [mainTransactionId]);
    if (mainUpdateCheck.rows[0].description !== 'Updated Description') {
        throw new Error('Main transaction description was not updated!');
    }
    console.log('Verified: Main transaction updated successfully.');

    // 7. Delete CC transaction and verify main transaction is deleted
    console.log('Deleting credit card transaction...');
    await pool.query('DELETE FROM credit_card_transactions WHERE id = $1', [ccTransactionId]);
    
    const mainDeleteCheck = await pool.query('SELECT id FROM transactions WHERE id = $1', [mainTransactionId]);
    if (mainDeleteCheck.rows.length > 0) {
        throw new Error('Main transaction still exists after CC transaction deletion!');
    }
    console.log('Verified: Main transaction deleted successfully.');

    console.log('ALL VERIFICATIONS PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('Verification failed:', err.message);
    if (err.detail) console.error('Detail:', err.detail);
    process.exit(1);
  }
}

verifyFix();
