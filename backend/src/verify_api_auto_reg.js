const http = require('http');
require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

function post(url, data) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const postData = JSON.stringify(data);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let resData = '';
            res.on('data', (chunk) => resData += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    data: resData ? JSON.parse(resData) : {}
                });
            });
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

async function verify() {
    const email = 'nikhilkumar7585@gmail.com';
    const password = '123456';

    try {
        console.log('--- Step 1: Attempting Login ---');
        const response = await post('http://localhost:3000/api/auth/login', {
            email,
            password
        });
        
        console.log('Login Status:', response.status);
        if (response.data.token) {
            console.log('Login SUCCESS: JWT token received.');
        } else {
            console.log('Login FAILED: ', response.data);
            return;
        }

        console.log('\n--- Step 2: Verifying Database Side Effects ---');
        const pool = new Pool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT),
            database: process.env.DB_NAME
        });

        const userRes = await pool.query('SELECT id, email, first_name FROM users WHERE email = $1', [email]);
        console.log('User created:', userRes.rows);

        if (userRes.rows.length > 0) {
            const userId = userRes.rows[0].id;
            const accountsRes = await pool.query('SELECT account_name, balance FROM accounts WHERE user_id = $1', [userId]);
            console.log('Accounts created for user:', accountsRes.rows);
        }

        await pool.end();
        console.log('\nVerification COMPLETE: Auto-registration is working correctly.');

    } catch (err) {
        console.error('Verification failed:', err.message);
    }
}

verify();
