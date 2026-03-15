const path = require('path');
require(path.join(__dirname, 'backend/node_modules/dotenv')).config({ path: path.join(__dirname, 'backend/.env') });
const pool = require('./backend/src/db');

async function checkConstraint() {
    try {
        console.log('Fetching constraint definition for check_transfer_account...');
        const res = await pool.query(`
            SELECT pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conname = 'check_transfer_account'
        `);
        if (res.rows.length === 0) {
            console.log('Constraint check_transfer_account not found.');
        } else {
            console.log('Constraint Definition:', res.rows[0].definition);
        }
    } catch (err) {
        console.error('Failed to fetch constraint:', err.message);
    } finally {
        await pool.end();
    }
}

checkConstraint();
