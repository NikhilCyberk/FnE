require('dotenv').config({ path: '../.env' });
const pool = require('./db');

async function check() {
  try {
    const res = await pool.query("SELECT trigger_name, action_statement FROM information_schema.triggers WHERE event_object_table = 'users'");
    console.log('Triggers on users:', res.rows);
    
    const accTypes = await pool.query("SELECT name FROM account_types");
    console.log('Account Types:', accTypes.rows.map(r => r.name));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
