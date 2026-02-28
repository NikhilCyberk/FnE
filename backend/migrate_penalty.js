const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

async function addPenaltyAmountColumn() {
    try {
        await pool.query('ALTER TABLE loans ADD COLUMN IF NOT EXISTS penalty_amount NUMERIC(15, 2) DEFAULT 0.00');
        console.log('Successfully added penalty_amount column to loans table');
    } catch (error) {
        console.error('Error adding penalty_amount column:', error);
    } finally {
        pool.end();
    }
}

addPenaltyAmountColumn();
