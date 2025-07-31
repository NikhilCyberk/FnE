const pool = require('../db');
const logger = require('../logger');

// Enhanced validation helpers
function isValidAmount(amount) { 
  return typeof amount === 'number' && !isNaN(amount) && isFinite(amount) && amount !== 0; 
}

function isValidType(type) { 
  return typeof type === 'string' && ['income','expense','transfer'].includes(type); 
}

function isValidStatus(status) {
  return typeof status === 'string' && ['pending', 'completed', 'cancelled', 'failed'].includes(status);
}

exports.getTransactions = async (req, res) => {
  logger.info('Get transactions request', { userId: req.user && req.user.userId });
  try {
    const userId = req.user.userId;
    const { 
      page = 1, 
      limit = 50, 
      startDate, 
      endDate, 
      categoryId, 
      accountId, 
      type, 
      status,
      minAmount,
      maxAmount
    } = req.query;

    let query = `
      SELECT 
        t.id, t.amount, t.type, t.status, t.description, t.merchant, t.location,
        t.transaction_date, t.posted_date, t.reference_number, t.tags, t.notes,
        t.is_recurring, t.created_at, t.updated_at,
        a.account_name, a.account_number_masked,
        c.name as category_name, c.color as category_color, c.icon as category_icon,
        ta.account_name as transfer_account_name
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts ta ON t.transfer_account_id = ta.id
      WHERE t.user_id = $1
    `;
    
    const params = [userId];
    let paramIndex = 2;

    if (startDate) { 
      query += ` AND t.transaction_date >= $${paramIndex++}`; 
      params.push(startDate); 
    }
    if (endDate) { 
      query += ` AND t.transaction_date <= $${paramIndex++}`; 
      params.push(endDate); 
    }
    if (categoryId) { 
      query += ` AND t.category_id = $${paramIndex++}`; 
      params.push(categoryId); 
    }
    if (accountId) { 
      query += ` AND t.account_id = $${paramIndex++}`; 
      params.push(accountId); 
    }
    if (type && isValidType(type)) { 
      query += ` AND t.type = $${paramIndex++}`; 
      params.push(type); 
    }
    if (status && isValidStatus(status)) { 
      query += ` AND t.status = $${paramIndex++}`; 
      params.push(status); 
    }
    if (minAmount) { 
      query += ` AND t.amount >= $${paramIndex++}`; 
      params.push(parseFloat(minAmount)); 
    }
    if (maxAmount) { 
      query += ` AND t.amount <= $${paramIndex++}`; 
      params.push(parseFloat(maxAmount)); 
    }

    // Get total count for pagination
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY.*/, '');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    query += ' ORDER BY t.transaction_date DESC, t.created_at DESC LIMIT $' + paramIndex++ + ' OFFSET $' + paramIndex;
    params.push(Number(limit), (Number(page) - 1) * Number(limit));
    
    const result = await pool.query(query, params);
    
    logger.info('Get transactions success', { userId: req.user.userId, count: result.rows.length });
    res.json({
      transactions: result.rows,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    logger.error('Get transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      accountId, 
      categoryId, 
      transferAccountId,
      amount, 
      type, 
      status,
      description, 
      merchant, 
      location,
      transactionDate, 
      postedDate,
      referenceNumber,
      tags, 
      notes,
      receiptUrls,
      isRecurring, 
      recurringRule 
    } = req.body;

    if (!isValidAmount(amount) || !isValidType(type)) {
      return res.status(400).json({ error: 'Valid amount and type are required.' });
    }

    if (status && !isValidStatus(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    // Validate transfer account for transfer transactions
    if (type === 'transfer' && !transferAccountId) {
      return res.status(400).json({ error: 'Transfer account is required for transfer transactions.' });
    }

    if (type === 'transfer' && transferAccountId === accountId) {
      return res.status(400).json({ error: 'Transfer account must be different from source account.' });
    }

    const result = await pool.query(`
      INSERT INTO transactions (
        user_id, account_id, category_id, transfer_account_id, amount, type, status,
        description, merchant, location, transaction_date, posted_date, reference_number,
        tags, notes, receipt_urls, is_recurring, recurring_rule
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) 
      RETURNING id, amount, type, status, description, merchant, location,
                transaction_date, posted_date, reference_number, tags, notes,
                is_recurring, created_at, updated_at
    `, [
      userId, accountId, categoryId, transferAccountId || null, amount, type, status || 'completed',
      description, merchant, location, transactionDate, postedDate, referenceNumber,
      tags || [], notes, receiptUrls || [], isRecurring || false, recurringRule || null
    ]);

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
    
    const result = await pool.query(`
      SELECT 
        t.id, t.amount, t.type, t.status, t.description, t.merchant, t.location,
        t.transaction_date, t.posted_date, t.reference_number, t.tags, t.notes,
        t.is_recurring, t.recurring_rule, t.created_at, t.updated_at,
        a.id as account_id, a.account_name, a.account_number_masked,
        c.id as category_id, c.name as category_name, c.color as category_color, c.icon as category_icon,
        ta.id as transfer_account_id, ta.account_name as transfer_account_name
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts ta ON t.transfer_account_id = ta.id
      WHERE t.id = $1 AND t.user_id = $2
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

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
    const { 
      accountId, 
      categoryId, 
      transferAccountId,
      amount, 
      type, 
      status,
      description, 
      merchant, 
      location,
      transactionDate, 
      postedDate,
      referenceNumber,
      tags, 
      notes,
      receiptUrls,
      isRecurring, 
      recurringRule 
    } = req.body;

    if (!isValidAmount(amount) || !isValidType(type)) {
      return res.status(400).json({ error: 'Valid amount and type are required.' });
    }

    if (status && !isValidStatus(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    // Validate transfer account for transfer transactions
    if (type === 'transfer' && !transferAccountId) {
      return res.status(400).json({ error: 'Transfer account is required for transfer transactions.' });
    }

    if (type === 'transfer' && transferAccountId === accountId) {
      return res.status(400).json({ error: 'Transfer account must be different from source account.' });
    }

    const result = await pool.query(`
      UPDATE transactions SET 
        account_id = $1, category_id = $2, transfer_account_id = $3, amount = $4, type = $5, status = $6,
        description = $7, merchant = $8, location = $9, transaction_date = $10, posted_date = $11,
        reference_number = $12, tags = $13, notes = $14, receipt_urls = $15, is_recurring = $16, recurring_rule = $17
      WHERE id = $18 AND user_id = $19 
      RETURNING id, amount, type, status, description, merchant, location,
                transaction_date, posted_date, reference_number, tags, notes,
                is_recurring, created_at, updated_at
    `, [
      accountId, categoryId, transferAccountId || null, amount, type, status || 'completed',
      description, merchant, location, transactionDate, postedDate, referenceNumber,
      tags || [], notes, receiptUrls || [], isRecurring || false, recurringRule || null,
      id, userId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

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
    
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    res.json({ message: 'Transaction deleted successfully.' });
  } catch (err) {
    logger.error('Delete transaction error:', err);
    res.status(500).json({ error: 'Failed to delete transaction.' });
  }
};

// Get transaction statistics
exports.getTransactionStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate, accountId } = req.query;

    let whereClause = 'WHERE t.user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (startDate) {
      whereClause += ` AND t.transaction_date >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ` AND t.transaction_date <= $${paramIndex++}`;
      params.push(endDate);
    }
    if (accountId) {
      whereClause += ` AND t.account_id = $${paramIndex++}`;
      params.push(accountId);
    }

    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
        SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expenses,
        SUM(CASE WHEN t.type = 'transfer' THEN t.amount ELSE 0 END) as total_transfers,
        AVG(t.amount) as average_amount,
        MIN(t.amount) as min_amount,
        MAX(t.amount) as max_amount
      FROM transactions t
      ${whereClause}
    `, params);

    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Get transaction stats error:', err);
    res.status(500).json({ error: 'Failed to fetch transaction statistics.' });
  }
}; 