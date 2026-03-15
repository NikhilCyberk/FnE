const pool = require('../db');
const logger = require('../logger');
const asyncHandler = require('../middleware/asyncHandler');

// Create a new credit card transaction
exports.createCreditCardTransaction = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { creditCardId } = req.params;
  const {
    transactionDate,
    postedDate,
    description,
    merchant,
    category_id,
    amount,
    transactionType,
    referenceNumber,
    rewardsEarned,
    foreignTransaction,
    statementDate,
    isPayment,
    paymentMethod,
    tags,
    notes
  } = req.body;

  // Validate required fields
  if (!creditCardId || !transactionDate || !description || !amount) {
    return res.status(400).json({ 
      error: 'Credit card ID, transaction date, description, and amount are required.' 
    });
  }

  // Validate amount
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number.' });
  }

  // Verify credit card belongs to user
  const cardCheck = await pool.query(
    'SELECT id FROM credit_cards WHERE id = $1 AND user_id = $2',
    [creditCardId, userId]
  );

  if (cardCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Credit card not found.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Resolve merchant name to ID
    let merchantId = null;
    if (merchant) {
      const mResult = await client.query(
        'INSERT INTO merchants (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
        [merchant]
      );
      merchantId = mResult.rows[0].id;
    }

    // Insert credit card transaction
    const result = await client.query(`
      INSERT INTO credit_card_transactions (
        credit_card_id, transaction_date, posted_date, description, merchant_id,
        category_id, amount, transaction_type, reference_number, rewards_earned,
        foreign_transaction, statement_date, is_payment, payment_method
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      creditCardId,
      transactionDate,
      postedDate || null,
      description,
      merchantId,
      category_id || null,
      numericAmount,
      transactionType || 'purchase',
      referenceNumber || null,
      rewardsEarned ? parseFloat(rewardsEarned) : null,
      foreignTransaction || false,
      statementDate || null,
      isPayment || false,
      paymentMethod || 'credit_card'
    ]);

    const newTransaction = result.rows[0];

    // Get the linked main transaction (created by trigger)
    const mainTxResult = await client.query(`
      SELECT t.*, a.account_name 
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.id = $1
    `, [newTransaction.main_transaction_id]);

    await client.query('COMMIT');

    logger.info('Credit card transaction created', { 
      creditCardId, 
      transactionId: newTransaction.id,
      amount: newTransaction.amount 
    });

    res.status(201).json({
      ...newTransaction,
      mainTransaction: mainTxResult.rows[0] || null
    });

  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error creating credit card transaction:', err);
    throw err;
  } finally {
    client.release();
  }
});

// Get all transactions for a credit card
exports.getCreditCardTransactions = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { creditCardId } = req.params;
  const {
    page = 1,
    limit = 50,
    startDate,
    endDate,
    transactionType,
    isPayment,
    category
  } = req.query;

  // Verify credit card belongs to user
  const cardCheck = await pool.query(
    'SELECT id FROM credit_cards WHERE id = $1 AND user_id = $2',
    [creditCardId, userId]
  );

  if (cardCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Credit card not found.' });
  }

  let query = `
    SELECT 
      cct.*,
      t.id as main_transaction_id,
      t.type as main_transaction_type,
      t.status as main_transaction_status,
      a.account_name,
      cc.card_name,
      m.name as merchant,
      cat.name as category_name
    FROM credit_card_transactions cct
    LEFT JOIN transactions t ON cct.main_transaction_id = t.id
    LEFT JOIN accounts a ON t.account_id = a.id
    LEFT JOIN credit_cards cc ON cct.credit_card_id = cc.id
    LEFT JOIN merchants m ON cct.merchant_id = m.id
    LEFT JOIN categories cat ON cct.category_id = cat.id
    WHERE cct.credit_card_id = $1
  `;

  const params = [creditCardId];
  let paramIndex = 2;

  if (startDate) {
    query += ` AND cct.transaction_date >= $${paramIndex++}`;
    params.push(startDate);
  }

  if (endDate) {
    query += ` AND cct.transaction_date <= $${paramIndex++}`;
    params.push(endDate);
  }

  if (transactionType) {
    query += ` AND cct.transaction_type = $${paramIndex++}`;
    params.push(transactionType);
  }

  if (isPayment !== undefined) {
    query += ` AND cct.is_payment = $${paramIndex++}`;
    params.push(isPayment === 'true');
  }

  // Get total count for pagination
  const countQuery = query.replace(/SELECT.*?FROM/s, 'SELECT COUNT(*) FROM').replace(/ORDER BY.*$/, '');
  const countResult = await pool.query(countQuery, params);
  const total = countResult.rows[0] ? parseInt(countResult.rows[0].count) : 0;

  query += ' ORDER BY cct.transaction_date DESC, cct.created_at DESC';

  let offset = 0;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  offset = (pageNum - 1) * limitNum;
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limitNum, offset);

  const result = await pool.query(query, params);

  // Serialize dates and format response
  const transactions = result.rows.map(tx => ({
    id: tx.id,
    creditCardId: tx.credit_card_id,
    transactionDate: tx.transaction_date,
    postedDate: tx.posted_date,
    description: tx.description,
    merchant: tx.merchant,
    category: tx.category_name,
    categoryId: tx.category_id,
    amount: parseFloat(tx.amount),
    transactionType: tx.transaction_type,
    referenceNumber: tx.reference_number,
    rewardsEarned: tx.rewards_earned ? parseFloat(tx.rewards_earned) : null,
    foreignTransaction: tx.foreign_transaction,
    statementDate: tx.statement_date,
    isPayment: tx.is_payment,
    paymentMethod: tx.payment_method,
    mainTransactionId: tx.main_transaction_id,
    mainTransactionType: tx.main_transaction_type,
    accountName: tx.account_name,
    cardName: tx.card_name,
    createdAt: tx.created_at,
    updatedAt: tx.updated_at
  }));

  res.json({
    transactions,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum)
  });
});

// Update a credit card transaction
exports.updateCreditCardTransaction = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { creditCardId, transactionId } = req.params;
  const {
    transactionDate,
    postedDate,
    description,
    merchant,
    category_id,
    amount,
    transactionType,
    referenceNumber,
    rewardsEarned,
    foreignTransaction,
    statementDate,
    isPayment,
    paymentMethod
  } = req.body;

  // Verify transaction belongs to user's credit card
  const checkResult = await pool.query(`
    SELECT cct.id 
    FROM credit_card_transactions cct
    JOIN credit_cards cc ON cct.credit_card_id = cc.id
    WHERE cct.id = $1 AND cct.credit_card_id = $2 AND cc.user_id = $3
  `, [transactionId, creditCardId, userId]);

  if (checkResult.rows.length === 0) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }

  // Validate amount if provided
  const numericAmount = amount !== undefined ? parseFloat(amount) : undefined;
  if (numericAmount !== undefined && (isNaN(numericAmount) || numericAmount <= 0)) {
    return res.status(400).json({ error: 'Amount must be a positive number.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get old transaction amount for balance adjustment
    const oldTxResult = await client.query(
      'SELECT amount, is_payment FROM credit_card_transactions WHERE id = $1',
      [transactionId]
    );
    const oldTransaction = oldTxResult.rows[0];

    // Resolve merchant name to ID
    let merchantId = undefined;
    if (merchant !== undefined) {
      if (merchant === null) {
        merchantId = null;
      } else {
        const mResult = await client.query(
          'INSERT INTO merchants (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
          [merchant]
        );
        merchantId = mResult.rows[0].id;
      }
    }

    // Update credit card transaction
    const result = await client.query(`
      UPDATE credit_card_transactions SET
        transaction_date = COALESCE($1, transaction_date),
        posted_date = $2,
        description = COALESCE($3, description),
        merchant_id = COALESCE($4, merchant_id),
        category_id = COALESCE($5, category_id),
        amount = COALESCE($6, amount),
        transaction_type = COALESCE($7, transaction_type),
        reference_number = $8,
        rewards_earned = $9,
        foreign_transaction = COALESCE($10, foreign_transaction),
        statement_date = $11,
        is_payment = COALESCE($12, is_payment),
        payment_method = COALESCE($13, payment_method),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *
    `, [
      transactionDate,
      postedDate,
      description,
      merchantId !== undefined ? merchantId : null,
      category_id,
      amount ? parseFloat(amount) : null,
      transactionType,
      referenceNumber,
      rewardsEarned ? parseFloat(rewardsEarned) : null,
      foreignTransaction,
      statementDate,
      isPayment,
      paymentMethod,
      transactionId
    ]);

    const updatedTransaction = result.rows[0];

    // Adjust credit card balance if amount changed
    const numericAmountDifference = numericAmount !== undefined ? numericAmount - parseFloat(oldTransaction.amount) : 0;
    
    if (numericAmountDifference !== 0) {
      if (oldTransaction.is_payment) {
        // Payment transaction
        await client.query(`
          UPDATE credit_cards 
          SET current_balance = current_balance - $1,
              available_credit = available_credit + $1
          WHERE id = $2
        `, [numericAmountDifference, creditCardId]);
      } else {
        // Purchase transaction
        await client.query(`
          UPDATE credit_cards 
          SET current_balance = current_balance + $1,
              available_credit = available_credit - $1
          WHERE id = $2
        `, [numericAmountDifference, creditCardId]);
      }
    }

    await client.query('COMMIT');

    logger.info('Credit card transaction updated', { 
      creditCardId, 
      transactionId,
      amount: updatedTransaction.amount 
    });

    res.json(updatedTransaction);

  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error updating credit card transaction:', err);
    throw err;
  } finally {
    client.release();
  }
});

// Delete a credit card transaction
exports.deleteCreditCardTransaction = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { creditCardId, transactionId } = req.params;

  // Verify transaction belongs to user's credit card
  const checkResult = await pool.query(`
    SELECT cct.*, cc.current_balance, cc.available_credit
    FROM credit_card_transactions cct
    JOIN credit_cards cc ON cct.credit_card_id = cc.id
    WHERE cct.id = $1 AND cct.credit_card_id = $2 AND cc.user_id = $3
  `, [transactionId, creditCardId, userId]);

  if (checkResult.rows.length === 0) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }

  const transaction = checkResult.rows[0];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete the credit card transaction
    await client.query('DELETE FROM credit_card_transactions WHERE id = $1', [transactionId]);

    // Adjust credit card balance
    if (transaction.is_payment) {
      // Removing a payment increases the balance
      await client.query(`
        UPDATE credit_cards 
        SET current_balance = current_balance + $1,
            available_credit = available_credit - $1
        WHERE id = $2
      `, [parseFloat(transaction.amount), creditCardId]);
    } else {
      // Removing a purchase decreases the balance
      await client.query(`
        UPDATE credit_cards 
        SET current_balance = current_balance - $1,
            available_credit = available_credit + $1
        WHERE id = $2
      `, [parseFloat(transaction.amount), creditCardId]);
    }

    await client.query('COMMIT');

    logger.info('Credit card transaction deleted', { 
      creditCardId, 
      transactionId,
      amount: transaction.amount 
    });

    res.json({ message: 'Transaction deleted successfully.' });

  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error deleting credit card transaction:', err);
    throw err;
  } finally {
    client.release();
  }
});

// Get credit card transaction summary
exports.getCreditCardTransactionSummary = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { creditCardId } = req.params;
  const { startDate, endDate } = req.query;

  // Verify credit card belongs to user
  const cardCheck = await pool.query(
    'SELECT id FROM credit_cards WHERE id = $1 AND user_id = $2',
    [creditCardId, userId]
  );

  if (cardCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Credit card not found.' });
  }

  let whereClause = 'WHERE cct.credit_card_id = $1';
  const params = [creditCardId];
  let paramIndex = 2;

  if (startDate) {
    whereClause += ` AND cct.transaction_date >= $${paramIndex++}`;
    params.push(startDate);
  }

  if (endDate) {
    whereClause += ` AND cct.transaction_date <= $${paramIndex++}`;
    params.push(endDate);
  }

  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_transactions,
      SUM(CASE WHEN cct.is_payment = true THEN cct.amount ELSE 0 END) as total_payments,
      SUM(CASE WHEN cct.is_payment = false THEN cct.amount ELSE 0 END) as total_purchases,
      SUM(cct.amount) as total_amount,
      SUM(cct.rewards_earned) as total_rewards,
      AVG(cct.amount) as average_amount,
      MIN(cct.amount) as min_amount,
      MAX(cct.amount) as max_amount,
      COUNT(CASE WHEN cct.foreign_transaction = true THEN 1 END) as foreign_transaction_count
    FROM credit_card_transactions cct
    ${whereClause}
  `, params);

  // Get category breakdown
  const categoryResult = await pool.query(`
    SELECT 
      cat.name as category,
      COUNT(*) as transaction_count,
      SUM(cct.amount) as total_amount,
      AVG(cct.amount) as average_amount
    FROM credit_card_transactions cct
    LEFT JOIN categories cat ON cct.category_id = cat.id
    ${whereClause} AND cct.category_id IS NOT NULL
    GROUP BY cat.name
    ORDER BY total_amount DESC
  `, params);

  res.json({
    summary: result.rows[0],
    categoryBreakdown: categoryResult.rows
  });
});
