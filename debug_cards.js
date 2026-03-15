const path = require('path');
const backendDir = path.join(__dirname, 'backend');
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });
const { Pool } = require(path.join(backendDir, 'node_modules/pg'));

console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 'undefined');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

async function debug() {
    try {
        console.log('--- Credit Cards and Linkage ---');
        const cards = await pool.query('SELECT id, card_name, account_id FROM credit_cards');
        console.table(cards.rows);

        console.log('\n--- Accounts ---');
        const accounts = await pool.query('SELECT id, account_name FROM accounts');
        console.table(accounts.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

debug();
