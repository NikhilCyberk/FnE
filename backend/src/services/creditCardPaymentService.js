const pool = require('../db');
const logger = require('../logger');
const asyncHandler = require('../middleware/asyncHandler');

class CreditCardPaymentService {
  async makePayment(paymentData, userId) {
    const { 
      creditCardId, 
      paymentAmount, 
      paymentMethod, 
      paymentDate = new Date(),
      notes,
      isMinimumPayment = false,
      accountId,
      isCash = false,
      cashSourceId = null
    } = paymentData;

    // Validate payment data
    if (!creditCardId || !paymentAmount || paymentAmount <= 0) {
      throw new Error('Credit card ID and payment amount are required');
    }

    try {
      await pool.query('BEGIN');

      // Get credit card details
      const cardResult = await pool.query(
        'SELECT * FROM credit_cards WHERE id = $1 AND user_id = $2',
        [creditCardId, userId]
      );

      if (cardResult.rows.length === 0) {
        throw new Error('Credit card not found');
      }

      const creditCard = cardResult.rows[0];

      // Validate payment amount (against current_balance or statement_balance)
      if (paymentAmount > Math.max((creditCard.current_balance || 0), (creditCard.statement_balance || 0))) {
        throw new Error('Payment amount exceeds total due');
      }

      // We no longer use a separate credit_card_payments table. 
      // All logic will now revolve around credit_card_transactions with is_payment = true.
      let mainTransactionId = null;

      // If either accountId or isCash is provided, we deduct the amount from that source by creating an expense transaction
      if (accountId || isCash) {
        let finalAccountId = accountId;
        
        // Ensure cash account exists if isCash is true
        if (isCash) {
            const cashAccountResult = await pool.query('SELECT get_or_create_cash_account($1) as account_id', [userId]);
            finalAccountId = cashAccountResult.rows[0].account_id;
        }

        // Try to get a standard "Credit Card Payment" category, or default to general/null if none exists
        // This makes sure the expense is categorized correctly
        const categoryResult = await pool.query(
          "SELECT id FROM categories WHERE user_id = $1 AND name = 'Credit Card Payment'", [userId]
        );
        let categoryId = null;
        if (categoryResult.rows.length > 0) {
            categoryId = categoryResult.rows[0].id;
        }

        const transactionDescription = `Payment for Credit Card: ${creditCard.card_name}`;
        const transactionNotes = `Linked to credit card payment. ${notes || ''}`;

        const mainTxResult = await pool.query(
            `INSERT INTO transactions (
                user_id, account_id, category_id, amount, type, status,
                description, transaction_date, posted_date, notes,
                is_recurring, cash_source, source_description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id`,
            [
                userId, finalAccountId, categoryId, paymentAmount, 'expense', 'completed',
                transactionDescription, paymentDate, paymentDate, transactionNotes,
                false, isCash ? 'cash' : null, isCash ? (cashSourceId || 'Credit Card Payment') : 'Credit Card Payment'
            ]
        );
        mainTransactionId = mainTxResult.rows[0].id;
      }

      // Add actual credit card transaction for the payment so it shows in the history
      // We pass main_transaction_id to prevent the DB trigger from creating a duplicate
      const paymentTxResult = await pool.query(
        `INSERT INTO credit_card_transactions (
           credit_card_id, transaction_date, posted_date, description,
           amount, transaction_type, is_payment, payment_method, main_transaction_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          creditCardId, 
          paymentDate, 
          paymentDate, 
          'Payment - Thank You', 
          paymentAmount, 
          'payment', 
          true, 
          paymentMethod,
          mainTransactionId
        ]
      );

      const payment = paymentTxResult.rows[0];

      // Update credit card info
      // NOTE: current_balance and available_credit are automatically updated by the 
      // trigger_update_credit_card_balance on credit_card_transactions.
      // We only need to update the statement_balance, minimum_payment, and last_payment info.
      const newStatementBalance = Math.max(0, (creditCard.statement_balance || 0) - paymentAmount);
      const newMinDue = newStatementBalance * 0.03; // 3% minimum payment
      
      await pool.query(
        `UPDATE credit_cards SET 
           statement_balance = $1,
           minimum_payment = $2,
           last_payment_amount = $3,
           last_payment_date = $4,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [
          newStatementBalance,
          newStatementBalance <= 0.01 ? 0 : newMinDue,
          paymentAmount,
          paymentDate,
          creditCardId
        ]
      );

      // Refetch updated card to return accurate current_balance and available_credit (after triggers)
      const updatedCardResult = await pool.query(
        'SELECT * FROM credit_cards WHERE id = $1',
        [creditCardId]
      );
      const updatedCard = updatedCardResult.rows[0];

      await pool.query('COMMIT');

      logger.info(`Payment created: ${payment.id} for user ${userId} and card ${creditCardId} with amount ${paymentAmount}`);
      
      return {
        payment: {
            ...payment,
            payment_amount: payment.amount, // Alias for frontend compatibility if needed
            payment_date: payment.transaction_date
        },
        updatedCard
      };
    } catch (error) {
      await pool.query('ROLLBACK');
      logger.error(`Error in makePayment: ${error.message}`, { error });
      throw new Error('Failed to process credit card payment');
    }
  }

  async getPaymentHistory(creditCardId, userId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    try {
      const result = await pool.query(
        `SELECT 
           cct.*,
           cct.amount as payment_amount,
           TO_CHAR(cct.transaction_date, 'YYYY-MM-DD') as formatted_date,
           'Credit Card Payment' as payment_type
         FROM credit_card_transactions cct
         JOIN credit_cards cc ON cct.credit_card_id = cc.id
         WHERE cct.credit_card_id = $1 AND cc.user_id = $2 AND cct.is_payment = true
         ORDER BY cct.transaction_date DESC
         LIMIT $3 OFFSET $4`,
        [creditCardId, userId, limitNum, offset]
      );

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) as total 
         FROM credit_card_transactions cct
         JOIN credit_cards cc ON cct.credit_card_id = cc.id
         WHERE cct.credit_card_id = $1 AND cc.user_id = $2 AND cct.is_payment = true`,
        [creditCardId, userId]
      );

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limitNum);

      return {
        payments: result.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      };
    } catch (error) {
      logger.error(`Error in getPaymentHistory: ${error.message}`, { error });
      throw new Error('Failed to retrieve payment history');
    }
  }

  async scheduleAutoPayment(paymentData, userId) {
    const { 
      creditCardId, 
      paymentAmount, 
      paymentMethod,
      scheduleType, // 'monthly', 'biweekly', 'weekly'
      nextPaymentDate,
      autoPayMinimum = false 
    } = paymentData;

    try {
      const result = await pool.query(
        `INSERT INTO scheduled_credit_card_payments (
           credit_card_id, user_id, payment_amount, payment_method,
           schedule_type, next_payment_date, auto_pay_minimum, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP) RETURNING *`,
        [creditCardId, userId, paymentAmount, paymentMethod, scheduleType, nextPaymentDate, autoPayMinimum]
      );

      logger.info(`Auto payment scheduled: ${result.rows[0].id} for user ${userId} and card ${creditCardId}`);
      
      return result.rows[0];
    } catch (error) {
      logger.error(`Error in scheduleAutoPayment: ${error.message}`, { error });
      throw new Error('Failed to schedule auto payment');
    }
  }

  async getScheduledPayments(userId, creditCardId = null) {
    try {
      let query = `
        SELECT 
           scp.*,
           cc.card_name,
           TO_CHAR(scp.next_payment_date, 'YYYY-MM-DD') as formatted_date
         FROM scheduled_credit_card_payments scp
         JOIN credit_cards cc ON scp.credit_card_id = cc.id
         WHERE scp.user_id = $1 AND scp.is_active = true
      `;
      const params = [userId];

      if (creditCardId) {
        query += ' AND scp.credit_card_id = $2';
        params.push(creditCardId);
      }

      query += ' ORDER BY scp.next_payment_date ASC';

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error(`Error in getScheduledPayments: ${error.message}`, { error });
      throw new Error('Failed to retrieve scheduled payments');
    }
  }
}

module.exports = new CreditCardPaymentService();
