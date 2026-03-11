const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const creditCardPaymentService = require('../services/creditCardPaymentService');
const { validatePayment } = require('../middleware/validation');

router.use(auth);

/**
 * @swagger
 * /api/credit-cards/{id}/payment:
 *   post:
 *     summary: Make a payment towards credit card
 *     tags: [Credit Cards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Credit card ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentAmount
 *               - paymentMethod
 *             properties:
 *               paymentAmount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Payment amount
 *               paymentMethod:
 *                 type: string
 *                 enum: [bank_transfer, check, online, auto]
 *                 description: Payment method
 *               paymentDate:
 *                 type: string
 *                 format: date
 *                 description: Payment date (optional, defaults to today)
 *               notes:
 *                 type: string
 *                 description: Payment notes
 *               isMinimumPayment:
 *                 type: boolean
 *                 description: Whether this is a minimum payment
 *               accountId:
 *                 type: integer
 *                 description: ID of account to fund payment from
 *               isCash:
 *                 type: boolean
 *                 description: Whether payment is funded by Cash
 *               cashSource:
 *                 type: string
 *                 description: Name of cash source if fueled by cash
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Credit card not found
 */
router.post('/:id/payment', validatePayment, async (req, res) => {
  try {
    const result = await creditCardPaymentService.makePayment(
      { ...req.body, creditCardId: req.params.id },
      req.user.userId
    );
    
    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/credit-cards/{id}/payments:
 *   get:
 *     summary: Get payment history for a credit card
 *     tags: [Credit Cards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Credit card ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
 */
router.get('/:id/payments', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await creditCardPaymentService.getPaymentHistory(
      req.params.id,
      req.user.userId,
      { page: parseInt(page), limit: parseInt(limit) }
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/credit-cards/schedule-payment:
 *   post:
 *     summary: Schedule automatic credit card payments
 *     tags: [Credit Cards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - creditCardId
 *               - paymentAmount
 *               - paymentMethod
 *               - scheduleType
 *               - nextPaymentDate
 *             properties:
 *               creditCardId:
 *                 type: string
 *                 format: uuid
 *                 description: Credit card ID
 *               paymentAmount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Payment amount
 *               paymentMethod:
 *                 type: string
 *                 enum: [bank_transfer, check, online]
 *                 description: Payment method
 *               scheduleType:
 *                 type: string
 *                 enum: [weekly, biweekly, monthly]
 *                 description: Payment frequency
 *               nextPaymentDate:
 *                 type: string
 *                 format: date
 *                 description: Next payment date
 *               autoPayMinimum:
 *                 type: boolean
 *                 default: false
 *                 description: Pay minimum due instead of full amount
 *     responses:
 *       200:
 *         description: Payment scheduled successfully
 */
router.post('/schedule-payment', async (req, res) => {
  try {
    const result = await creditCardPaymentService.scheduleAutoPayment(
      req.body,
      req.user.userId
    );
    
    res.json({
      success: true,
      message: 'Auto payment scheduled successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/credit-cards/scheduled-payments:
 *   get:
 *     summary: Get all scheduled payments for user
 *     tags: [Credit Cards]
 *     parameters:
 *       - in: query
 *         name: creditCardId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific credit card (optional)
 *     responses:
 *       200:
 *         description: Scheduled payments retrieved successfully
 */
router.get('/scheduled-payments', async (req, res) => {
  try {
    const { creditCardId } = req.query;
    const result = await creditCardPaymentService.getScheduledPayments(
      req.user.userId,
      creditCardId
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
