require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME, password: process.env.DB_PASSWORD, port: process.env.DB_PORT });
pool.query(`SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'credit_cards'::regclass AND contype = 'c'`)
    .then(r => { r.rows.forEach(row => console.log(row.conname + ':\n  ' + row.pg_get_constraintdef)); pool.end(); })
    .catch(e => { console.error(e.message); pool.end(); });
