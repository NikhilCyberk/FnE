const pool = require('./src/db');

async function checkTables() {
  try {
    const result = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%credit%' ORDER BY table_name"
    );
    console.log('Credit-related tables:');
    result.rows.forEach(row => console.log('-', row.table_name));
    
    // Check credit_card_transactions table structure
    if (result.rows.some(row => row.table_name === 'credit_card_transactions')) {
      const structure = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'credit_card_transactions' 
        ORDER BY ordinal_position
      `);
      console.log('\ncredit_card_transactions structure:');
      structure.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkTables();
