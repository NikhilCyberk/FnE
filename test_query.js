const path = require('path');
require(path.join(__dirname, 'backend/node_modules/dotenv')).config({ path: path.join(__dirname, 'backend/.env') });
const pool = require('./backend/src/db');

async function testQuery() {
    try {
        console.log('Testing GET /api/transactions query...');
        // This is a simplified version of the query in transactionsController.js
        const query = `
            SELECT 
                t.id, t.amount, t.type, t.status, t.description,
                t.transaction_date, 
                a.account_name,
                c.name as category_name,
                ta.account_name as transfer_account_name,
                m.name as merchant,
                COALESCE(ARRAY_AGG(DISTINCT tt.tag) FILTER (WHERE tt.tag IS NOT NULL), '{}') as tags
            FROM transactions t
            LEFT JOIN accounts a ON t.account_id = a.id
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN accounts ta ON t.transfer_account_id = ta.id
            LEFT JOIN merchants m ON t.merchant_id = m.id
            LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
            GROUP BY t.id, a.account_name, c.name, ta.account_name, m.name
            LIMIT 1
        `;
        const res = await pool.query(query);
        console.log('Query successful:', res.rows.length);
    } catch (err) {
        console.error('Query failed:', err.message);
    } finally {
        await pool.end();
    }
}

testQuery();
