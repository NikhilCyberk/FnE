const pool = require('../db');
const logger = require('../logger');

// Get user profile
exports.getProfile = async (req, res) => {
  logger.info('Get profile request', { userId: req.user && req.user.id });
  try {
    const userId = req.user.userId;
    const result = await pool.query('SELECT id, email, first_name, last_name, phone, timezone, currency, created_at, updated_at, is_active FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    logger.info('Get profile success', { userId: req.user && req.user.id });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, phone, timezone, currency } = req.body;
    const result = await pool.query(
      'UPDATE users SET first_name = $1, last_name = $2, phone = $3, timezone = $4, currency = $5, updated_at = NOW() WHERE id = $6 RETURNING id, email, first_name, last_name, phone, timezone, currency, created_at, updated_at, is_active',
      [firstName, lastName, phone, timezone, currency, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

// Deactivate (soft delete) user account
exports.deactivateAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    await pool.query('UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [userId]);
    res.json({ message: 'Account deactivated.' });
  } catch (err) {
    logger.error('Deactivate account error:', err);
    res.status(500).json({ error: 'Failed to deactivate account.' });
  }
}; 