const pool = require('./src/db');

async function checkConstraints() {
  try {
    const result = await pool.query(`
      SELECT conname, contype, convalidated 
      FROM pg_constraint 
      WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'credit_cards')
      ORDER BY conname
    `);
    
    console.log('Credit card constraints:');
    result.rows.forEach(con => {
      console.log(`- ${con.conname}: ${con.contype} (${con.convalidated ? 'validated' : 'not validated'})`);
    });

    // Check current credit card state
    const cardResult = await pool.query(
      'SELECT id, card_name, current_balance, available_credit, credit_limit FROM credit_cards LIMIT 1'
    );
    
    if (cardResult.rows.length > 0) {
      const card = cardResult.rows[0];
      console.log('\nCurrent credit card state:');
      console.log(`- ${card.card_name}:`);
      console.log(`  Current Balance: ${card.current_balance}`);
      console.log(`  Available Credit: ${card.available_credit}`);
      console.log(`  Credit Limit: ${card.credit_limit}`);
      console.log(`  Available + Current: ${parseFloat(card.available_credit) + parseFloat(card.current_balance)}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkConstraints();
