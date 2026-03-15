const pool = require('../db');
const logger = require('../logger');
const asyncHandler = require('../middleware/asyncHandler');
const { isValidAmount, isValidTransactionType: isValidType, isValidTransactionStatus: isValidStatus } = require('../utils/validators');

// Helper function to get or create cash account
const getOrCreateCashAccount = async (userId) => {
  const result = await pool.query('SELECT get_or_create_cash_account($1) as account_id', [userId]);
  return result.rows[0].account_id;
};

// Helper function to check if account is cash type
const isCashAccount = async (accountId) => {
  const result = await pool.query(`
    SELECT at.name as account_type_name 
    FROM accounts a 
    JOIN account_types at ON a.account_type_id = at.id 
    WHERE a.id = $1 AND at.name = 'Cash'
  `, [accountId]);
  return result.rows.length > 0;
};

// Helper function to validate cash source
const isValidCashSource = async (cashSourceId) => {
  if (!cashSourceId) return true; // cash_source_id is optional
  const result = await pool.query(
    'SELECT id FROM cash_sources WHERE id = $1 AND is_active = true',
    [cashSourceId]
  );
  return result.rows.length > 0;
};

// Helper function to get or create account linked to a credit card
const getOrCreateCardAccount = async (creditCardId, userId) => {
  try {
    const result = await pool.query('SELECT get_or_create_credit_card_account($1) as account_id', [creditCardId]);
    return result.rows[0]?.account_id || null;
  } catch (err) {
    logger.error('Error in getOrCreateCardAccount call:', err);
    return null;
  }
};

// Helper function to resolve account ID (strips prefixes like CC_)
const resolveAccountId = async (accountId, userId) => {
  if (!accountId) return null;
  if (typeof accountId !== 'string') return accountId;

  if (accountId.startsWith('CC_')) {
    const creditCardId = accountId.replace('CC_', '');
    return await getOrCreateCardAccount(creditCardId, userId);
  }

  return accountId;
};

exports.getTransactions = asyncHandler(async (req, res) => {
  logger.info('Get transactions request', { userId: req.user && req.user.userId });
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
        t.id, t.amount, t.type, t.status, t.description, t.location,
        t.transaction_date, t.posted_date, t.reference_number, t.notes,
        t.is_recurring, t.created_at, t.updated_at,
        t.account_id, t.transfer_account_id,
        t.contact_id, t.debt_type, t.due_date, t.debt_status, t.debt_group_id,
        a.account_name, a.account_number_masked,
        c.name as category_name, c.color as category_color, c.icon as category_icon,
        ta.account_name as transfer_account_name,
        co.name as contact_name,
        m.name as merchant,
        COALESCE(ARRAY_AGG(DISTINCT tt.tag) FILTER (WHERE tt.tag IS NOT NULL), '{}') as tags,
        COALESCE(ARRAY_AGG(DISTINCT tr.url) FILTER (WHERE tr.url IS NOT NULL), '{}') as receipt_urls
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts ta ON t.transfer_account_id = ta.id
      LEFT JOIN contacts co ON t.contact_id = co.id
      LEFT JOIN merchants m ON t.merchant_id = m.id
      LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
      LEFT JOIN transaction_receipts tr ON t.id = tr.transaction_id
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
    const resolvedId = await resolveAccountId(accountId, userId);
    if (resolvedId) {
      query += ` AND (t.account_id = $${paramIndex} OR t.transfer_account_id = $${paramIndex})`;
      params.push(resolvedId);
      paramIndex++;
    }
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
  if (req.query.search) {
    query += ` AND (t.description ILIKE $${paramIndex} OR t.reference_number ILIKE $${paramIndex} OR t.notes ILIKE $${paramIndex})`;
    params.push(`%${req.query.search}%`);
    paramIndex++;
  }

  // Add GROUP BY before counting and ordering
  query += ' GROUP BY t.id, a.account_name, a.account_number_masked, c.name, c.color, c.icon, ta.account_name, co.name, m.name';

  // Get total count for pagination
  const countQuery = `SELECT COUNT(*) FROM (${query}) as count_q`;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  query += ' ORDER BY t.transaction_date DESC, t.created_at DESC';
  let offset = 0;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  offset = (pageNum - 1) * limitNum;
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limitNum, offset);

  const result = await pool.query(query, params);

  logger.info('Get transactions success', { userId: req.user.userId, count: result.rows.length });
  res.json({
    transactions: result.rows,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum)
  });
});

exports.createTransaction = asyncHandler(async (req, res) => {
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
    recurringRule,
    isCash,
    cashSourceId,
    contact_id,
    debt_type,
    due_date,
    debt_status,
    debt_group_id
  } = req.body;

  let finalType = type;
  let finalDebtStatus = debt_status || 'pending';
  let finalDebtGroupId = debt_group_id;

  // Auto-set transaction type from debt direction
  if (debt_type) {
    if (debt_type === 'lent') finalType = 'expense';
    else if (debt_type === 'borrowed') finalType = 'income';
    else if (debt_type === 'repayment') {
        if (!debt_group_id) return res.status(400).json({ error: 'debt_group_id is required for repayment' });
        
        // Fetch parent debt to determine direction
        const parentRes = await pool.query('SELECT type, amount FROM transactions WHERE id = $1 AND user_id = $2', [debt_group_id, userId]);
        if (parentRes.rows.length === 0) return res.status(404).json({ error: 'Parent debt transaction not found' });
        
        const parent = parentRes.rows[0];
        finalType = parent.type === 'expense' ? 'income' : 'expense'; // Repayment of Lent (Exp) is Income, Repayment of Borrowed (Inc) is Expense

        // Repayment validation: prevent overpayment
        const repaymentsRes = await pool.query('SELECT SUM(amount) as total_repaid FROM transactions WHERE debt_group_id = $1 AND status = "completed"', [debt_group_id]);
        const alreadyRepaid = parseFloat(repaymentsRes.rows[0].total_repaid || 0);
        const remaining = parseFloat(parent.amount) - alreadyRepaid;
        
        if (parseFloat(amount) > remaining + 0.01) { // 0.01 for rounding float issues
            return res.status(422).json({ error: `Repayment exceeds outstanding balance of ₹${remaining.toFixed(2)}` });
        }
        
        // Update parent status if fully repaid
        if (Math.abs(remaining - parseFloat(amount)) < 0.01) {
            await pool.query('UPDATE transactions SET debt_status = "settled" WHERE id = $1', [debt_group_id]);
        } else {
            await pool.query('UPDATE transactions SET debt_status = "partially_paid" WHERE id = $1', [debt_group_id]);
        }
    }
  }

  const numericAmount = parseFloat(amount);
  if (!isValidAmount(numericAmount) || !isValidType(type)) {
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

  // validate account or cash
  if (type !== 'transfer' && !accountId && !isCash) {
    return res.status(400).json({ error: 'Either an account or Cash must be selected.' });
  }

  let finalAccountId = null;
  if (isCash) {
    finalAccountId = await getOrCreateCashAccount(userId);
  } else {
    finalAccountId = await resolveAccountId(accountId, userId);
  }

  // Only resolve transferAccountId if type is 'transfer'
  let finalTransferAccountId = null;
  if (type === 'transfer') {
    finalTransferAccountId = await resolveAccountId(transferAccountId, userId);
    
    // Cross-check resolution: must be different
    if (finalTransferAccountId === finalAccountId) {
      return res.status(400).json({ error: 'Transfer source and destination accounts must be different after ID resolution.' });
    }
    
    if (!finalTransferAccountId) {
      return res.status(400).json({ error: 'Valid transfer account is required for transfer transactions.' });
    }
  }

  // Validate cash source only if provided
  if (cashSourceId && !(await isValidCashSource(cashSourceId))) {
    return res.status(400).json({ error: 'Invalid cash source.' });
  }

  // Resolve merchant name to ID (get or create)
  let merchantId = null;
  if (merchant) {
    const mResult = await pool.query(
      'INSERT INTO merchants (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
      [merchant]
    );
    merchantId = mResult.rows[0].id;
  }

  const result = await pool.query(`
      INSERT INTO transactions (
        user_id, account_id, category_id, transfer_account_id, amount, type, status,
        description, merchant_id, location, transaction_date, posted_date, reference_number,
        notes, is_recurring, recurring_rule, cash_source_id, source_description,
        contact_id, debt_type, due_date, debt_status, debt_group_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $20, $21, $22, $23, $24)
      RETURNING id, amount, type, status, description, location,
                transaction_date, posted_date, reference_number, notes,
                is_recurring, cash_source_id, source_description, created_at, updated_at
    `, [
    userId, finalAccountId, categoryId, finalTransferAccountId || null, numericAmount, finalType, status || 'completed',
    description, merchantId, location, transactionDate, postedDate, referenceNumber,
    notes, isRecurring || false, recurringRule || null,
    cashSourceId || null, req.body.sourceDescription || null,
    contact_id || null, debt_type || null, due_date || null, finalDebtStatus, finalDebtGroupId || null
  ]);

  const txId = result.rows[0].id;

  // Insert tags into transaction_tags
  if (tags && Array.isArray(tags) && tags.length > 0) {
    for (const tag of tags) {
      await pool.query(
        'INSERT INTO transaction_tags (transaction_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [txId, tag]
      );
    }
  }

  // Insert receipt URLs into transaction_receipts
  if (receiptUrls && Array.isArray(receiptUrls) && receiptUrls.length > 0) {
    for (const url of receiptUrls) {
      await pool.query(
        'INSERT INTO transaction_receipts (transaction_id, url) VALUES ($1, $2)',
        [txId, url]
      );
    }
  }

  res.status(201).json({ ...result.rows[0], merchant, tags: tags || [], receipt_urls: receiptUrls || [] });
});

exports.getTransactionById = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  const result = await pool.query(`
      SELECT 
        t.id, t.amount, t.type, t.status, t.description, t.location,
        t.transaction_date, t.posted_date, t.reference_number, t.notes,
        t.is_recurring, t.recurring_rule, t.created_at, t.updated_at, t.cash_source_id,
        t.contact_id, t.debt_type, t.due_date, t.debt_status, t.debt_group_id,
        a.id as account_id, a.account_name, a.account_number_masked,
        c.id as category_id, c.name as category_name, c.color as category_color, c.icon as category_icon,
        ta.id as transfer_account_id, ta.account_name as transfer_account_name,
        co.name as contact_name,
        m.name as merchant,
        COALESCE(ARRAY_AGG(DISTINCT tt.tag) FILTER (WHERE tt.tag IS NOT NULL), '{}') as tags,
        COALESCE(ARRAY_AGG(DISTINCT tr.url) FILTER (WHERE tr.url IS NOT NULL), '{}') as receipt_urls
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts ta ON t.transfer_account_id = ta.id
      LEFT JOIN contacts co ON t.contact_id = co.id
      LEFT JOIN merchants m ON t.merchant_id = m.id
      LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
      LEFT JOIN transaction_receipts tr ON t.id = tr.transaction_id
      WHERE t.id = $1 AND t.user_id = $2
      GROUP BY t.id, a.id, a.account_name, a.account_number_masked, c.id, c.name, c.color, c.icon, ta.id, ta.account_name, co.name, m.name
    `, [id, userId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }

  res.json(result.rows[0]);
});

exports.updateTransaction = asyncHandler(async (req, res) => {
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
    recurringRule,
    isCash,
    cashSourceId,
    contact_id,
    debt_type,
    due_date,
    debt_status,
    debt_group_id
  } = req.body;

  const numericAmount = parseFloat(amount);
  if (!isValidAmount(numericAmount) || !isValidType(type)) {
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

  if (type !== 'transfer' && !accountId && !isCash) {
    return res.status(400).json({ error: 'Either an account or Cash must be selected.' });
  }

  // Resolve merchant name to ID
  let merchantId = null;
  if (merchant) {
    const mResult = await pool.query(
      'INSERT INTO merchants (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
      [merchant]
    );
    merchantId = mResult.rows[0].id;
  }

  const finalAccountId = isCash ? await getOrCreateCashAccount(userId) : await resolveAccountId(accountId, userId);
  
  // Only resolve transferAccountId if type is 'transfer'
  let finalTransferAccountId = null;
  if (type === 'transfer') {
    finalTransferAccountId = await resolveAccountId(transferAccountId, userId);
    
    // Cross-check resolution
    if (finalTransferAccountId === finalAccountId) {
      return res.status(400).json({ error: 'Transfer source and destination accounts must be different after ID resolution.' });
    }

    if (!finalTransferAccountId) {
      return res.status(400).json({ error: 'Valid transfer account is required for transfer transactions.' });
    }
  }

  const result = await pool.query(`
      UPDATE transactions SET 
        account_id = $1, category_id = $2, transfer_account_id = $3, amount = $4, type = $5, status = $6,
        description = $7, merchant_id = $8, location = $9, transaction_date = $10, posted_date = $11,
        reference_number = $12, notes = $13, is_recurring = $14, recurring_rule = $15,
        cash_source_id = $18, source_description = $19,
        contact_id = $20, debt_type = $21, due_date = $22, debt_status = $23, debt_group_id = $24
      WHERE id = $16 AND user_id = $17
      RETURNING id, amount, type, status, description, location,
                transaction_date, posted_date, reference_number, notes,
                is_recurring, cash_source_id, source_description, created_at, updated_at
    `, [
    finalAccountId, categoryId, finalTransferAccountId || null, numericAmount, type, status || 'completed',
    description, merchantId, location, transactionDate, postedDate, referenceNumber,
    notes, isRecurring || false, recurringRule || null,
    id, userId, isCash ? cashSourceId : null, isCash && req.body.sourceDescription ? req.body.sourceDescription : null,
    contact_id || null, debt_type || null, due_date || null, debt_status || 'pending', debt_group_id || null
  ]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }

  // Update tags: delete existing, re-insert new ones
  await pool.query('DELETE FROM transaction_tags WHERE transaction_id = $1', [id]);
  if (tags && Array.isArray(tags) && tags.length > 0) {
    for (const tag of tags) {
      await pool.query(
        'INSERT INTO transaction_tags (transaction_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [id, tag]
      );
    }
  }

  // Update receipts: delete existing, re-insert new ones
  await pool.query('DELETE FROM transaction_receipts WHERE transaction_id = $1', [id]);
  if (receiptUrls && Array.isArray(receiptUrls) && receiptUrls.length > 0) {
    for (const url of receiptUrls) {
      await pool.query('INSERT INTO transaction_receipts (transaction_id, url) VALUES ($1, $2)', [id, url]);
    }
  }

  res.json({ ...result.rows[0], merchant, tags: tags || [], receipt_urls: receiptUrls || [] });
});

exports.deleteTransaction = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check if linked to a credit card transaction
    const ccTxResult = await client.query(
      `SELECT cct.id, cct.credit_card_id, cct.amount, cct.is_payment, cct.main_transaction_id
       FROM credit_card_transactions cct
       JOIN transactions t ON cct.main_transaction_id = t.id
       WHERE t.id = $1 AND t.user_id = $2`,
      [id, userId]
    );

    if (ccTxResult.rows.length > 0) {
      const ccTx = ccTxResult.rows[0];
      // Revert balance
      if (ccTx.is_payment) {
        await client.query(`
          UPDATE credit_cards 
          SET current_balance = current_balance + $1, 
              available_credit = available_credit - $1
          WHERE id = $2
        `, [ccTx.amount, ccTx.credit_card_id]);
      } else {
        await client.query(`
          UPDATE credit_cards 
          SET current_balance = current_balance - $1, 
              available_credit = available_credit + $1
          WHERE id = $2
        `, [ccTx.amount, ccTx.credit_card_id]);
      }
      // Delete from credit_card_transactions (trigger deletes main_transaction if exists)
      await client.query('DELETE FROM credit_card_transactions WHERE id = $1', [ccTx.id]);
    }

    // 2. Delete main transaction if not already deleted by trigger
    const result = await client.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    await client.query('COMMIT');

    if (result.rows.length === 0 && ccTxResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    res.json({ message: 'Transaction deleted successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error deleting transaction:', err);
    res.status(500).json({ error: 'Failed to delete transaction.', details: err.message });
  } finally {
    client.release();
  }
});

// Bulk operations
exports.deleteBulkTransactions = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { transactionIds } = req.body;

  if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
    return res.status(400).json({ error: 'transactionIds array is required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch any linked credit card transactions
    const ccTxResult = await client.query(
      `SELECT cct.id, cct.credit_card_id, cct.amount, cct.is_payment, cct.main_transaction_id
       FROM credit_card_transactions cct
       JOIN transactions t ON cct.main_transaction_id = t.id
       WHERE t.id = ANY($1) AND t.user_id = $2`,
      [transactionIds, userId]
    );

    // 2. Revert credit card balances
    for (const ccTx of ccTxResult.rows) {
      if (ccTx.is_payment) {
        await client.query(`
          UPDATE credit_cards 
          SET current_balance = current_balance + $1, 
              available_credit = available_credit - $1
          WHERE id = $2
        `, [ccTx.amount, ccTx.credit_card_id]);
      } else {
        await client.query(`
          UPDATE credit_cards 
          SET current_balance = current_balance - $1, 
              available_credit = available_credit + $1
          WHERE id = $2
        `, [ccTx.amount, ccTx.credit_card_id]);
      }
    }

    // 3. Delete from credit_card_transactions (trigger cascades delete to main transactions automatically)
    if (ccTxResult.rows.length > 0) {
      const ccTxIds = ccTxResult.rows.map(r => r.id);
      await client.query('DELETE FROM credit_card_transactions WHERE id = ANY($1)', [ccTxIds]);
    }

    // 4. Delete the remaining main transactions directly
    const result = await client.query(
      'DELETE FROM transactions WHERE id = ANY($1) AND user_id = $2 RETURNING id',
      [transactionIds, userId]
    );

    await client.query('COMMIT');

    // Compile list of deleted IDs ensuring we include ones deleted by the trigger
    const deletedIds = new Set(result.rows.map(r => r.id));
    ccTxResult.rows.forEach(r => deletedIds.add(r.main_transaction_id));

    res.json({ message: `${deletedIds.size} transactions deleted successfully.`, deletedIds: Array.from(deletedIds) });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Bulk delete error:', err);
    res.status(500).json({ error: 'Failed to delete transactions.', details: err.message });
  } finally {
    client.release();
  }
});

exports.updateBulkCategory = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { transactionIds, categoryId } = req.body;

  if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
    return res.status(400).json({ error: 'transactionIds array is required.' });
  }

  // Not strictly validating category existence here unless absolutely necessary, assuming valid selection from frontend
  const result = await pool.query(
    'UPDATE transactions SET category_id = $1 WHERE id = ANY($2) AND user_id = $3 RETURNING id',
    [categoryId || null, transactionIds, userId] // Allow null category
  );

  res.json({ message: `${result.rowCount} transactions updated successfully.`, updatedIds: result.rows.map(r => r.id) });
});

exports.updateBulkStatus = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { transactionIds, status } = req.body;

  if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
    return res.status(400).json({ error: 'transactionIds array is required.' });
  }

  if (status && !isValidStatus(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const result = await pool.query(
    'UPDATE transactions SET status = $1 WHERE id = ANY($2) AND user_id = $3 RETURNING id',
    [status, transactionIds, userId]
  );

  res.json({ message: `${result.rowCount} transactions updated successfully.`, updatedIds: result.rows.map(r => r.id) });
});

// Get transaction statistics
exports.getTransactionStats = asyncHandler(async (req, res) => {
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
});
