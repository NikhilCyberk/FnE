const pool = require('./src/db');
pool.query(`
SELECT
    tc.table_name, 
    kcu.column_name,
    rc.delete_rule 
FROM 
    information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name IN ('transaction_tags', 'transaction_receipts', 'credit_card_transactions', 'transactions');
`)
.then(res => { 
  console.log(res.rows); 
  pool.end(); 
})
.catch(err => { 
  console.error(err); 
  pool.end(); 
});
