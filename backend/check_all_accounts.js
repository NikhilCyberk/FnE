const pool = require('./src/db');
pool.query(`SELECT id, account_name FROM accounts;`)
.then(res => { console.log(res.rows); pool.end(); });
