const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

async function addEmiColumns() {
    try {
        await pool.query("ALTER TABLE loans ADD COLUMN IF NOT EXISTS next_emi_due_date DATE");
        console.log('Successfully added next_emi_due_date column');
        await pool.query("ALTER TABLE loans ADD COLUMN IF NOT EXISTS penalty_history JSONB DEFAULT '[]'::jsonb");
        console.log('Successfully added penalty_history column');
    } catch (error) {
        console.error('Error adding new EMI columns:', error);
    } finally {
        pool.end();
    }
}

addEmiColumns();
