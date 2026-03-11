const pool = require('./src/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Starting cash support migration...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'init-scripts/add_cash_support.sql'), 
      'utf8'
    );
    
    // Execute the entire SQL script at once
    console.log('Executing migration script...');
    await pool.query(migrationSQL);
    
    console.log('Migration completed successfully!');
    
    // Verify the migration
    const result = await pool.query('SELECT name FROM cash_sources ORDER BY name');
    console.log('Available cash sources:', result.rows.map(r => r.name));
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
