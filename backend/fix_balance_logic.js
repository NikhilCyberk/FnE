const pool = require('./src/db');

async function fixBalanceLogic() {
  try {
    console.log('Fixing credit card balance logic...');

    // First, let's initialize the current balance if it's null
    await pool.query(`
      UPDATE credit_cards 
      SET current_balance = COALESCE(current_balance, 0)
      WHERE current_balance IS NULL
    `);
    console.log('✓ Initialized null current balances to 0');

    // Drop the trigger
    await pool.query('DROP TRIGGER IF EXISTS trigger_update_credit_card_balance ON credit_card_transactions');
    console.log('✓ Dropped existing trigger');

    // Fix the balance function with proper constraint checking
    await pool.query('DROP FUNCTION IF EXISTS update_credit_card_balance()');
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_credit_card_balance()
      RETURNS TRIGGER AS $$
      DECLARE
          current_balance_val numeric;
          available_credit_val numeric;
          credit_limit_val numeric;
          new_available_credit numeric;
          new_current_balance numeric;
      BEGIN
          -- Get current credit card values
          SELECT current_balance, available_credit, credit_limit 
          INTO current_balance_val, available_credit_val, credit_limit_val
          FROM credit_cards
          WHERE id = NEW.credit_card_id;
          
          -- Handle null values
          current_balance_val := COALESCE(current_balance_val, 0);
          available_credit_val := COALESCE(available_credit_val, 0);
          credit_limit_val := COALESCE(credit_limit_val, 0);
          
          -- Calculate new values
          IF NEW.is_payment = true THEN
              -- Payment reduces the balance and increases available credit
              new_current_balance := current_balance_val - NEW.amount;
              new_available_credit := available_credit_val + NEW.amount;
          ELSE
              -- Purchase increases the balance and reduces available credit
              new_current_balance := current_balance_val + NEW.amount;
              new_available_credit := available_credit_val - NEW.amount;
          END IF;
          
          -- Ensure constraints are satisfied
          IF new_available_credit < 0 THEN
              new_available_credit := 0;
          END IF;
          
          IF new_available_credit > credit_limit_val THEN
              new_available_credit := credit_limit_val;
          END IF;
          
          -- Update the credit card
          UPDATE credit_cards 
          SET current_balance = new_current_balance,
              available_credit = new_available_credit,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = NEW.credit_card_id;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✓ Recreated balance function with constraint checking');

    // Recreate the trigger
    await pool.query(`
      CREATE TRIGGER trigger_update_credit_card_balance
          AFTER INSERT ON credit_card_transactions
          FOR EACH ROW
          EXECUTE FUNCTION update_credit_card_balance()
    `);
    console.log('✓ Recreated balance trigger');

    console.log('✅ Balance logic fix completed!');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await pool.end();
  }
}

fixBalanceLogic();
