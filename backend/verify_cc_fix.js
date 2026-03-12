const pool = require('./src/db');
const creditCardPaymentService = require('./src/services/creditCardPaymentService');

async function testPayment() {
  const userId = 'bc5ea319-f3b1-44b2-a961-0422a61fa256'; // Replace with a valid user ID if needed
  
  try {
    // 1. Get a credit card and an account to test with
    const cards = await pool.query('SELECT * FROM credit_cards LIMIT 1');
    const accounts = await pool.query('SELECT * FROM accounts WHERE account_type_id != (SELECT id FROM account_types WHERE name = \'Credit Card\') LIMIT 1');
    
    if (cards.rows.length === 0 || accounts.rows.length === 0) {
      console.log('No cards or accounts found to test with.');
      return;
    }
    
    const card = cards.rows[0];
    const account = accounts.rows[0];
    const testUserId = card.user_id;
    
    console.log(`Testing with Card: ${card.card_name} (ID: ${card.id})`);
    console.log(`Testing with Account: ${account.account_name} (ID: ${account.id})`);
    console.log(`Initial Card Balance: ${card.current_balance}`);
    
    const paymentAmount = 10.00;
    
    // 2. Perform payment
    console.log('Performing payment...');
    const result = await creditCardPaymentService.makePayment({
      creditCardId: card.id,
      paymentAmount: paymentAmount,
      paymentMethod: 'bank_transfer',
      accountId: account.id,
      notes: 'Verification Test'
    }, testUserId);
    
    console.log('Payment result:', JSON.stringify(result.updatedCard, null, 2));
    
    // 3. Verify transactions in DB
    console.log('Verifying transactions...');
    
    // Check main transactions
    const mainTxs = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 AND amount = $2 ORDER BY created_at DESC LIMIT 5',
      [testUserId, paymentAmount]
    );
    console.log(`Main transactions found: ${mainTxs.rows.length}`);
    mainTxs.rows.forEach(tx => console.log(`- Tx: ${tx.description}, Account: ${tx.account_id}, Type: ${tx.type}`));
    
    // Check credit card transactions
    const ccTxs = await pool.query(
      'SELECT * FROM credit_card_transactions WHERE credit_card_id = $1 AND amount = $2 AND is_payment = true ORDER BY created_at DESC LIMIT 5',
      [card.id, paymentAmount]
    );
    console.log(`CC transactions found: ${ccTxs.rows.length}`);
    ccTxs.rows.forEach(tx => console.log(`- CC Tx: ${tx.description}, Amount: ${tx.amount}, is_payment: ${tx.is_payment}, main_tx: ${tx.main_transaction_id}`));
    
    // 4. Check final balance
    const finalCard = await pool.query('SELECT * FROM credit_cards WHERE id = $1', [card.id]);
    console.log(`Final Card Balance: ${finalCard.rows[0].current_balance}`);
    
    const expectedBalance = parseFloat(card.current_balance) - paymentAmount;
    console.log(`Expected Card Balance: ${expectedBalance}`);
    
    if (Math.abs(parseFloat(finalCard.rows[0].current_balance) - expectedBalance) < 0.01) {
      console.log('SUCCESS: Balance updated correctly.');
    } else {
      console.log('FAILURE: Balance discrepancy found!');
    }
    
    if (ccTxs.rows.length === 1 && mainTxs.rows.length >= 1) { // mainTxs might have others from past runs, but should be at least 1
        // We really want to check if precisely one was created in this run
        console.log('SUCCESS: Transaction counts look correct.');
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await pool.end();
  }
}

testPayment();
