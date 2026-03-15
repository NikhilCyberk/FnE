const pool = require('./src/db');
pool.query(`SELECT column_name, ordinal_position FROM information_schema.columns WHERE table_name = 'credit_cards';`)
.then(res => { console.log(res.rows); pool.end(); });
