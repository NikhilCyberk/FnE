const pool = require('./src/db');

async function fixBalanceFunction() {
  try {
    console.log('Fixing credit card balance function...');

    // Drop and recreate the function with COALESCE
    await pool.query('DROP FUNCTION IF EXISTS update_credit_card_balance()');
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_credit_card_balance()
      RETURNS TRIGGER AS $$
      DECLARE
          card_info RECORD;
      BEGIN
          -- Update credit card balance based on transaction type
          IF NEW.is_payment = true THEN
              -- Payment reduces the balance
              UPDATE credit_cards 
              SET current_balance = COALESCE(current_balance, 0) - NEW.amount,
                  available_credit = COALESCE(available_credit, 0) + NEW.amount,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = NEW.credit_card_id;
          ELSE
              -- Purchase increases the balance
              UPDATE credit_cards 
              SET current_balance = COALESCE(current_balance, 0) + NEW.amount,
                  available_credit = COALESCE(available_credit, 0) - NEW.amount,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = NEW.credit_card_id;
          END IF;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✓ Recreated balance function with COALESCE');

    // Recreate the trigger
    await pool.query('DROP TRIGGER IF EXISTS trigger_update_credit_card_balance ON credit_card_transactions');
    await pool.query(`
      CREATE TRIGGER trigger_update_credit_card_balance
          AFTER INSERT ON credit_card_transactions
          FOR EACH ROW
          EXECUTE FUNCTION update_credit_card_balance()
    `);
    console.log('✓ Recreated balance trigger');

    console.log('✅ Balance function fix completed!');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await pool.end();
  }
}

fixBalanceFunction();
