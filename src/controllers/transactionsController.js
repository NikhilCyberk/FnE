const pool = require('../db');
const logger = require('../logger');

function isValidAmount(amount) { return typeof amount === 'number' && amount > 0; }
function isValidType(type) { return typeof type === 'string' && ['income','expense','transfer'].includes(type); }

exports.getTransactions = async (req, res) => {
  logger.info('Get transactions request', { userId: req.user && req.user.id });
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 50, startDate, endDate, categoryId, accountId } = req.query;
    let query = 'SELECT * FROM transactions WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;
    if (startDate) { query += ` AND transaction_date >= $${paramIndex++}`; params.push(startDate); }
    if (endDate) { query += ` AND transaction_date <= $${paramIndex++}`; params.push(endDate); }
    if (categoryId) { query += ` AND category_id = $${paramIndex++}`; params.push(categoryId); }
    if (accountId) { query += ` AND account_id = $${paramIndex++}`; params.push(accountId); }
    query += ' ORDER BY transaction_date DESC LIMIT $' + paramIndex++ + ' OFFSET $' + paramIndex;
    params.push(Number(limit), (Number(page) - 1) * Number(limit));
    const result = await pool.query(query, params);
    logger.info('Get transactions success', { userId: req.user && req.user.id });
    res.json(result.rows);
  } catch (err) {
    logger.error('Get transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { accountId, categoryId, amount, type, description, merchant, transactionDate, tags, receiptUrl, isRecurring, recurringRule } = req.body;
    if (!isValidAmount(amount) || !isValidType(type)) {
      return res.status(400).json({ error: 'Invalid amount or type.' });
    }
    const result = await pool.query(
      `INSERT INTO transactions (user_id, account_id, category_id, amount, type, description, merchant, transaction_date, tags, receipt_url, is_recurring, recurring_rule)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [userId, accountId, categoryId, amount, type, description, merchant, transactionDate, tags, receiptUrl, isRecurring || false, recurringRule]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('Create transaction error:', err);
    res.status(500).json({ error: 'Failed to create transaction.' });
  }
};

exports.getTransactionById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Get transaction by id error:', err);
    res.status(500).json({ error: 'Failed to fetch transaction.' });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { accountId, categoryId, amount, type, description, merchant, transactionDate, tags, receiptUrl, isRecurring, recurringRule } = req.body;
    if (!isValidAmount(amount) || !isValidType(type)) {
      return res.status(400).json({ error: 'Invalid amount or type.' });
    }
    const result = await pool.query(
      `UPDATE transactions SET account_id=$1, category_id=$2, amount=$3, type=$4, description=$5, merchant=$6, transaction_date=$7, tags=$8, receipt_url=$9, is_recurring=$10, recurring_rule=$11 WHERE id=$12 AND user_id=$13 RETURNING *`,
      [accountId, categoryId, amount, type, description, merchant, transactionDate, tags, receiptUrl, isRecurring, recurringRule, id, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Update transaction error:', err);
    res.status(500).json({ error: 'Failed to update transaction.' });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await pool.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found.' });
    res.json({ message: 'Transaction deleted.' });
  } catch (err) {
    logger.error('Delete transaction error:', err);
    res.status(500).json({ error: 'Failed to delete transaction.' });
  }
}; 