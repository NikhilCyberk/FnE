const pool = require('../db');
const logger = require('../logger');

// Enhanced validation helpers
function isValidCategoryName(name) {
  return typeof name === 'string' && name.length > 0 && name.length <= 100;
}

function isValidCategoryType(type) {
  return typeof type === 'string' && ['income', 'expense', 'transfer'].includes(type);
}

function isValidColor(color) {
  return !color || (typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color));
}

// Get all categories for a user with enhanced structure
exports.getCategories = async (req, res) => {
  logger.info('Get categories request', { userId: req.user && req.user.userId });
  try {
    const userId = req.user.userId;
    const { type, includeSystem = true, includeInactive = false } = req.query;
    
    let query = `
      SELECT 
        c.id, c.name, c.type, c.description, c.icon, c.color, c.keywords,
        c.is_system, c.is_active, c.sort_order, c.created_at, c.updated_at,
        cg.id as group_id, cg.name as group_name, cg.icon as group_icon, cg.color as group_color,
        p.id as parent_id, p.name as parent_name,
        (SELECT COUNT(*) FROM categories WHERE parent_id = c.id) as child_count
      FROM categories c
      LEFT JOIN category_groups cg ON c.group_id = cg.id
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE (c.user_id = $1 OR c.is_system = TRUE)
    `;
    
    const params = [userId];
    let paramIndex = 2;

    if (!includeSystem) {
      query += ` AND c.is_system = FALSE`;
    }

    if (!includeInactive) {
      query += ` AND c.is_active = TRUE`;
    }

    if (type && isValidCategoryType(type)) {
      query += ` AND c.type = $${paramIndex++}`;
      params.push(type);
    }

    query += ' ORDER BY cg.sort_order, cg.name, c.sort_order, c.name';

    const result = await pool.query(query, params);
    
    logger.info('Get categories success', { userId: req.user.userId, count: result.rows.length });
    res.json({
      categories: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    logger.error('Get categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
};

// Get a single category by id
exports.getCategoryById = async (req, res) => {
  logger.info('Get category by id request', { userId: req.user && req.user.userId });
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        c.id, c.name, c.type, c.description, c.icon, c.color, c.keywords,
        c.is_system, c.is_active, c.sort_order, c.created_at, c.updated_at,
        cg.id as group_id, cg.name as group_name, cg.icon as group_icon, cg.color as group_color,
        p.id as parent_id, p.name as parent_name,
        (SELECT COUNT(*) FROM categories WHERE parent_id = c.id) as child_count
      FROM categories c
      LEFT JOIN category_groups cg ON c.group_id = cg.id
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE c.id = $1 AND (c.user_id = $2 OR c.is_system = TRUE)
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    logger.info('Get category by id success', { userId: req.user.userId });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Get category by id error:', err);
    res.status(500).json({ error: 'Failed to fetch category.' });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  logger.info('Create category request', { userId: req.user && req.user.userId });
  try {
    const userId = req.user.userId;
    const { 
      name, 
      type, 
      description,
      groupId,
      parentId, 
      color, 
      icon,
      keywords,
      sortOrder
    } = req.body;

    if (!isValidCategoryName(name) || !isValidCategoryType(type)) {
      return res.status(400).json({ error: 'Valid name and type are required.' });
    }

    if (!isValidColor(color)) {
      return res.status(400).json({ error: 'Invalid color format. Use hex color (e.g., #FF0000).' });
    }

    // Check if category name already exists for this user and type
    const existingCheck = await pool.query(
      'SELECT id FROM categories WHERE user_id = $1 AND name = $2 AND type = $3',
      [userId, name, type]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Category with this name already exists for this type.' });
    }

    const result = await pool.query(`
      INSERT INTO categories (
        user_id, name, type, description, group_id, parent_id, color, icon, 
        keywords, sort_order, is_system, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE, TRUE) 
      RETURNING id, name, type, description, icon, color, keywords,
                is_system, is_active, sort_order, created_at, updated_at
    `, [
      userId, name, type, description || null, groupId || null, parentId || null, 
      color || null, icon || null, keywords || [], sortOrder || 0
    ]);

    logger.info('Create category success', { userId: req.user.userId, categoryId: result.rows[0].id });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('Create category error:', err);
    res.status(500).json({ error: 'Failed to create category.' });
  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  logger.info('Update category request', { userId: req.user && req.user.userId });
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { 
      name, 
      type, 
      description,
      groupId,
      parentId, 
      color, 
      icon,
      keywords,
      sortOrder,
      isActive
    } = req.body;

    if (!isValidCategoryName(name) || !isValidCategoryType(type)) {
      return res.status(400).json({ error: 'Valid name and type are required.' });
    }

    if (!isValidColor(color)) {
      return res.status(400).json({ error: 'Invalid color format. Use hex color (e.g., #FF0000).' });
    }

    // Check if category name already exists for this user and type (excluding current category)
    const existingCheck = await pool.query(
      'SELECT id FROM categories WHERE user_id = $1 AND name = $2 AND type = $3 AND id != $4',
      [userId, name, type, id]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Category with this name already exists for this type.' });
    }

    const result = await pool.query(`
      UPDATE categories SET 
        name = $1, type = $2, description = $3, group_id = $4, parent_id = $5, 
        color = $6, icon = $7, keywords = $8, sort_order = $9, is_active = $10
      WHERE id = $11 AND user_id = $12 AND is_system = FALSE
      RETURNING id, name, type, description, icon, color, keywords,
                is_system, is_active, sort_order, created_at, updated_at
    `, [
      name, type, description || null, groupId || null, parentId || null, 
      color || null, icon || null, keywords || [], sortOrder || 0, isActive !== undefined ? isActive : true,
      id, userId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found or not editable.' });
    }

    logger.info('Update category success', { userId: req.user.userId });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Update category error:', err);
    res.status(500).json({ error: 'Failed to update category.' });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  logger.info('Delete category request', { userId: req.user && req.user.userId });
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Check if category has transactions
    const transactionCheck = await pool.query(
      'SELECT COUNT(*) FROM transactions WHERE category_id = $1',
      [id]
    );

    if (parseInt(transactionCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with existing transactions. Please reassign or delete transactions first.' 
      });
    }

    // Check if category has child categories
    const childCheck = await pool.query(
      'SELECT COUNT(*) FROM categories WHERE parent_id = $1',
      [id]
    );

    if (parseInt(childCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with child categories. Please delete or reassign child categories first.' 
      });
    }

    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 AND is_system = FALSE RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found or not deletable.' });
    }

    logger.info('Delete category success', { userId: req.user.userId });
    res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    logger.error('Delete category error:', err);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
};

// Get category groups
exports.getCategoryGroups = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, icon, color, sort_order, is_system
      FROM category_groups 
      ORDER BY sort_order, name
    `);
    res.json(result.rows);
  } catch (err) {
    logger.error('Get category groups error:', err);
    res.status(500).json({ error: 'Failed to fetch category groups.' });
  }
};

// Get categories by type with usage statistics
exports.getCategoriesByType = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type } = req.params;

    if (!isValidCategoryType(type)) {
      return res.status(400).json({ error: 'Invalid category type.' });
    }

    const result = await pool.query(`
      SELECT 
        c.id, c.name, c.description, c.icon, c.color, c.is_system,
        COUNT(t.id) as transaction_count,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_spent,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_earned
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id AND t.user_id = $1
      WHERE (c.user_id = $1 OR c.is_system = TRUE) AND c.type = $2 AND c.is_active = TRUE
      GROUP BY c.id, c.name, c.description, c.icon, c.color, c.is_system
      ORDER BY c.name
    `, [userId, type]);

    res.json(result.rows);
  } catch (err) {
    logger.error('Get categories by type error:', err);
    res.status(500).json({ error: 'Failed to fetch categories by type.' });
  }
}; 