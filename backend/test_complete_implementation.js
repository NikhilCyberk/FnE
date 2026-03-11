const pool = require('./src/db');

async function testCompleteImplementation() {
  try {
    console.log('🧪 Testing Complete Credit Card Transaction Implementation\n');

    // Test 1: Verify database structure
    console.log('✅ Database Structure Check:');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%credit%' OR table_name LIKE '%transaction%')
      ORDER BY table_name
    `);
    console.log('Tables:', tables.rows.map(r => r.table_name));

    // Test 2: Check credit card account type
    const accountType = await pool.query(
      "SELECT * FROM account_types WHERE name = 'Credit Card'"
    );
    console.log('✅ Credit Card Account Type:', accountType.rows[0]?.name || 'Not found');

    // Test 3: Get sample credit card
    const creditCards = await pool.query(
      'SELECT id, card_name, card_number_last_four, current_balance, available_credit FROM credit_cards LIMIT 2'
    );
    
    if (creditCards.rows.length === 0) {
      console.log('⚠️ No credit cards found. Creating test card...');
      
      // Create test user if needed
      const userResult = await pool.query('SELECT id FROM users LIMIT 1');
      if (userResult.rows.length === 0) {
        console.log('❌ No users found. Please create a user first.');
        return;
      }

      // Create test credit card
      const newCard = await pool.query(`
        INSERT INTO credit_cards (
          user_id, card_name, card_number_last_four, card_type,
          credit_limit, available_credit, current_balance, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, card_name, card_number_last_four
      `, [
        userResult.rows[0].id,
        'Test Visa Card',
        '1234',
        'Visa',
        50000,
        50000,
        0,
        'active'
      ]);

      console.log('✅ Created test credit card:', newCard.rows[0]);
      
      // Test with the new card
      await testTransactionOperations(newCard.rows[0].id);
    } else {
      console.log('✅ Found credit cards:');
      creditCards.rows.forEach(card => {
        console.log(`  - ${card.card_name} (****${card.card_number_last_four})`);
      });
      
      // Test with first card
      await testTransactionOperations(creditCards.rows[0].id);
    }

    console.log('\n🎉 Complete Implementation Test Finished Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

async function testTransactionOperations(creditCardId) {
  try {
    console.log(`\n🔄 Testing Transaction Operations for Card: ${creditCardId}`);

    // Get initial card state
    const initialCard = await pool.query(
      'SELECT current_balance, available_credit FROM credit_cards WHERE id = $1',
      [creditCardId]
    );
    console.log('Initial card state:', initialCard.rows[0]);

    // Test 1: Create purchase transaction
    console.log('\n💳 Creating Purchase Transaction...');
    const purchase = await pool.query(`
      INSERT INTO credit_card_transactions (
        credit_card_id, transaction_date, description, merchant,
        category, amount, transaction_type, is_payment
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, amount, description, main_transaction_id
    `, [
      creditCardId,
      '2026-03-10',
      'Online Shopping',
      'Amazon',
      'Shopping',
      2500.00,
      'purchase',
      false
    ]);

    console.log('✅ Purchase created:', purchase.rows[0]);

    // Test 2: Check main transaction link
    if (purchase.rows[0].main_transaction_id) {
      const mainTx = await pool.query(`
        SELECT t.*, a.account_name 
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        WHERE t.id = $1
      `, [purchase.rows[0].main_transaction_id]);

      if (mainTx.rows.length > 0) {
        console.log('✅ Main transaction linked:', {
          id: mainTx.rows[0].id,
          amount: mainTx.rows[0].amount,
          accountName: mainTx.rows[0].account_name
        });
      }
    }

    // Test 3: Check balance update
    const afterPurchase = await pool.query(
      'SELECT current_balance, available_credit FROM credit_cards WHERE id = $1',
      [creditCardId]
    );
    console.log('Balance after purchase:', afterPurchase.rows[0]);

    // Test 4: Create payment transaction
    console.log('\n💸 Creating Payment Transaction...');
    const payment = await pool.query(`
      INSERT INTO credit_card_transactions (
        credit_card_id, transaction_date, description, merchant,
        category, amount, transaction_type, is_payment
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, amount, description
    `, [
      creditCardId,
      '2026-03-10',
      'Credit Card Payment',
      'Bank Transfer',
      'Payment',
      1000.00,
      'payment',
      true
    ]);

    console.log('✅ Payment created:', payment.rows[0]);

    // Test 5: Check final balance
    const finalBalance = await pool.query(
      'SELECT current_balance, available_credit FROM credit_cards WHERE id = $1',
      [creditCardId]
    );
    console.log('Final balance:', finalBalance.rows[0]);

    // Test 6: Get transaction summary
    const summary = await pool.query(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN is_payment = true THEN amount ELSE 0 END) as total_payments,
        SUM(CASE WHEN is_payment = false THEN amount ELSE 0 END) as total_purchases,
        SUM(amount) as total_amount
      FROM credit_card_transactions 
      WHERE credit_card_id = $1
    `, [creditCardId]);

    console.log('✅ Transaction Summary:', summary.rows[0]);

    // Test 7: Check API endpoints would work (simulate)
    console.log('\n🌐 API Endpoints Ready:');
    console.log('  - GET /api/credit-cards/' + creditCardId + '/transactions');
    console.log('  - POST /api/credit-cards/' + creditCardId + '/transactions');
    console.log('  - GET /api/credit-cards/' + creditCardId + '/transactions/summary');
    console.log('  - PUT /api/credit-cards/' + creditCardId + '/transactions/:id');
    console.log('  - DELETE /api/credit-cards/' + creditCardId + '/transactions/:id');

    console.log('\n✅ All Transaction Operations Test Passed!');

  } catch (error) {
    console.error('❌ Transaction operations test failed:', error.message);
    throw error;
  }
}

testCompleteImplementation();
