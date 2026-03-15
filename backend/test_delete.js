const pool = require('./src/db');
(async () => {
  const client = await pool.connect();
  try {
    const userRes = await client.query("SELECT id FROM users LIMIT 1");
    const userId = userRes.rows[0].id;

    const accRes = await client.query("SELECT id FROM accounts WHERE user_id = $1 LIMIT 1", [userId]);
    const accId = accRes.rows[0].id;
    
    // Create a dummy transaction
    const txRes = await client.query(`
      INSERT INTO transactions (user_id, account_id, amount, status, type, description)
      VALUES ($1, $2, 100, 'completed', 'expense', 'Test Tx Bulk Delete')
      RETURNING id
    `, [userId, accId]);
    const txId = txRes.rows[0].id;

    const { deleteBulkTransactions, deleteTransaction } = require('./src/controllers/transactionsController');
    
    await deleteBulkTransactions({
      user: { userId },
      body: { transactionIds: [txId] }
    }, {
      json: (data) => console.log('Response JSON:', data),
      status: (code) => { console.log('Status code:', code); return { json: (data) => console.log('Response JSON:', data) }; }
    });

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
})();
