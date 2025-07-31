const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function ensureDatabaseExists() {
  const dbName = process.env.DB_NAME;
  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'postgres', // connect to default db first
  };

  const client = new Client(config);

  try {
    await client.connect();
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created!`);
      await client.end();
      // Now connect to the new database and run schema
      await runSchema(dbName);
      return;
    } else {
      console.log(`Database "${dbName}" already exists.`);
      // Optionally, you can run the schema every time, or only if just created
      // await runSchema(dbName);
    }
  } catch (err) {
    console.error('Error checking/creating database:', err);
  } finally {
    await client.end();
  }
}

async function runSchema(dbName) {
  const schemaPath = path.join(__dirname, '../init-scripts/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: dbName,
  };
  const client = new Client(config);
  try {
    await client.connect();
    await client.query(schema);
    console.log('Database schema applied successfully.');
  } catch (err) {
    console.error('Error applying schema:', err);
  } finally {
    await client.end();
  }
}

module.exports = ensureDatabaseExists; 