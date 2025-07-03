const pool = require('../db');
const logger = require('../logger');

function isValidBudgetName(name) { return typeof name === 'string' && name.length > 0 && name.length <= 100; }
function isValidPeriod(period) { return typeof period === 'string' && ['monthly','quarterly','yearly'].includes(period); }

exports.getBudgets = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const result = await pool.query('SELECT * FROM budgets WHERE user_id = $1 ORDER BY id LIMIT $2 OFFSET $3', [userId, limit, offset]);
    res.json({ budgets: result.rows, page, limit });
  } catch (err) {
    logger.error('Get budgets error:', err);
    res.status(500).json({ error: 'Failed to fetch budgets.' });
  }
};

exports.createBudget = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, period, startDate, endDate, totalAmount, status } = req.body;
    if (!isValidBudgetName(name) || !isValidPeriod(period)) {
      return res.status(400).json({ error: 'Invalid budget name or period.' });
    }
    const result = await pool.query(
      'INSERT INTO budgets (user_id, name, period, start_date, end_date, total_amount, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, name, period, startDate, endDate, totalAmount, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('Create budget error:', err);
    res.status(500).json({ error: 'Failed to create budget.' });
  }
};

exports.getBudgetById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM budgets WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Budget not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Get budget by id error:', err);
    res.status(500).json({ error: 'Failed to fetch budget.' });
  }
};

exports.updateBudget = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { name, period, startDate, endDate, totalAmount, status } = req.body;
    if (!isValidBudgetName(name) || !isValidPeriod(period)) {
      return res.status(400).json({ error: 'Invalid budget name or period.' });
    }
    const result = await pool.query(
      'UPDATE budgets SET name = $1, period = $2, start_date = $3, end_date = $4, total_amount = $5, status = $6 WHERE id = $7 AND user_id = $8 RETURNING *',
      [name, period, startDate, endDate, totalAmount, status, id, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Budget not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Update budget error:', err);
    res.status(500).json({ error: 'Failed to update budget.' });
  }
};

exports.deleteBudget = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await pool.query('DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Budget not found.' });
    res.json({ message: 'Budget deleted.' });
  } catch (err) {
    logger.error('Delete budget error:', err);
    res.status(500).json({ error: 'Failed to delete budget.' });
  }
}; 