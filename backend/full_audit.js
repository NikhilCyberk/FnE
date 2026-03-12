const pool = require('./src/db');

async function fullAudit() {
  try {
    const res = await pool.query(`
      SELECT 
        cols.table_name, 
        cols.column_name,
        cols.data_type,
        CASE WHEN pk.column_name IS NOT NULL THEN 'PK' ELSE '' END as pk,
        fk.foreign_table_name,
        fk.foreign_column_name
      FROM information_schema.columns cols
      LEFT JOIN (
        SELECT kcu.table_name, kcu.column_name
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
      ) pk ON cols.table_name = pk.table_name AND cols.column_name = pk.column_name
      LEFT JOIN (
        SELECT 
          kcu.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name, 
          ccu.column_name AS foreign_column_name
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
      ) fk ON cols.table_name = fk.table_name AND cols.column_name = fk.column_name
      WHERE cols.table_schema = 'public'
      AND cols.table_name NOT LIKE 'pg_%'
      AND cols.table_name NOT IN ('pg_stat_statements')
      ORDER BY cols.table_name, cols.column_name;
    `);

    console.log('Full Connectivity Audit:');
    console.table(res.rows);
    process.exit(0);
  } catch (err) {
    console.error('Audit failed:', err.message);
    process.exit(1);
  }
}

fullAudit();
