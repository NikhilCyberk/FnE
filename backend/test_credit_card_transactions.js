const pool = require('./src/db');

async function testCreditCardTransactions() {
  try {
    console.log('Testing credit card transaction implementation...\n');

    // Test 1: Check credit card account type exists
    const accountTypeResult = await pool.query(
      "SELECT * FROM account_types WHERE name = 'Credit Card'"
    );
    console.log('✓ Credit card account type:', accountTypeResult.rows[0]?.name || 'Not found');

    // Test 2: Check credit card transactions table structure
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'credit_card_transactions' 
      ORDER BY ordinal_position
    `);
    console.log('✓ Credit card transactions table structure:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });

    // Test 3: Check triggers
    const triggersResult = await pool.query(`
      SELECT trigger_name, event_manipulation, action_timing 
      FROM information_schema.triggers 
      WHERE event_object_table = 'credit_card_transactions'
      ORDER BY trigger_name
    `);
    console.log('✓ Triggers on credit_card_transactions:');
    triggersResult.rows.forEach(trigger => {
      console.log(`  - ${trigger.trigger_name}: ${trigger.event_manipulation} ${trigger.action_timing}`);
    });

    // Test 4: Check functions
    const functionsResult = await pool.query(`
      SELECT routine_name, routine_type 
      FROM information_schema.routines 
      WHERE routine_name LIKE '%credit_card%'
      ORDER BY routine_name
    `);
    console.log('✓ Credit card related functions:');
    functionsResult.rows.forEach(func => {
      console.log(`  - ${func.routine_name} (${func.routine_type})`);
    });

    // Test 5: Get a sample credit card to test with
    const creditCardResult = await pool.query(
      'SELECT id, card_name, user_id FROM credit_cards LIMIT 1'
    );
    
    if (creditCardResult.rows.length === 0) {
      console.log('⚠️ No credit cards found in database. Creating a test credit card...');
      
      // Create a test credit card
      const userResult = await pool.query('SELECT id FROM users LIMIT 1');
      if (userResult.rows.length > 0) {
        const newCardResult = await pool.query(`
          INSERT INTO credit_cards (
            user_id, card_name, card_number_last_four, card_type,
            credit_limit, available_credit, current_balance, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id, card_name
        `, [
          userResult.rows[0].id,
          'Test Credit Card',
          '1234',
          'Visa',
          50000,
          50000,
          0,
          'active'
        ]);
        console.log('✓ Created test credit card:', newCardResult.rows[0]);
        
        // Test with the new card
        await testTransactionCreation(newCardResult.rows[0].id, userResult.rows[0].id);
      }
    } else {
      const card = creditCardResult.rows[0];
      console.log('✓ Using existing credit card:', card.card_name);
      await testTransactionCreation(card.id, card.user_id);
    }

    console.log('\n✅ Credit card transaction implementation test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

async function testTransactionCreation(creditCardId, userId) {
  try {
    console.log(`\n--- Testing transaction creation for card ${creditCardId} ---`);

    // Test 6: Create a test credit card transaction
    console.log('Creating test purchase transaction...');
    const transactionResult = await pool.query(`
      INSERT INTO credit_card_transactions (
        credit_card_id, transaction_date, description, merchant,
        category, amount, transaction_type, is_payment
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, amount, description, main_transaction_id
    `, [
      creditCardId,
      '2026-03-10',
      'Test Purchase',
      'Test Merchant',
      'Shopping',
      1500.00,
      'purchase',
      false
    ]);

    const transaction = transactionResult.rows[0];
    console.log('✓ Created credit card transaction:', {
      id: transaction.id,
      amount: transaction.amount,
      description: transaction.description,
      mainTransactionId: transaction.main_transaction_id
    });

    // Test 7: Check if main transaction was created
    if (transaction.main_transaction_id) {
      const mainTxResult = await pool.query(`
        SELECT t.*, a.account_name 
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        WHERE t.id = $1
      `, [transaction.main_transaction_id]);

      if (mainTxResult.rows.length > 0) {
        const mainTx = mainTxResult.rows[0];
        console.log('✓ Main transaction created:', {
          id: mainTx.id,
          amount: mainTx.amount,
          type: mainTx.type,
          accountName: mainTx.account_name
        });
      }
    }

    // Test 8: Check credit card balance update
    const cardBalanceResult = await pool.query(
      'SELECT current_balance, available_credit FROM credit_cards WHERE id = $1',
      [creditCardId]
    );
    
    const balance = cardBalanceResult.rows[0];
    console.log('✓ Credit card balance updated:', {
      currentBalance: balance.current_balance,
      availableCredit: balance.available_credit
    });

    // Test 9: Test payment transaction
    console.log('Creating test payment transaction...');
    const paymentResult = await pool.query(`
      INSERT INTO credit_card_transactions (
        credit_card_id, transaction_date, description, merchant,
        category, amount, transaction_type, is_payment
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, amount, description
    `, [
      creditCardId,
      '2026-03-10',
      'Test Payment',
      'Bank Transfer',
      'Payment',
      500.00,
      'payment',
      true
    ]);

    const payment = paymentResult.rows[0];
    console.log('✓ Created payment transaction:', {
      id: payment.id,
      amount: payment.amount,
      description: payment.description
    });

    // Test 10: Check balance after payment
    const updatedBalanceResult = await pool.query(
      'SELECT current_balance, available_credit FROM credit_cards WHERE id = $1',
      [creditCardId]
    );
    
    const updatedBalance = updatedBalanceResult.rows[0];
    console.log('✓ Balance after payment:', {
      currentBalance: updatedBalance.current_balance,
      availableCredit: updatedBalance.available_credit,
      balanceChange: parseFloat(updatedBalance.current_balance) - parseFloat(balance.current_balance)
    });

  } catch (error) {
    console.error('❌ Transaction creation test failed:', error.message);
    throw error;
  }
}

testCreditCardTransactions();
