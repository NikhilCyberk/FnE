const fs = require('fs');
const path = require('path');
const pool = require('./src/db');

async function applyMigration() {
  try {
    const sqlPath = path.join(__dirname, 'init-scripts', 'apply_normalization.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon but be careful about semicolon inside quotes or functions
    // For simplicity, we can run the whole block if it's safe, or split by a more unique marker
    // Here we split by a simple regex that respects the triggers we wrote
    console.log(`Executing SQL from ${sqlPath}...`);
    
    await pool.query(sql);
    
    console.log('Migration applied successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

applyMigration();
