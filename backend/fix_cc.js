const pool = require('./src/db');
(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Drop the restrictive check constraint
    await client.query('ALTER TABLE credit_cards DROP CONSTRAINT IF EXISTS check_available_credit;');
    
    // Optional: Re-add it just for the lower bound if we want, or no bounds.
    // Real life: you can have negative available credit (over limit).
    // Let's just not add a check constraint, or add one that makes sense.
    
    // 2. Update the trigger function to not cap at credit_limit
    await client.query(`
      CREATE OR REPLACE FUNCTION public.update_credit_card_balance()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $function$
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
          
          -- Update the credit card
          UPDATE credit_cards 
          SET current_balance = new_current_balance,
              available_credit = new_available_credit,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = NEW.credit_card_id;
          
          RETURN NEW;
      END;
      $function$;
    `);
    
    // 3. We should also update the controllers that had bounding logic!
    await client.query('COMMIT');
    console.log('Database fixes applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error applying fixes:', err);
  } finally {
    client.release();
    pool.end();
  }
})();
