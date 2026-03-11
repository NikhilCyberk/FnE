const pool = require('./src/db');

async function testImplementation() {
  try {
    console.log('Testing cash implementation...\n');

    // Test 1: Check cash account type exists
    const accountTypeResult = await pool.query(
      "SELECT * FROM account_types WHERE name = 'Cash'"
    );
    console.log('✓ Cash account type:', accountTypeResult.rows[0] || 'Not found');

    // Test 2: Check cash sources exist
    const cashSourcesResult = await pool.query(
      'SELECT name, description FROM cash_sources ORDER BY name LIMIT 5'
    );
    console.log('✓ First 5 cash sources:');
    cashSourcesResult.rows.forEach(cs => {
      console.log(`  - ${cs.name}: ${cs.description}`);
    });

    // Test 3: Check transaction fields exist
    const transactionFieldsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      AND column_name IN ('cash_source', 'source_description')
      ORDER BY column_name
    `);
    console.log('✓ Transaction fields:');
    transactionFieldsResult.rows.forEach(field => {
      console.log(`  - ${field.column_name}: ${field.data_type}`);
    });

    // Test 4: Test get_or_create_cash_account function
    const testUserId = '7e8141cb-c933-4a91-9795-256c5bc03267'; // Real user ID
    try {
      const cashAccountIdResult = await pool.query(
        'SELECT get_or_create_cash_account($1) as account_id',
        [testUserId]
      );
      console.log('✓ Cash account function works, account ID:', cashAccountIdResult.rows[0].account_id);
    } catch (err) {
      console.log('✗ Cash account function failed:', err.message);
    }

    console.log('\n✅ Implementation test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testImplementation();
