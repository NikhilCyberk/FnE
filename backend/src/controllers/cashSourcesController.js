const pool = require('../db');
const logger = require('../logger');
const asyncHandler = require('../middleware/asyncHandler');

exports.getCashSources = asyncHandler(async (req, res) => {
  logger.info('Get cash sources request');
  
  const result = await pool.query(
    'SELECT id, name, description, is_active FROM cash_sources WHERE is_active = true ORDER BY name'
  );

  logger.info('Get cash sources success', { count: result.rows.length });
  res.json(result.rows);
});

exports.createCashSource = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Cash source name is required.' });
  }

  const result = await pool.query(
    'INSERT INTO cash_sources (name, description) VALUES ($1, $2) RETURNING id, name, description, is_active',
    [name.trim(), description || null]
  );

  res.status(201).json(result.rows[0]);
});

exports.updateCashSource = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, isActive } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Cash source name is required.' });
  }

  const result = await pool.query(
    'UPDATE cash_sources SET name = $1, description = $2, is_active = $3 WHERE id = $4 RETURNING id, name, description, is_active',
    [name.trim(), description || null, isActive !== undefined ? isActive : true, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Cash source not found.' });
  }

  res.json(result.rows[0]);
});

exports.deleteCashSource = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if cash source is being used by any transactions
  const transactionCheck = await pool.query(
    'SELECT COUNT(*) FROM transactions WHERE cash_source = (SELECT name FROM cash_sources WHERE id = $1)',
    [id]
  );

  if (parseInt(transactionCheck.rows[0].count) > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete cash source that is being used by transactions. Consider deactivating it instead.' 
    });
  }

  const result = await pool.query(
    'DELETE FROM cash_sources WHERE id = $1 RETURNING id',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Cash source not found.' });
  }

  res.json({ message: 'Cash source deleted successfully.' });
});
