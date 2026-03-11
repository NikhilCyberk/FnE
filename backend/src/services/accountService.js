const pool = require('../db');
const logger = require('../logger');

class AccountService {
  async createAccount(accountData, userId) {
    const { name, type, balance = 0, accountNumber, currency = 'INR' } = accountData;
    
    // Validate account data
    if (!name || !type || !accountNumber) {
      throw new Error('Account name, type, and account number are required');
    }

    const validTypes = ['savings', 'current', 'credit_card', 'cash'];
    if (!validTypes.includes(type)) {
      throw new Error('Invalid account type');
    }

    try {
      const result = await pool.query(
        `INSERT INTO accounts (user_id, name, type, balance, account_number, currency, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP) RETURNING *`,
        [userId, name, type, balance, accountNumber, currency]
      );

      const newAccount = result.rows[0];
      logger.businessLogger.logAccountCreation(newAccount.id, userId, type);
      
      return newAccount;
    } catch (error) {
      logger.dbLogger.logTransactionError('createAccount', error);
      throw new Error('Failed to create account');
    }
  }

  async getAccountsByUserId(userId, options = {}) {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = options;
    
    const offset = (page - 1) * limit;
    
    try {
      const result = await pool.query(
        `SELECT * FROM accounts 
         WHERE user_id = $1 
         ORDER BY ${sortBy} ${sortOrder}
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      // Get total count for pagination
      const countResult = await pool.query(
        'SELECT COUNT(*) as total FROM accounts WHERE user_id = $1',
        [userId]
      );

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        accounts: result.rows,
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
      logger.dbLogger.logTransactionError('getAccountsByUserId', error);
      throw new Error('Failed to retrieve accounts');
    }
  }

  async getAccountById(accountId, userId) {
    try {
      const result = await pool.query(
        'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
        [accountId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Account not found');
      }

      return result.rows[0];
    } catch (error) {
      if (error.message === 'Account not found') {
        throw error;
      }
      logger.dbLogger.logTransactionError('getAccountById', error);
      throw new Error('Failed to retrieve account');
    }
  }

  async updateAccount(accountId, userId, updateData) {
    const { name, type, currency } = updateData;
    
    if (!name && !type && !currency) {
      throw new Error('At least one field must be provided for update');
    }

    try {
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      if (name) {
        setClause.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (type) {
        setClause.push(`type = $${paramIndex++}`);
        values.push(type);
      }
      if (currency) {
        setClause.push(`currency = $${paramIndex++}`);
        values.push(currency);
      }

      values.push(accountId, userId);

      const result = await pool.query(
        `UPDATE accounts SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Account not found');
      }

      return result.rows[0];
    } catch (error) {
      if (error.message === 'Account not found') {
        throw error;
      }
      logger.dbLogger.logTransactionError('updateAccount', error);
      throw new Error('Failed to update account');
    }
  }

  async deleteAccount(accountId, userId) {
    try {
      // Check if account has transactions
      const transactionCount = await pool.query(
        'SELECT COUNT(*) as count FROM transactions WHERE account_id = $1',
        [accountId]
      );

      if (parseInt(transactionCount.rows[0].count) > 0) {
        throw new Error('Cannot delete account with existing transactions');
      }

      const result = await pool.query(
        'DELETE FROM accounts WHERE id = $1 AND user_id = $2 RETURNING *',
        [accountId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Account not found');
      }

      return result.rows[0];
    } catch (error) {
      if (error.message === 'Account not found' || error.message === 'Cannot delete account with existing transactions') {
        throw error;
      }
      logger.dbLogger.logTransactionError('deleteAccount', error);
      throw new Error('Failed to delete account');
    }
  }

  async updateBalance(accountId, newBalance) {
    try {
      const result = await pool.query(
        'UPDATE accounts SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [newBalance, accountId]
      );

      if (result.rows.length === 0) {
        throw new Error('Account not found');
      }

      return result.rows[0];
    } catch (error) {
      if (error.message === 'Account not found') {
        throw error;
      }
      logger.dbLogger.logTransactionError('updateBalance', error);
      throw new Error('Failed to update balance');
    }
  }

  async getAccountBalance(accountId, userId) {
    try {
      const result = await pool.query(
        'SELECT balance FROM accounts WHERE id = $1 AND user_id = $2',
        [accountId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Account not found');
      }

      return result.rows[0].balance;
    } catch (error) {
      if (error.message === 'Account not found') {
        throw error;
      }
      logger.dbLogger.logTransactionError('getAccountBalance', error);
      throw new Error('Failed to retrieve account balance');
    }
  }

  async getAccountSummary(userId) {
    try {
      const result = await pool.query(
        `SELECT 
           COUNT(*) as total_accounts,
           SUM(CASE WHEN type = 'savings' THEN 1 ELSE 0 END) as savings_accounts,
           SUM(CASE WHEN type = 'current' THEN 1 ELSE 0 END) as current_accounts,
           SUM(CASE WHEN type = 'credit_card' THEN 1 ELSE 0 END) as credit_card_accounts,
           SUM(balance) as total_balance,
           SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END) as positive_balance,
           SUM(CASE WHEN balance < 0 THEN balance ELSE 0 END) as negative_balance
         FROM accounts WHERE user_id = $1`,
        [userId]
      );

      return result.rows[0];
    } catch (error) {
      logger.dbLogger.logTransactionError('getAccountSummary', error);
      throw new Error('Failed to retrieve account summary');
    }
  }
}

module.exports = new AccountService();
