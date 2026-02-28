const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

async function run() {
    try {
        await pool.query("ALTER TABLE loans ADD COLUMN IF NOT EXISTS loan_schedule JSONB DEFAULT '[]'::jsonb");
        console.log('Added loan_schedule column');
        await pool.query("ALTER TABLE loans ADD COLUMN IF NOT EXISTS transactions JSONB DEFAULT '[]'::jsonb");
        console.log('Added transactions column');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        pool.end();
    }
}

run();
