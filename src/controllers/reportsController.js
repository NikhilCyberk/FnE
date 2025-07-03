const pool = require('../db');
const logger = require('../logger');

exports.spendingSummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = 'monthly', startDate, endDate } = req.query;
    let groupBy = 'DATE_TRUNC(';
    if (period === 'monthly') groupBy += `'month', transaction_date)`;
    else if (period === 'quarterly') groupBy += `'quarter', transaction_date)`;
    else if (period === 'yearly') groupBy += `'year', transaction_date)`;
    else groupBy += `'month', transaction_date)`;
    let query = `SELECT ${groupBy} as period, SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income, SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense FROM transactions WHERE user_id = $1`;
    const params = [userId];
    if (startDate) { query += ' AND transaction_date >= $2'; params.push(startDate); }
    if (endDate) { query += ` AND transaction_date <= $${params.length + 1}`; params.push(endDate); }
    query += ' GROUP BY period ORDER BY period DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    logger.error('Spending summary error:', err);
    res.status(500).json({ error: 'Failed to generate spending summary.' });
  }
};

exports.categoryBreakdown = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;
    let query = `SELECT c.name as category, SUM(t.amount) as total FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.user_id = $1`;
    const params = [userId];
    if (startDate) { query += ' AND t.transaction_date >= $2'; params.push(startDate); }
    if (endDate) { query += ` AND t.transaction_date <= $${params.length + 1}`; params.push(endDate); }
    query += ' GROUP BY c.name ORDER BY total DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    logger.error('Category breakdown error:', err);
    res.status(500).json({ error: 'Failed to generate category breakdown.' });
  }
};

exports.cashFlow = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;
    let query = `SELECT transaction_date, SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as cash_flow FROM transactions WHERE user_id = $1`;
    const params = [userId];
    if (startDate) { query += ' AND transaction_date >= $2'; params.push(startDate); }
    if (endDate) { query += ` AND transaction_date <= $${params.length + 1}`; params.push(endDate); }
    query += ' GROUP BY transaction_date ORDER BY transaction_date';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    logger.error('Cash flow error:', err);
    res.status(500).json({ error: 'Failed to generate cash flow report.' });
  }
}; 