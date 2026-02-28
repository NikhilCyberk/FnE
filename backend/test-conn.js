const { Client } = require('pg');
require('dotenv').config();

console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 'undefined');
console.log('DB_HOST:', process.env.DB_HOST);

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'postgres',
};

const client = new Client(config);
client.connect()
    .then(() => {
        console.log('Connected successfully!');
        return client.end();
    })
    .catch(err => {
        console.error('Connection failed:', err.message);
    });
