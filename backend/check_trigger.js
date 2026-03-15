const pool = require('./src/db');
pool.query(`SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'update_credit_card_balance';`)
.then(res => { console.log(res.rows[0].pg_get_functiondef); pool.end(); });
