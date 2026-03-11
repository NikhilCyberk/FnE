const pool = require('./src/db');

async function checkConstraintDetails() {
  try {
    // Get the constraint definition
    const result = await pool.query(`
      SELECT pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'credit_cards')
      AND conname = 'check_available_credit'
    `);
    
    if (result.rows.length > 0) {
      console.log('Available credit constraint definition:');
      console.log(result.rows[0].definition);
    }

    // Check current values
    const cardResult = await pool.query(
      'SELECT * FROM credit_cards WHERE card_name = \'BPCL SBI CARD\''
    );
    
    if (cardResult.rows.length > 0) {
      const card = cardResult.rows[0];
      console.log('\nCurrent card values:');
      console.log('Current Balance:', card.current_balance);
      console.log('Available Credit:', card.available_credit);
      console.log('Credit Limit:', card.credit_limit);
      
      console.log('\nTesting constraint logic:');
      const currentBalance = parseFloat(card.current_balance) || 0;
      const availableCredit = parseFloat(card.available_credit) || 0;
      const creditLimit = parseFloat(card.credit_limit) || 0;
      
      console.log('Current Balance + Available Credit:', currentBalance + availableCredit);
      console.log('Credit Limit:', creditLimit);
      console.log('Constraint satisfied?', (currentBalance + availableCredit) <= creditLimit);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkConstraintDetails();
