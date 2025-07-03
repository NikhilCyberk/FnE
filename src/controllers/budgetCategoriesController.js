const pool = require('../db');
const logger = require('../logger');

// Get all category allocations for a budget
exports.getBudgetCategories = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { budgetId } = req.params;
    const result = await pool.query(
      `SELECT bc.*, c.name as category_name, c.color, c.icon FROM budget_categories bc
       JOIN budgets b ON bc.budget_id = b.id
       JOIN categories c ON bc.category_id = c.id
       WHERE bc.budget_id = $1 AND b.user_id = $2`,
      [budgetId, userId]
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('Get budget categories error:', err);
    res.status(500).json({ error: 'Failed to fetch budget categories.' });
  }
};

// Add a category allocation to a budget
exports.addBudgetCategory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { budgetId, categoryId, allocatedAmount } = req.body;
    // Check if budget belongs to user
    const budgetCheck = await pool.query('SELECT id FROM budgets WHERE id = $1 AND user_id = $2', [budgetId, userId]);
    if (budgetCheck.rows.length === 0) return res.status(404).json({ error: 'Budget not found.' });
    const result = await pool.query(
      'INSERT INTO budget_categories (budget_id, category_id, allocated_amount) VALUES ($1, $2, $3) RETURNING *',
      [budgetId, categoryId, allocatedAmount]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('Add budget category error:', err);
    res.status(500).json({ error: 'Failed to add budget category.' });
  }
};

// Update a category allocation in a budget
exports.updateBudgetCategory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { allocatedAmount } = req.body;
    // Check if allocation belongs to user's budget
    const check = await pool.query(
      `SELECT bc.id FROM budget_categories bc
       JOIN budgets b ON bc.budget_id = b.id
       WHERE bc.id = $1 AND b.user_id = $2`,
      [id, userId]
    );
    if (check.rows.length === 0) return res.status(404).json({ error: 'Budget category not found.' });
    const result = await pool.query(
      'UPDATE budget_categories SET allocated_amount = $1 WHERE id = $2 RETURNING *',
      [allocatedAmount, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Update budget category error:', err);
    res.status(500).json({ error: 'Failed to update budget category.' });
  }
};

// Delete a category allocation from a budget
exports.deleteBudgetCategory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    // Check if allocation belongs to user's budget
    const check = await pool.query(
      `SELECT bc.id FROM budget_categories bc
       JOIN budgets b ON bc.budget_id = b.id
       WHERE bc.id = $1 AND b.user_id = $2`,
      [id, userId]
    );
    if (check.rows.length === 0) return res.status(404).json({ error: 'Budget category not found.' });
    await pool.query('DELETE FROM budget_categories WHERE id = $1', [id]);
    res.json({ message: 'Budget category deleted.' });
  } catch (err) {
    logger.error('Delete budget category error:', err);
    res.status(500).json({ error: 'Failed to delete budget category.' });
  }
}; 