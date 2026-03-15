const pool = require('./src/db');
pool.query(`
SELECT a.id, a.account_name, at.name as type_name, at.category 
FROM accounts a
JOIN account_types at ON a.account_type_id = at.id
WHERE at.category = 'liability';
`)
.then(res => { console.log(res.rows); pool.end(); });
