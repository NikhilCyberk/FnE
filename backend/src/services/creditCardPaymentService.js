const pool = require('../../db');
const logger = require('../../logger');
const asyncHandler = require('../../middleware/asyncHandler');

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
      cashSource = null
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

      // Validate payment amount
      if (paymentAmount > (creditCard.total_payment_due || 0)) {
        throw new Error('Payment amount exceeds total due');
      }

      // Create payment transaction
      const paymentResult = await pool.query(
        `INSERT INTO credit_card_payments (
           credit_card_id, payment_amount, payment_method, payment_date,
           notes, is_minimum_payment, user_id, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP) RETURNING *`,
        [creditCardId, paymentAmount, paymentMethod, paymentDate, notes, isMinimumPayment, userId]
      );

      const payment = paymentResult.rows[0];

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
        const transactionNotes = `Linked to credit card payment ${payment.id}. ${notes || ''}`;

        await pool.query(
            `INSERT INTO transactions (
                user_id, account_id, category_id, amount, type, status,
                description, transaction_date, posted_date, notes,
                is_recurring, is_cash, cash_source, source_description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            [
                userId, finalAccountId, categoryId, paymentAmount, 'expense', 'completed',
                transactionDescription, paymentDate, paymentDate, transactionNotes,
                false, isCash, isCash ? cashSource : null, isCash ? 'Credit Card Payment' : null
            ]
        );
      }

      // Update credit card payment info
      const newTotalDue = Math.max(0, (creditCard.total_payment_due || 0) - paymentAmount);
      const newMinDue = newTotalDue * 0.03; // 3% minimum payment
      
      await pool.query(
        `UPDATE credit_cards SET 
           total_payment_due = $1,
           min_payment_due = $2,
           bill_paid = $3,
           bill_paid_on = $4,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [
          newTotalDue <= 0.01 ? 0 : newTotalDue,
          newTotalDue <= 0.01 ? 0 : newMinDue,
          newTotalDue <= 0.01,
          newTotalDue <= 0.01 ? paymentDate : null,
          creditCardId
        ]
      );

      await pool.query('COMMIT');

      logger.businessLogger.logPaymentCreated(payment.id, userId, creditCardId, paymentAmount);
      
      return {
        payment,
        updatedCard: {
          ...creditCard,
          total_payment_due: newTotalDue <= 0.01 ? 0 : newTotalDue,
          min_payment_due: newTotalDue <= 0.01 ? 0 : newMinDue,
          bill_paid: newTotalDue <= 0.01,
          bill_paid_on: newTotalDue <= 0.01 ? paymentDate : null
        }
      };
    } catch (error) {
      await pool.query('ROLLBACK');
      logger.dbLogger.logTransactionError('makePayment', error);
      throw new Error('Failed to process credit card payment');
    }
  }

  async getPaymentHistory(creditCardId, userId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    try {
      const result = await pool.query(
        `SELECT 
           ccp.*,
           TO_CHAR(ccp.payment_date, 'YYYY-MM-DD') as formatted_date,
           CASE 
             WHEN ccp.is_minimum_payment THEN 'Minimum Payment'
             ELSE 'Full Payment'
           END as payment_type
         FROM credit_card_payments ccp
         WHERE ccp.credit_card_id = $1 AND ccp.user_id = $2
         ORDER BY ccp.payment_date DESC
         LIMIT $3 OFFSET $4`,
        [creditCardId, userId, limit, offset]
      );

      // Get total count
      const countResult = await pool.query(
        'SELECT COUNT(*) as total FROM credit_card_payments WHERE credit_card_id = $1 AND user_id = $2',
        [creditCardId, userId]
      );

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        payments: result.rows,
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
      logger.dbLogger.logTransactionError('getPaymentHistory', error);
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

      logger.businessLogger.logAutoPaymentScheduled(result.rows[0].id, userId, creditCardId, scheduleType);
      
      return result.rows[0];
    } catch (error) {
      logger.dbLogger.logTransactionError('scheduleAutoPayment', error);
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
      logger.dbLogger.logTransactionError('getScheduledPayments', error);
      throw new Error('Failed to retrieve scheduled payments');
    }
  }
}

module.exports = new CreditCardPaymentService();
