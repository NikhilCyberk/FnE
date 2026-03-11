const pool = require('./src/db');

async function fixCashFunction() {
  try {
    console.log('Fixing cash account function...');

    // Drop the existing function
    await pool.query('DROP FUNCTION IF EXISTS get_or_create_cash_account(INTEGER)');
    console.log('✓ Dropped existing function');

    // Recreate the function with correct parameter and return type
    await pool.query(`
      CREATE OR REPLACE FUNCTION get_or_create_cash_account(user_id_param UUID)
      RETURNS UUID AS $$
      DECLARE
          cash_account_id UUID;
          cash_account_type_id UUID;
      BEGIN
          -- Get the cash account type ID
          SELECT id INTO cash_account_type_id 
          FROM account_types 
          WHERE name = 'Cash' AND is_active = true;
          
          IF cash_account_type_id IS NULL THEN
              RAISE EXCEPTION 'Cash account type not found';
          END IF;
          
          -- Check if user already has a cash account
          SELECT a.id INTO cash_account_id
          FROM accounts a
          JOIN account_types at ON a.account_type_id = at.id
          WHERE a.user_id = user_id_param 
          AND at.name = 'Cash' 
          AND a.account_status = 'active'
          LIMIT 1;
          
          -- If no cash account exists, create one
          IF cash_account_id IS NULL THEN
              INSERT INTO accounts (
                  user_id, 
                  account_type_id, 
                  account_name, 
                  balance, 
                  available_balance,
                  currency, 
                  account_status,
                  is_primary
              ) VALUES (
                  user_id_param,
                  cash_account_type_id,
                  'Cash on Hand',
                  0,
                  0,
                  'INR',
                  'active',
                  false
              ) RETURNING id INTO cash_account_id;
          END IF;
          
          RETURN cash_account_id;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✓ Recreated function with UUID return type');

    // Test the function
    const testResult = await pool.query(
      'SELECT get_or_create_cash_account($1) as account_id',
      ['7e8141cb-c933-4a91-9795-256c5bc03267'] // Use real user ID
    );
    console.log('✓ Function test result:', testResult.rows[0].account_id);

    console.log('✅ Cash function fixed successfully!');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await pool.end();
  }
}

fixCashFunction();
