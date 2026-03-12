const pool = require('./src/db');

async function checkSchema() {
  try {
    const categories = await pool.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'categories'");
    console.log('Categories Table:', JSON.stringify(categories.rows, null, 2));
    
    const groups = await pool.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'category_groups'");
    console.log('Category Groups Table:', JSON.stringify(groups.rows, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
