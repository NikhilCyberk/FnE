const pool = require('../db');
const logger = require('../logger');

// Get all categories for a user
exports.getCategories = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const result = await pool.query('SELECT * FROM categories WHERE user_id = $1 OR is_system = TRUE ORDER BY id LIMIT $2 OFFSET $3', [userId, limit, offset]);
    res.json({
      categories: result.rows,
      page,
      limit
    });
  } catch (err) {
    logger.error('Get categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
};

// Get a single category by id
exports.getCategoryById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM categories WHERE id = $1 AND (user_id = $2 OR is_system = TRUE)', [id, userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Get category by id error:', err);
    res.status(500).json({ error: 'Failed to fetch category.' });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, type, parentId, color, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO categories (user_id, name, type, parent_id, color, icon, is_system) VALUES ($1, $2, $3, $4, $5, $6, FALSE) RETURNING *',
      [userId, name, type, parentId, color, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('Create category error:', err);
    res.status(500).json({ error: 'Failed to create category.' });
  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { name, type, parentId, color, icon } = req.body;
    const result = await pool.query(
      'UPDATE categories SET name = $1, type = $2, parent_id = $3, color = $4, icon = $5 WHERE id = $6 AND user_id = $7 RETURNING *',
      [name, type, parentId, color, icon, id, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found or not editable.' });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Update category error:', err);
    res.status(500).json({ error: 'Failed to update category.' });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await pool.query('DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found or not deletable.' });
    res.json({ message: 'Category deleted.' });
  } catch (err) {
    logger.error('Delete category error:', err);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
}; 