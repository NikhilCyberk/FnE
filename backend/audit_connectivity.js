const pool = require('./src/db');

async function auditConnections() {
  const query = `
    SELECT 
        cols.table_name, 
        cols.column_name,
        (SELECT count(*) 
         FROM information_schema.key_column_usage kcu
         JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
         WHERE kcu.table_name = cols.table_name 
           AND kcu.column_name = cols.column_name 
           AND tc.constraint_type = 'FOREIGN KEY'
        ) as has_fk
    FROM information_schema.columns cols
    WHERE cols.table_schema = 'public' 
      AND (cols.column_name LIKE '%id' OR cols.column_name LIKE '%_id')
      AND cols.column_name != 'id'
      AND cols.table_name NOT IN ('pg_stat_statements')
    ORDER BY cols.table_name, cols.column_name;
  `;

  try {
    const result = await pool.query(query);
    console.log('--- Missing Connectivity Audit ---');
    console.log('TABLE_NAME | COLUMN_NAME');
    console.log('---------------------------');
    result.rows.forEach(row => {
      if (parseInt(row.has_fk) === 0) {
        console.log(`${row.table_name.padEnd(25)} | ${row.column_name}`);
      }
    });
    process.exit(0);
  } catch (err) {
    console.error('Audit failed:', err.message);
    process.exit(1);
  }
}

auditConnections();
