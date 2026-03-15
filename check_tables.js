const path = require('path');
require(path.join(__dirname, 'backend/node_modules/dotenv')).config({ path: path.join(__dirname, 'backend/.env') });
const pool = require('./backend/src/db');

async function checkSchema() {
    try {
        console.log('Checking columns for transaction_tags and transaction_receipts...');
        const tagsRes = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'transaction_tags'
        `);
        console.log('transaction_tags columns:', tagsRes.rows);

        const receiptsRes = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'transaction_receipts'
        `);
        console.log('transaction_receipts columns:', receiptsRes.rows);
    } catch (err) {
        console.error('Check failed:', err.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
