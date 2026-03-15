const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'fne_database',
  password: 'postgrespassword',
  port: 5433,
});

async function checkDb() {
  try {
    const res = await pool.query('SELECT id, card_name, account_id, user_id FROM credit_cards');
    console.log('Credit Cards:');
    console.table(res.rows);
    
    const resAcc = await pool.query('SELECT id, account_name, account_type_id FROM accounts');
    console.log('\nAccounts:');
    console.table(resAcc.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkDb();
