const pool = require('../db');
const logger = require('../logger');

class TransactionService {
  async createTransaction(transactionData, userId) {
    const { 
      description, 
      amount, 
      type, 
      accountId, 
      categoryId, 
      date = new Date(),
      merchant,
      notes,
      status = 'completed'
    } = transactionData;

    // Validate transaction data
    if (!description || !amount || !type || !accountId) {
      throw new Error('Description, amount, type, and account ID are required');
    }

    const validTypes = ['income', 'expense', 'transfer'];
    if (!validTypes.includes(type)) {
      throw new Error('Invalid transaction type');
    }

    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    try {
      // Start transaction
      await pool.query('BEGIN');

      // Resolve merchant name to ID
      let merchantId = null;
      if (merchant) {
        const mResult = await pool.query(
          'INSERT INTO merchants (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
          [merchant]
        );
        merchantId = mResult.rows[0].id;
      }

      // Create transaction
      const result = await pool.query(
        `INSERT INTO transactions (
           user_id, account_id, category_id, description, amount, type, 
           transaction_date, merchant_id, notes, status, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP) RETURNING *`,
        [userId, accountId, categoryId, description, amount, type, date, merchantId, notes, status]
      );

      const newTransaction = result.rows[0];

      // Update account balance
      const balanceChange = type === 'income' ? amount : -amount;
      await pool.query(
        'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [balanceChange, accountId]
      );

      await pool.query('COMMIT');

      logger.businessLogger.logTransactionCreated(newTransaction.id, userId, amount, type);
      
      return newTransaction;
    } catch (error) {
      await pool.query('ROLLBACK');
      logger.dbLogger.logTransactionError('createTransaction', error);
      throw new Error('Failed to create transaction');
    }
  }

  async getTransactionsByUserId(userId, options = {}) {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'date', 
      sortOrder = 'desc',
      categoryId,
      type,
      search,
      dateFrom,
      dateTo
    } = options;

    const offset = (page - 1) * limit;
    
    try {
      let query = `
        SELECT 
          t.id, t.amount, t.type, t.status, t.description, m.name as merchant, t.location,
          t.transaction_date, t.posted_date, t.reference_number, t.notes,
          t.is_recurring, t.created_at, t.updated_at,
          a.account_name, a.account_number_masked,
          c.name as category_name, c.color as category_color, c.icon as category_icon,
          ta.account_name as transfer_account_name
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN accounts ta ON t.transfer_account_id = ta.id
        LEFT JOIN merchants m ON t.merchant_id = m.id
        WHERE t.user_id = $1
      `;
      
      const params = [userId];
      let paramIndex = 2;

      // Add filters
      if (categoryId) {
        query += ` AND t.category_id = $${paramIndex++}`;
        params.push(categoryId);
      }

      if (type) {
        query += ` AND t.type = $${paramIndex++}`;
        params.push(type);
      }

      if (search) {
        query += ` AND (t.description ILIKE $${paramIndex++} OR m.name ILIKE $${paramIndex++})`;
        params.push(`%${search}%`, `%${search}%`);
        paramIndex += 2;
      }

      if (dateFrom) {
        query += ` AND t.transaction_date >= $${paramIndex++}`;
        params.push(dateFrom);
      }

      if (dateTo) {
        query += ` AND t.transaction_date <= $${paramIndex++}`;
        params.push(dateTo);
      }

      // Add sorting and pagination
      query += ` ORDER BY t.${sortBy} ${sortOrder} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total FROM transactions t
        WHERE t.user_id = $1
      `;
      const countParams = [userId];
      let countParamIndex = 2;

      if (categoryId) {
        countQuery += ` AND t.category_id = $${countParamIndex++}`;
        countParams.push(categoryId);
      }

      if (type) {
        countQuery += ` AND t.type = $${countParamIndex++}`;
        countParams.push(type);
      }

      if (search) {
        countQuery += ` AND (t.description ILIKE $${countParamIndex++} OR m.name ILIKE $${countParamIndex++})`;
        countParams.push(`%${search}%`, `%${search}%`);
        countParamIndex += 2;
      }

      if (dateFrom) {
        countQuery += ` AND t.transaction_date >= $${countParamIndex++}`;
        countParams.push(dateFrom);
      }

      if (dateTo) {
        countQuery += ` AND t.transaction_date <= $${countParamIndex++}`;
        countParams.push(dateTo);
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        transactions: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.dbLogger.logTransactionError('getTransactionsByUserId', error);
      throw new Error('Failed to retrieve transactions');
    }
  }

  async getTransactionById(transactionId, userId) {
    try {
      const result = await pool.query(
        `SELECT 
          t.id, t.amount, t.type, t.status, t.description, m.name as merchant, t.location,
          t.transaction_date, t.posted_date, t.reference_number, t.notes,
          t.is_recurring, t.created_at, t.updated_at,
          a.account_name, a.account_number_masked,
          c.name as category_name, c.color as category_color, c.icon as category_icon,
          ta.account_name as transfer_account_name
         FROM transactions t
         LEFT JOIN accounts a ON t.account_id = a.id
         LEFT JOIN categories c ON t.category_id = c.id
         LEFT JOIN accounts ta ON t.transfer_account_id = ta.id
         LEFT JOIN merchants m ON t.merchant_id = m.id
         WHERE t.id = $1 AND t.user_id = $2`,
        [transactionId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      return result.rows[0];
    } catch (error) {
      if (error.message === 'Transaction not found') {
        throw error;
      }
      logger.dbLogger.logTransactionError('getTransactionById', error);
      throw new Error('Failed to retrieve transaction');
    }
  }

  async updateTransaction(transactionId, userId, updateData) {
    const { description, amount, type, categoryId, date, merchant, notes, status } = updateData;
    
    if (!description && !amount && !type && !categoryId && !date && !merchant && !notes && !status) {
      throw new Error('At least one field must be provided for update');
    }

    try {
      // Get original transaction for balance adjustment
      const originalResult = await pool.query(
        'SELECT amount, type, account_id FROM transactions WHERE id = $1 AND user_id = $2',
        [transactionId, userId]
      );

      if (originalResult.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      const originalTransaction = originalResult.rows[0];

      // Build update query
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      if (description) {
        setClause.push(`description = $${paramIndex++}`);
        values.push(description);
      }
      if (amount) {
        setClause.push(`amount = $${paramIndex++}`);
        values.push(amount);
      }
      if (type) {
        setClause.push(`type = $${paramIndex++}`);
        values.push(type);
      }
      if (categoryId) {
        setClause.push(`category_id = $${paramIndex++}`);
        values.push(categoryId);
      }
      if (date) {
        setClause.push(`transaction_date = $${paramIndex++}`);
        values.push(date);
      }
      if (merchant) {
        const mResult = await pool.query(
          'INSERT INTO merchants (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
          [merchant]
        );
        setClause.push(`merchant_id = $${paramIndex++}`);
        values.push(mResult.rows[0].id);
      }
      if (notes) {
        setClause.push(`notes = $${paramIndex++}`);
        values.push(notes);
      }
      if (status) {
        setClause.push(`status = $${paramIndex++}`);
        values.push(status);
      }

      values.push(transactionId, userId);

      await pool.query('BEGIN');

      // Update transaction
      const result = await pool.query(
        `UPDATE transactions SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        await pool.query('ROLLBACK');
        throw new Error('Transaction not found');
      }

      const updatedTransaction = result.rows[0];

      // Adjust account balance if amount or type changed
      if (amount || type) {
        const originalBalanceChange = originalTransaction.type === 'income' 
          ? originalTransaction.amount 
          : -originalTransaction.amount;
        
        const newBalanceChange = (type || originalTransaction.type) === 'income' 
          ? (amount || originalTransaction.amount) 
          : -(amount || originalTransaction.amount);

        const balanceAdjustment = newBalanceChange - originalBalanceChange;

        if (balanceAdjustment !== 0) {
          await pool.query(
            'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
            [balanceAdjustment, originalTransaction.account_id]
          );
        }
      }

      await pool.query('COMMIT');

      return updatedTransaction;
    } catch (error) {
      await pool.query('ROLLBACK');
      if (error.message === 'Transaction not found') {
        throw error;
      }
      logger.dbLogger.logTransactionError('updateTransaction', error);
      throw new Error('Failed to update transaction');
    }
  }

  async deleteTransaction(transactionId, userId) {
    try {
      // Get transaction details for balance adjustment
      const transactionResult = await pool.query(
        'SELECT amount, type, account_id FROM transactions WHERE id = $1 AND user_id = $2',
        [transactionId, userId]
      );

      if (transactionResult.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      const transaction = transactionResult.rows[0];

      await pool.query('BEGIN');

      // Delete transaction
      const result = await pool.query(
        'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *',
        [transactionId, userId]
      );

      // Adjust account balance
      const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
      await pool.query(
        'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
        [balanceChange, transaction.account_id]
      );

      await pool.query('COMMIT');

      return result.rows[0];
    } catch (error) {
      await pool.query('ROLLBACK');
      if (error.message === 'Transaction not found') {
        throw error;
      }
      logger.dbLogger.logTransactionError('deleteTransaction', error);
      throw new Error('Failed to delete transaction');
    }
  }

  async getTransactionSummary(userId, options = {}) {
    const { dateFrom, dateTo, categoryId } = options;

    try {
      let query = `
        SELECT 
           COUNT(*) as total_transactions,
           SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
           SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
           SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) - 
           SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as net_balance,
           AVG(amount) as avg_transaction,
           MAX(amount) as max_transaction,
           MIN(amount) as min_transaction
        FROM transactions 
        WHERE user_id = $1
      `;
      
      const params = [userId];
      let paramIndex = 2;

      if (dateFrom) {
        query += ` AND transaction_date >= $${paramIndex++}`;
        params.push(dateFrom);
      }

      if (dateTo) {
        query += ` AND transaction_date <= $${paramIndex++}`;
        params.push(dateTo);
      }

      if (categoryId) {
        query += ` AND category_id = $${paramIndex++}`;
        params.push(categoryId);
      }

      const result = await pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      logger.dbLogger.logTransactionError('getTransactionSummary', error);
      throw new Error('Failed to retrieve transaction summary');
    }
  }

  async getTransactionsByCategory(userId, categoryId, options = {}) {
    const { page = 1, limit = 10, dateFrom, dateTo } = options;

    try {
      const result = await pool.query(
        `SELECT t.*, a.name as account_name
         FROM transactions t
         LEFT JOIN accounts a ON t.account_id = a.id
         WHERE t.user_id = $1 AND t.category_id = $2
         AND ($3::date IS NULL OR t.transaction_date >= $3)
         AND ($4::date IS NULL OR t.transaction_date <= $4)
         ORDER BY t.transaction_date DESC
         LIMIT $5 OFFSET $6`,
        [userId, categoryId, dateFrom, dateTo, limit, (page - 1) * limit]
      );

      return result.rows;
    } catch (error) {
      logger.dbLogger.logTransactionError('getTransactionsByCategory', error);
      throw new Error('Failed to retrieve transactions by category');
    }
  }
}

module.exports = new TransactionService();
