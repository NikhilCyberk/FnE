const pool = require('./src/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Starting credit card transactions enhancement migration...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'init-scripts/enhance_credit_card_transactions.sql'), 
      'utf8'
    );
    
    // Execute the entire SQL script at once
    console.log('Executing migration script...');
    await pool.query(migrationSQL);
    
    console.log('Migration completed successfully!');
    
    // Verify the migration
    console.log('\nVerifying migration...');
    
    // Check credit card account type
    const accountTypeResult = await pool.query(
      "SELECT * FROM account_types WHERE name = 'Credit Card'"
    );
    console.log('✓ Credit card account type:', accountTypeResult.rows[0] || 'Not found');
    
    // Check new columns in credit_card_transactions
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'credit_card_transactions' 
      AND column_name IN ('main_transaction_id', 'is_payment', 'payment_method')
      ORDER BY column_name
    `);
    console.log('✓ New columns in credit_card_transactions:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });
    
    // Check triggers
    const triggersResult = await pool.query(`
      SELECT trigger_name, event_manipulation, action_timing 
      FROM information_schema.triggers 
      WHERE event_object_table = 'credit_card_transactions'
      ORDER BY trigger_name
    `);
    console.log('✓ Triggers created:');
    triggersResult.rows.forEach(trigger => {
      console.log(`  - ${trigger.trigger_name}: ${trigger.event_manipulation} ${trigger.action_timing}`);
    });
    
    // Check functions
    const functionsResult = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_name LIKE '%credit_card%' OR routine_name LIKE '%transaction%'
      ORDER BY routine_name
    `);
    console.log('✓ Functions created:');
    functionsResult.rows.forEach(func => {
      console.log(`  - ${func.routine_name}`);
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
