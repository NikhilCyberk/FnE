const pool = require('./src/db');

async function verify() {
  try {
    console.log('--- Verifying Normalization ---');

    // 1. Check if merchants table has data
    const merchants = await pool.query('SELECT COUNT(*) FROM merchants');
    console.log(`Merchants count: ${merchants.rows[0].count}`);

    // 2. Check if lenders table has data
    const lenders = await pool.query('SELECT COUNT(*) FROM lenders');
    console.log(`Lenders count: ${lenders.rows[0].count}`);

    // 3. Check transaction_tags
    const tags = await pool.query('SELECT COUNT(*) FROM transaction_tags');
    console.log(`Transaction Tags count: ${tags.rows[0].count}`);

    // 4. Check if redundant columns are gone from transactions
    const txColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name IN ('merchant', 'tags', 'receipt_urls', 'cash_source')
    `);
    console.log(`Deprecated columns still in transactions: ${txColumns.rows.map(r => r.column_name).join(', ') || 'NONE'}`);

    // 5. Check if redundant columns are gone from loans
    const loanColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'loans' AND column_name = 'lender_name'
    `);
    console.log(`Deprecated columns still in loans: ${loanColumns.rows.map(r => r.column_name).join(', ') || 'NONE'}`);

    // 6. Check credit_card_transactions
    const ccColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'credit_card_transactions' AND column_name IN ('merchant', 'category')
    `);
    console.log(`Deprecated columns still in credit_card_transactions: ${ccColumns.rows.map(r => r.column_name).join(', ') || 'NONE'}`);

    process.exit(0);
  } catch (err) {
    console.error('Verification failed:', err.message);
    process.exit(1);
  }
}

verify();
