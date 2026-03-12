const fs = require('fs');
const path = require('path');
const pool = require('./src/db');

async function applyRestore() {
  try {
    const sqlPath = path.join(__dirname, 'restore_balance_triggers.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log(`Executing SQL from ${sqlPath}...`);
    await pool.query(sql);
    console.log('✓ Balance triggers restored successfully!');
    
    const repairPath = path.join(__dirname, 'repair_balances_v2.js');
    if (fs.existsSync(repairPath)) {
        console.log('Running repair_balances_v2.js...');
        // We'll run it as a separate process to avoid pool conflicts or just require it if it's a function
        const { execSync } = require('child_process');
        execSync('node repair_balances_v2.js', { stdio: 'inherit' });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Operation failed:', err.message);
    process.exit(1);
  }
}

applyRestore();
