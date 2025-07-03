const pool = require('../db');
const logger = require('../logger');

// Helper validation
function isValidAccountName(name) { return typeof name === 'string' && name.length > 0 && name.length <= 100; }
function isValidAccountType(type) { return typeof type === 'string' && ['savings','checking','credit','cash','investment'].includes(type); }

exports.getAccounts = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const result = await pool.query('SELECT * FROM accounts WHERE user_id = $1 ORDER BY id LIMIT $2 OFFSET $3', [userId, limit, offset]);
    res.json({ accounts: result.rows, page, limit });
  } catch (err) {
    logger.error('Get accounts error:', err);
    res.status(500).json({ error: 'Failed to fetch accounts.' });
  }
};

exports.createAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { accountName, accountType, accountNumber, bankName, balance, currency } = req.body;
    if (!isValidAccountName(accountName) || !isValidAccountType(accountType)) {
      return res.status(400).json({ error: 'Invalid account name or type.' });
    }
    const result = await pool.query(
      'INSERT INTO accounts (user_id, account_name, account_type, account_number, bank_name, balance, currency) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, accountName, accountType, accountNumber, bankName, balance || 0, currency || 'INR']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('Create account error:', err);
    res.status(500).json({ error: 'Failed to create account.' });
  }
};

exports.getAccountById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM accounts WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Account not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Get account by id error:', err);
    res.status(500).json({ error: 'Failed to fetch account.' });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { accountName, accountType, accountNumber, bankName, balance, currency } = req.body;
    if (!isValidAccountName(accountName) || !isValidAccountType(accountType)) {
      return res.status(400).json({ error: 'Invalid account name or type.' });
    }
    const result = await pool.query(
      'UPDATE accounts SET account_name = $1, account_type = $2, account_number = $3, bank_name = $4, balance = $5, currency = $6 WHERE id = $7 AND user_id = $8 RETURNING *',
      [accountName, accountType, accountNumber, bankName, balance, currency, id, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Account not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Update account error:', err);
    res.status(500).json({ error: 'Failed to update account.' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await pool.query('DELETE FROM accounts WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Account not found.' });
    res.json({ message: 'Account deleted.' });
  } catch (err) {
    logger.error('Delete account error:', err);
    res.status(500).json({ error: 'Failed to delete account.' });
  }
}; 