const pool = require('../db');
const logger = require('../logger');
const asyncHandler = require('../middleware/asyncHandler');
const { isValidAccountName, isValidAccountType, isValidBalance, isValidCurrency } = require('../utils/validators');

exports.getAccounts = asyncHandler(async (req, res) => {
  logger.info('Get accounts request', { userId: req.user && req.user.userId });
  const userId = req.user.userId;
  
  // Pagination
  const { page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  
  const result = await pool.query(`
    SELECT 
      a.id, a.account_name, a.account_number_masked, a.balance, a.available_balance,
      a.currency, a.credit_limit, a.minimum_balance, a.account_status, a.is_primary,
      a.notes, a.created_at, a.updated_at,
      at.name as account_type_name, at.category as account_type_category,
      fi.name as institution_name, fi.logo_url as institution_logo
    FROM accounts a
    LEFT JOIN account_types at ON a.account_type_id = at.id
    LEFT JOIN financial_institutions fi ON a.institution_id = fi.id
    WHERE a.user_id = $1 
    ORDER BY a.is_primary DESC, a.created_at DESC 
    LIMIT $2 OFFSET $3
  `, [userId, limitNum, offset]);

  // Get total count for pagination
  const countResult = await pool.query(
    'SELECT COUNT(*) FROM accounts WHERE user_id = $1',
    [userId]
  );

  logger.info('Get accounts success', { userId: req.user.userId, count: result.rows.length });
  res.json({ 
    accounts: result.rows, 
    page: pageNum, 
    limit: limitNum, 
    total: parseInt(countResult.rows[0].count),
    totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limitNum)
  });
});

exports.createAccount = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
    const { 
      accountName, 
      accountTypeId, 
      institutionId, 
      accountNumber, 
      balance, 
      availableBalance,
      currency, 
      creditLimit, 
      minimumBalance,
      notes 
    } = req.body;

    if (!isValidAccountName(accountName) || !isValidAccountType(accountTypeId)) {
      return res.status(400).json({ error: 'Valid account name and type are required.' });
    }

    if (balance !== undefined && !isValidBalance(balance)) {
      return res.status(400).json({ error: 'Invalid balance amount.' });
    }

    if (currency && !isValidCurrency(currency)) {
      return res.status(400).json({ error: 'Invalid currency code. Use 3-letter ISO code (e.g., INR, USD).' });
    }

    // Mask account number for display
    const accountNumberMasked = accountNumber ? 
      `****${accountNumber.slice(-4)}` : null;

    const result = await pool.query(`
      INSERT INTO accounts (
        user_id, account_type_id, institution_id, account_name, 
        account_number_encrypted, account_number_masked, balance, available_balance,
        currency, credit_limit, minimum_balance, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING id, account_name, account_number_masked, balance, available_balance,
                currency, credit_limit, minimum_balance, account_status, is_primary,
                notes, created_at, updated_at
    `, [
      userId, 
      accountTypeId, 
      institutionId || null, 
      accountName, 
      accountNumber || null, // In production, this should be encrypted
      accountNumberMasked,
      balance || 0, 
      availableBalance || balance || 0,
      currency || 'INR', 
      creditLimit || null, 
      minimumBalance || null,
      notes || null
    ]);

  res.status(201).json(result.rows[0]);
});

exports.getAccountById = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        a.id, a.account_name, a.account_number_masked, a.balance, a.available_balance,
        a.currency, a.credit_limit, a.minimum_balance, a.account_status, a.is_primary,
        a.notes, a.created_at, a.updated_at,
        at.id as account_type_id, at.name as account_type_name, at.category as account_type_category,
        fi.id as institution_id, fi.name as institution_name, fi.logo_url as institution_logo
      FROM accounts a
      LEFT JOIN account_types at ON a.account_type_id = at.id
      LEFT JOIN financial_institutions fi ON a.institution_id = fi.id
      WHERE a.id = $1 AND a.user_id = $2
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found.' });
    }

  res.json(result.rows[0]);
});

exports.updateAccount = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
    const { id } = req.params;
    const { 
      accountName, 
      accountTypeId, 
      institutionId, 
      accountNumber, 
      balance, 
      availableBalance,
      currency, 
      creditLimit, 
      minimumBalance,
      notes 
    } = req.body;

    if (!isValidAccountName(accountName) || !isValidAccountType(accountTypeId)) {
      return res.status(400).json({ error: 'Valid account name and type are required.' });
    }

    if (balance !== undefined && !isValidBalance(balance)) {
      return res.status(400).json({ error: 'Invalid balance amount.' });
    }

    if (currency && !isValidCurrency(currency)) {
      return res.status(400).json({ error: 'Invalid currency code. Use 3-letter ISO code (e.g., INR, USD).' });
    }

    // Mask account number for display
    const accountNumberMasked = accountNumber ? 
      `****${accountNumber.slice(-4)}` : null;

    const result = await pool.query(`
      UPDATE accounts SET 
        account_type_id = $1, institution_id = $2, account_name = $3, 
        account_number_encrypted = $4, account_number_masked = $5, balance = $6, 
        available_balance = $7, currency = $8, credit_limit = $9, 
        minimum_balance = $10, notes = $11
      WHERE id = $12 AND user_id = $13 
      RETURNING id, account_name, account_number_masked, balance, available_balance,
                currency, credit_limit, minimum_balance, account_status, is_primary,
                notes, created_at, updated_at
    `, [
      accountTypeId, 
      institutionId || null, 
      accountName, 
      accountNumber || null, // In production, this should be encrypted
      accountNumberMasked,
      balance || 0, 
      availableBalance || balance || 0,
      currency || 'INR', 
      creditLimit || null, 
      minimumBalance || null,
      notes || null,
      id, 
      userId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found.' });
    }

  res.json(result.rows[0]);
});

exports.deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
    const { id } = req.params;

    // Check if account has transactions
    const transactionCheck = await pool.query(
      'SELECT COUNT(*) FROM transactions WHERE account_id = $1 OR transfer_account_id = $1',
      [id]
    );

    if (parseInt(transactionCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete account with existing transactions. Please delete all transactions first.' 
      });
    }

    const result = await pool.query(
      'DELETE FROM accounts WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found.' });
    }

  res.json({ message: 'Account deleted successfully.' });
});

// Get account types for dropdown
exports.getAccountTypes = asyncHandler(async (req, res) => {
  const result = await pool.query(
      'SELECT id, name, category, description FROM account_types WHERE is_active = true ORDER BY name'
    );
  res.json(result.rows);
});

// Get financial institutions for dropdown
exports.getFinancialInstitutions = asyncHandler(async (req, res) => {
  const result = await pool.query(
      'SELECT id, name, code, country, logo_url FROM financial_institutions WHERE is_active = true ORDER BY name'
    );
  res.json(result.rows);
});

// Get account summary/overview
exports.getAccountSummary = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_accounts,
        SUM(CASE WHEN at.category = 'asset' THEN a.balance ELSE 0 END) as total_assets,
        SUM(CASE WHEN at.category = 'liability' THEN ABS(a.balance) ELSE 0 END) as total_liabilities,
        SUM(CASE WHEN at.category = 'asset' THEN a.balance ELSE -a.balance END) as net_worth
      FROM accounts a
      LEFT JOIN account_types at ON a.account_type_id = at.id
      WHERE a.user_id = $1 AND a.account_status = 'active'
    `, [userId]);

  res.json(result.rows[0]);
});
