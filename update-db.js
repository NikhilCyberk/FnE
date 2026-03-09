const pool = require('./backend/src/db');

async function updateDb() {
    try {
        await pool.query('ALTER TABLE transactions ALTER COLUMN account_id DROP NOT NULL;');
        console.log('Dropped NOT NULL constraint on account_id');
    } catch (e) { console.log('Notice account_id drop:', e.message); }

    try {
        await pool.query('ALTER TABLE transactions ADD COLUMN is_cash BOOLEAN DEFAULT FALSE;');
        console.log('Added is_cash');
    } catch (e) { console.log('Notice is_cash:', e.message); }

    try {
        await pool.query('ALTER TABLE transactions ADD COLUMN cash_source VARCHAR(255);');
        console.log('Added cash_source');
    } catch (e) { console.log('Notice cash_source:', e.message); }

    console.log('Done');
    process.exit(0);
}

updateDb();
