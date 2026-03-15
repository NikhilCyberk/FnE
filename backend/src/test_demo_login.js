require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: 5433,
    database: process.env.DB_NAME
});
const bcrypt = require('bcrypt');

async function test() {
    const email = 'nikhilkumar7585@gmail.com';
    const password = '123456';

    try {
        console.log('Cleaning up existing demo user if any...');
        await pool.query('DELETE FROM users WHERE email = $1', [email]);
        console.log('User deleted.');

        // Now mock a login request
        const { login } = require('./controllers/authController');
        const req = {
            body: { email, password }
        };
        const res = {
            json: (data) => console.log('Login Response:', JSON.stringify(data, null, 2)),
            status: (code) => ({
                json: (data) => console.log(`Status ${code}:`, data)
            })
        };

        console.log('Attempting demo login (should auto-register)...');
        await login(req, res);

        // Verify user exists
        const userRes = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
        console.log('User in DB:', userRes.rows);

        // Verify accounts
        if (userRes.rows.length > 0) {
            const userId = userRes.rows[0].id;
            const accountsRes = await pool.query('SELECT account_name, balance FROM accounts WHERE user_id = $1', [userId]);
            console.log('Accounts created:', accountsRes.rows);
        }

    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        await pool.end();
    }
}

test();
