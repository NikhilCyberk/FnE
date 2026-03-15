const pool = require('./src/db');
pool.query(`SELECT tgname, pg_get_triggerdef(oid) FROM pg_trigger WHERE tgrelid = 'credit_card_transactions'::regclass;`)
.then(res => { console.log(res.rows); pool.end(); });
