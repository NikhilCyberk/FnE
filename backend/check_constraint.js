const pool = require('./src/db');
pool.query(`SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'check_available_credit';`)
.then(res => { console.log(res.rows[0]); pool.end(); });
